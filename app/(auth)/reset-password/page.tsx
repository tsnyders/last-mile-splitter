"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 font-sans">
        <main className="w-full max-w-md">
          <div className="glass-card p-8 flex flex-col gap-4 text-center">
            <div className="text-4xl">✅</div>
            <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
            <p className="text-sm opacity-70">Redirecting you to the home page…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 font-sans">
      <main className="w-full max-w-md">
        <div className="glass-card p-8 flex flex-col gap-6">
          <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="text-sm opacity-70">
            Choose a new password for your account.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium opacity-80 mb-1">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full glass-input px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium opacity-80 mb-1">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full glass-input px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="Type it again"
                autoComplete="new-password"
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
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
