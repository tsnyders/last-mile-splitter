"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/supabase/database.types";
import { useToast } from "@/components/Toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const hasSubscribedRealtime = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  }, [supabase]);

  // Check current push permission state
  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription — also triggers push send for new notifications
  useEffect(() => {
    if (hasSubscribedRealtime.current) return;
    hasSubscribedRealtime.current = true;

    const channel = supabase
      .channel("my-notifications-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async (payload) => {
          fetchNotifications();
          const newNotif = payload.new as Notification;
          // Fire push notification via our API
          try {
            await fetch("/api/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: newNotif.user_id,
                title: "Ride Splitter",
                body: newNotif.message,
              }),
            });
          } catch {
            // Push send failed silently
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      hasSubscribedRealtime.current = false;
    };
  }, [supabase, fetchNotifications]);

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast("Push notifications aren't supported in this browser.", "error");
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast("Notification permission denied.", "error");
        setPushLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast("Push not configured.", "error");
        setPushLoading(false);
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      setPushEnabled(true);
      toast("Push notifications enabled!", "success");
    } catch (err) {
      console.error("Push subscribe error:", err);
      toast("Failed to enable push notifications.", "error");
    } finally {
      setPushLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggle = () => {
    if (!open) markAllRead();
    setOpen((o) => !o);
  };

  const timeAgo = (created: string) => {
    const diff = Date.now() - new Date(created).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition relative"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="opacity-80 animate-pulse" />
        ) : (
          <Bell size={18} className="opacity-80" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="bg-[#0f2027] fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-20 w-72 glass-card rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <p className="text-sm font-medium">Notifications</p>
              {!pushEnabled && (
                <button
                  type="button"
                  onClick={subscribeToPush}
                  disabled={pushLoading}
                  className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                >
                  {pushLoading ? "…" : "Enable push"}
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm opacity-50 text-center">
                  No notifications yet
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 text-sm border-b border-white/5 ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <p>{n.message}</p>
                    <p className="text-xs opacity-50 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
