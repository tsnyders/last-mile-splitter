"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="w-full flex justify-between items-center mb-8">
      <Link href="/" className="text-2xl font-semibold tracking-tight flex items-center gap-2 hover:opacity-90">
        <Car size={26} aria-hidden />
        Ride Splitter
      </Link>

      <div className="relative">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <User size={20} className="opacity-80" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-20 min-w-[180px] glass-card py-2 rounded-xl shadow-lg">
                  <p className="px-4 py-2 text-sm opacity-80 truncate border-b border-white/10">
                    {user.email || "Signed in"}
                  </p>
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Car size={16} /> My rides
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full glass-card text-sm font-medium hover:bg-white/10 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full bg-foreground text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
