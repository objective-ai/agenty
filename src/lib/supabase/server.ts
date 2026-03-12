import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Dev Identity Constants ────────────────────────────────────────
// Hardcoded UUIDs from the real Supabase auth.users table.
// Parent = Duy, Child = Brando. Used across all dev bypasses.
export const DEV_PARENT_ID = "cc50d664-28f7-46bf-b59b-cf2f901d3ce8"; // Duy
export const DEV_CHILD_ID = "a3c27479-3259-4051-8461-9b878c253c89"; // Brando
export const DEV_USER_ID = DEV_CHILD_ID; // default dev identity (kid plays)

export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";
}

/**
 * Dev-only: returns a fake user object when NEXT_PUBLIC_DEV_SKIP_AUTH=true.
 * Usage: const user = await getDevUserOrReal(supabase)
 */
export async function getAuthUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (isDevMode()) {
    return { id: DEV_USER_ID, email: "dev@local" };
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Swallowed when called from a Server Component (read-only cookies).
            // Middleware will handle the refresh instead.
          }
        },
      },
    }
  );
}
