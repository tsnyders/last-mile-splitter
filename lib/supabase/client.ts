import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components (browser).
 * Use this for Realtime subscriptions, auth in the browser, and client-side data fetching.
 *
 * Realtime example:
 *   const supabase = createClient();
 *   const channel = supabase
 *     .channel('rides')
 *     .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => { ... })
 *     .subscribe();
 *   return () => { supabase.removeChannel(channel); };
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local"
    );
  }

  return createBrowserClient(url, key);
}
