"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 font-sans">
        <main className="w-full max-w-md">
          <div className="glass-card p-8 flex flex-col gap-4 text-center">
            <div className="text-4xl">📧</div>
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm opacity-70">
              We sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link
              href="/login"
              className="mt-4 text-sm font-medium underline opacity-70 hover:opacity-100 transition"
            >
              Back to log in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 font-sans">
      <main className="w-full max-w-md">
        <div className="glass-card p-8 flex flex-col gap-6">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm opacity-70">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium opacity-80 mb-1">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass-input px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="you@example.com"
                autoComplete="email"
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <p className="text-sm opacity-70 text-center">
            Remember your password?{" "}
            <Link href="/login" className="font-medium underline hover:opacity-90">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
