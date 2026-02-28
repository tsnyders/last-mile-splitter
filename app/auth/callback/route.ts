import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            full_name: user.user_metadata?.full_name ?? null,
          },
          { onConflict: "id" }
        );
      }

      // If this was a password reset, redirect to the reset page
      const redirectTo = next === "/reset-password" ? "/reset-password" : next;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
