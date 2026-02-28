"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 font-sans">
        <main className="w-full max-w-md">
          <div className="glass-card p-8 flex flex-col gap-4 text-center">
            <div className="text-4xl">📧</div>
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm opacity-70">
              We sent a confirmation link to <strong>{email}</strong>.
              <br />
              Click the link to activate your account.
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
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm opacity-70">
            Sign up to post rides and join others.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium opacity-80 mb-1">
                Full name (optional)
              </label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium opacity-80 mb-1">
                Email
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="block text-sm font-medium opacity-80 mb-1">
                Password
              </label>
              <input
                id="signup-password"
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
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-foreground text-white dark:text-gray-900 font-medium hover:opacity-90 transition disabled:opacity-70"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
          <p className="text-sm opacity-70 text-center">
            Already have an account?{" "}
            <Link href="/login" className="font-medium underline hover:opacity-90">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
