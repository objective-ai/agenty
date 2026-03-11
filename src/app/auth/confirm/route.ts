import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * PKCE callback handler for magic link verification.
 *
 * Supabase sends the user here after they click the magic link in their email.
 * The URL contains a `code` param (PKCE flow) that we exchange for a session
 * via `exchangeCodeForSession`.
 *
 * On success: redirects to /setup (default) or the `next` param.
 * On error:   redirects to /auth/error with the error message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/setup";

  if (!code) {
    redirect("/auth/error?error=No+auth+code+found");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}
