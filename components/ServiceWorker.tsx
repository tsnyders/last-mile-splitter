"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    // Check if previously dismissed (respect for 24h)
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    // Android / Chrome: capture the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after a short delay
    if (isIos()) {
      const timer = setTimeout(() => setShowIosBanner(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosBanner(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (dismissed || isInStandaloneMode()) return null;

  // Android / Desktop banner
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Install Ride Splitter</p>
            <p className="text-xs opacity-60 truncate">
              Add to home screen for the full app experience
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-foreground text-white dark:text-gray-900 text-xs font-medium hover:opacity-90 transition"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition"
            aria-label="Dismiss"
          >
            <X size={16} className="opacity-60" />
          </button>
        </div>
      </div>
    );
  }

  // iOS banner with manual instructions
  if (showIosBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
        <div className="glass-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Download size={20} />
              </div>
              <p className="text-sm font-medium">Install Ride Splitter</p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition"
              aria-label="Dismiss"
            >
              <X size={16} className="opacity-60" />
            </button>
          </div>
          <div className="flex items-center gap-2 pl-[52px] text-xs opacity-70">
            <span>Tap</span>
            <Share size={14} className="inline" />
            <span>then &quot;Add to Home Screen&quot;</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
