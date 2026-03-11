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
