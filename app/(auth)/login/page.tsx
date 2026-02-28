"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (!callbackError) return null;
    if (callbackError === "confirmation_failed") {
      return "Email confirmation failed or the link expired. Please sign up again.";
    }
    return callbackError.replace(/\+/g, " ");
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Log in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 font-sans">
      <main className="w-full max-w-md">
        <div className="glass-card p-8 flex flex-col gap-6">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="text-sm opacity-70">
            Sign in to post rides and join others.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium opacity-80 mb-1"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass-input px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium opacity-80 mb-1"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full glass-input px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-foreground text-white dark:text-gray-900 font-medium hover:opacity-90 transition disabled:opacity-70"
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>
          <p className="text-sm opacity-70 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium underline hover:opacity-90"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
