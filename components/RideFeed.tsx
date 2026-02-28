"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RideWithCreator } from "@/lib/supabase/database.types";
import { rideToCardProps } from "@/lib/supabase/database.types";
import RideCard, { RideCardSkeleton } from "@/components/RideCards";
import { useToast } from "@/components/Toast";

type FeedTab = "all" | "mine";

export default function RideFeed() {
  const [rides, setRides] = useState<RideWithCreator[]>([]);
  const [joinedRideIds, setJoinedRideIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<FeedTab>("all");
  const supabase = createClient();
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    return user?.id ?? null;
  }, [supabase]);

  const fetchRides = useCallback(async () => {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("rides")
      .select("*, profiles:creator_id!left(full_name)")
      .in("status", ["open", "full"])
      .gte("departure_time", cutoff)
      .order("departure_time", { ascending: true });
    if (error) {
      console.error("[fetchRides]", error);
      // Fallback: try without the profile join
      const { data: fallback } = await supabase
        .from("rides")
        .select("*")
        .in("status", ["open", "full"])
        .gte("departure_time", cutoff)
        .order("departure_time", { ascending: true });
      if (fallback) setRides(fallback.map((r) => ({ ...r, profiles: null })) as RideWithCreator[]);
      return;
    }
    if (data) setRides(data as RideWithCreator[]);
  }, [supabase]);

  const fetchMyParticipations = useCallback(async (uid: string | null) => {
    if (!uid) {
      setJoinedRideIds(new Set());
      return;
    }
    const { data } = await supabase
      .from("ride_participants")
      .select("ride_id")
      .eq("user_id", uid);
    setJoinedRideIds(new Set((data ?? []).map((r) => r.ride_id)));
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const uid = await fetchUser();
      await Promise.all([fetchRides(), fetchMyParticipations(uid)]);
      setLoading(false);
    })();
  }, [fetchUser, fetchRides, fetchMyParticipations]);

  useEffect(() => {
    const channel = supabase
      .channel("rides-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        () => fetchRides()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchRides]);

  const handleJoin = useCallback(
    async (rideId: string) => {
      if (!userId) {
        toast("Please sign in to join a ride.", "error");
        return;
      }
      const { error } = await supabase
        .from("ride_participants")
        .insert({ ride_id: rideId, user_id: userId });
      if (error) {
        toast("Failed to join ride.", "error");
        return;
      }
      setJoinedRideIds((prev) => new Set(prev).add(rideId));
      toast("You joined the ride!", "success");
      fetchRides();
    },
    [supabase, userId, fetchRides, toast]
  );

  const handleLeave = useCallback(
    async (rideId: string) => {
      if (!userId) return;
      await supabase
        .from("ride_participants")
        .delete()
        .eq("ride_id", rideId)
        .eq("user_id", userId);
      setJoinedRideIds((prev) => {
        const next = new Set(prev);
        next.delete(rideId);
        return next;
      });
      toast("You left the ride.", "info");
      fetchRides();
    },
    [supabase, userId, fetchRides, toast]
  );

  const handleCancel = useCallback(
    async (rideId: string) => {
      if (!userId) return;
      await supabase
        .from("rides")
        .update({ status: "canceled" })
        .eq("id", rideId)
        .eq("creator_id", userId);
      toast("Ride canceled.", "info");
      fetchRides();
    },
    [supabase, userId, fetchRides, toast]
  );

  const filteredRides = tab === "mine" && userId
    ? rides.filter(
        (r) => r.creator_id === userId || joinedRideIds.has(r.id)
      )
    : rides;

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <RideCardSkeleton />
        <RideCardSkeleton />
        <RideCardSkeleton />
      </div>
    );
  }

  return (
    <>
      {userId && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === "all"
                ? "bg-foreground text-white dark:text-gray-900"
                : "glass-card hover:bg-white/10"
            }`}
          >
            All Rides
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === "mine"
                ? "bg-foreground text-white dark:text-gray-900"
                : "glass-card hover:bg-white/10"
            }`}
          >
            My Rides
          </button>
        </div>
      )}

      {filteredRides.length === 0 ? (
        <div className="w-full py-8 text-center text-sm opacity-70">
          {tab === "mine"
            ? "You haven't posted or joined any rides yet."
            : "No open rides right now. Post one above!"}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {filteredRides.map((ride) => {
            const props = rideToCardProps(ride);
            return (
              <RideCard
                key={ride.id}
                id={props.id}
                time={props.time}
                relativeTime={props.relativeTime}
                destination={props.destination}
                leavingFrom={props.leavingFrom}
                seatsFilled={props.seatsFilled}
                seatsTotal={props.seatsTotal}
                creatorName={props.creatorName}
                creatorId={props.creatorId}
                currentUserId={userId}
                isJoined={joinedRideIds.has(ride.id)}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onCancel={handleCancel}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
