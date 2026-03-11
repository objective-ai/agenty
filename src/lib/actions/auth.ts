"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// sendMagicLink — triggers OTP email for parent authentication
// ---------------------------------------------------------------------------

export async function sendMagicLink(
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const email = formData.get("email");

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/setup`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// setupChildAccount — parent creates a kid account with PIN + display name
// ---------------------------------------------------------------------------

const PIN_REGEX = /^\d{6}$/;

export async function setupChildAccount(
  formData: FormData
): Promise<{ success?: boolean; kidEmail?: string; error?: string }> {
  const supabase = await createClient();

  // Verify parent is authenticated
  const {
    data: { user: parent },
  } = await supabase.auth.getUser();

  if (!parent) {
    return { error: "You must be logged in to create a child account." };
  }

  const pin = formData.get("pin");
  const displayName =
    (formData.get("displayName") as string | null)?.trim() || "Adventurer";

  if (!pin || typeof pin !== "string" || !PIN_REGEX.test(pin)) {
    return { error: "PIN must be exactly 6 digits." };
  }

  // Generate synthetic email for the kid (not a real inbox)
  const kidEmail = `player-${crypto.randomUUID()}@agenty.local`;

  // Create auth user via admin (service role)
  const { data: kidUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: kidEmail,
      password: pin,
      email_confirm: true, // skip verification for synthetic account
      user_metadata: { display_name: displayName, parent_id: parent.id },
    });

  if (createError || !kidUser?.user) {
    return { error: createError?.message ?? "Failed to create child account." };
  }

  // Explicit profile upsert — not reliant on DB trigger alone (AUTH-03)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: kidUser.user.id, display_name: displayName },
      { onConflict: "id" }
    );

  if (profileError) {
    return { error: profileError.message };
  }

  return { success: true, kidEmail };
}

// ---------------------------------------------------------------------------
// loginWithPin — kid logs in with PIN, rate-limited to 5 attempts / 15 min
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

export async function loginWithPin(
  kidEmail: string,
  pin: string
): Promise<{
  success?: boolean;
  error?: string;
  unlockAt?: string;
  remainingSeconds?: number;
  attemptsRemaining?: number;
}> {
  // Resolve kid's user ID from email via Postgres function.
  // getUserByEmail does not exist in @supabase/supabase-js v2.99,
  // so we use a service-role-only RPC (get_uid_by_email).
  const { data: profileId, error: lookupError } = await supabaseAdmin.rpc(
    "get_uid_by_email",
    { lookup_email: kidEmail }
  );

  if (lookupError || !profileId) {
    // Don't reveal whether the account exists
    return { error: "wrong_pin" };
  }

  // Check rate limit: count attempts in the last 15 minutes
  const fifteenMinutesAgo = new Date(
    Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const { data: attempts, error: attemptsError } = await supabaseAdmin
    .from("pin_attempts")
    .select("attempted_at")
    .eq("profile_id", profileId)
    .gte("attempted_at", fifteenMinutesAgo)
    .order("attempted_at", { ascending: false });

  if (attemptsError) {
    // Table missing or DB error — fail safe: deny login until resolved
    console.error("pin_attempts query failed:", attemptsError.message);
    return { error: "service_unavailable" };
  }

  const attemptCount = attempts?.length ?? 0;

  if (attemptCount >= MAX_ATTEMPTS) {
    // Calculate unlock time from the oldest attempt in the window + 15 min
    const oldestAttempt = attempts![attempts!.length - 1].attempted_at;
    const unlockAtDate = new Date(
      new Date(oldestAttempt).getTime() + LOCKOUT_WINDOW_MINUTES * 60 * 1000
    );
    const remainingSeconds = Math.max(
      0,
      Math.ceil((unlockAtDate.getTime() - Date.now()) / 1000)
    );

    return {
      error: "tactical_lockdown",
      unlockAt: unlockAtDate.toISOString(),
      remainingSeconds,
    };
  }

  // Attempt sign-in with anon client (establishes session cookies)
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: kidEmail,
    password: pin,
  });

  if (signInError) {
    // Record failed attempt
    await supabaseAdmin
      .from("pin_attempts")
      .insert({ profile_id: profileId });

    return {
      error: "wrong_pin",
      attemptsRemaining: MAX_ATTEMPTS - attemptCount - 1,
    };
  }

  // Success — clear all attempts for this profile
  await supabaseAdmin
    .from("pin_attempts")
    .delete()
    .eq("profile_id", profileId);

  return { success: true };
}

// ---------------------------------------------------------------------------
// logOut — signs out and redirects to landing page
// ---------------------------------------------------------------------------

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
