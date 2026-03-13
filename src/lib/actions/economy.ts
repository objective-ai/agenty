"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ── Result Types ───────────────────────────────────────

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionError {
  success: false;
  error: string;
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// ── Domain Types ───────────────────────────────────────

export interface AwardLootResult {
  newGold: number;
  ledgerId: string;
}

export interface SpendEnergyResult {
  remainingEnergy: number;
  logId: string;
}

export interface ProfileData {
  gold: number;
  xp: number;
  energy: number;
  level: number;
  streak_days: number;
}

export interface LootEntry {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true") {
    const { DEV_USER_ID } = await import("@/lib/supabase/server");
    return DEV_USER_ID;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Server Actions ─────────────────────────────────────

/**
 * Award gold to the authenticated player.
 * Optionally pass a questId to prevent double-claiming.
 */
export async function awardLoot(
  amount: number,
  source: string,
  questId?: string
): Promise<ActionResult<AwardLootResult>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  if (amount <= 0) return { success: false, error: "Amount must be positive" };

  const { data, error } = await supabaseAdmin.rpc("award_loot", {
    p_profile_id: userId,
    p_amount: amount,
    p_source: source,
    p_quest_id: questId ?? null,
    p_description: null,
  });

  if (error) {
    if (error.message.includes("idx_loot_ledger_quest_unique")) {
      return { success: false, error: "Quest reward already claimed" };
    }
    if (error.message.includes("profile_not_found")) {
      return { success: false, error: "Profile not found" };
    }
    return { success: false, error: "Failed to award loot" };
  }

  const row = (data as { new_gold: number; ledger_id: string }[])[0];
  return {
    success: true,
    data: { newGold: Number(row.new_gold), ledgerId: row.ledger_id },
  };
}

/**
 * Spend energy for an activity. Fails if the player doesn't have enough.
 */
export async function spendEnergy(
  energyCost: number,
  activity: string,
  metadata?: Record<string, unknown>
): Promise<ActionResult<SpendEnergyResult>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  if (energyCost <= 0)
    return { success: false, error: "Energy cost must be positive" };

  const { data, error } = await supabaseAdmin.rpc("spend_energy", {
    p_profile_id: userId,
    p_energy_cost: energyCost,
    p_activity: activity,
    p_metadata: metadata ?? {},
  });

  if (error) {
    if (error.message.includes("insufficient_energy")) {
      return { success: false, error: "Not enough energy" };
    }
    if (error.message.includes("profile_not_found")) {
      return { success: false, error: "Profile not found" };
    }
    return { success: false, error: "Failed to spend energy" };
  }

  const row = (data as { remaining_energy: number; log_id: string }[])[0];
  return {
    success: true,
    data: {
      remainingEnergy: Number(row.remaining_energy),
      logId: row.log_id,
    },
  };
}

// ── Phase 3 Server Actions ────────────────────────────

/**
 * Claim the daily reward. Hardcodes 25 gold server-side (Loot Guard).
 * Uses date-based quest_id for idempotency — double-claims return error.
 */
export async function claimDaily(): Promise<ActionResult<AwardLootResult>> {
  const today = new Date().toISOString().slice(0, 10);
  const questId = `daily_claim_${today}`;
  return awardLoot(25, "daily_bonus", questId);
}

/**
 * Fetch the authenticated user's profile data.
 */
export async function getProfile(): Promise<ActionResult<ProfileData>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("gold, xp, energy, level, streak_days")
    .eq("id", userId)
    .single();

  if (error) {
    return { success: false, error: "Failed to fetch profile" };
  }

  return {
    success: true,
    data: data as ProfileData,
  };
}

/**
 * Check if today's daily reward has already been claimed.
 */
export async function isDailyClaimed(): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const today = new Date().toISOString().slice(0, 10);
  const questId = `daily_claim_${today}`;

  const { data } = await supabaseAdmin
    .from("loot_ledger")
    .select("id")
    .eq("profile_id", userId)
    .contains("metadata", { quest_id: questId })
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Fetch recent loot ledger entries for the authenticated user.
 */
export async function getRecentLoot(
  limit: number = 10
): Promise<ActionResult<LootEntry[]>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("loot_ledger")
    .select("id, amount, source, description, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: "Failed to fetch loot history" };
  }

  return {
    success: true,
    data: (data ?? []) as LootEntry[],
  };
}
