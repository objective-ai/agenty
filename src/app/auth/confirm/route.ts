import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * PKCE callback handler for magic link verification.
 *
 * Supabase sends the user here after they click the magic link in their email.
 * The URL contains `token_hash` and `type` query params that we exchange for
 * a valid session via `verifyOtp`.
 *
 * On success: redirects to /setup (default) or the `next` param.
 * On error:   redirects to /auth/error with the error message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/setup";

  if (!token_hash || !type) {
    redirect("/auth/error?error=No+token+hash+or+type");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}
