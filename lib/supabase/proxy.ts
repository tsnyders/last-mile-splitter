import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session and syncs cookies to the response.
 * Call this from proxy.ts so expired tokens are refreshed and cookies are written.
 */
export async function updateSession(request: NextRequest) {
  // Supabase redirects auth errors (e.g. expired OTP) to the site root with ?error= params.
  // Catch those and redirect to /login so users see a helpful message.
  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam && request.nextUrl.pathname === "/") {
    const errorDesc = request.nextUrl.searchParams.get("error_description") || errorParam;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?error=${encodeURIComponent(errorDesc)}`;
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session; validates JWT and updates cookies if needed
  await supabase.auth.getUser();

  return supabaseResponse;
}
