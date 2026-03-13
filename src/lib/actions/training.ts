"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardLoot } from "@/lib/actions/economy";
import type { ActionResult } from "@/lib/actions/economy";

export interface TrainingCompleteResult {
  newGold: number;
  ledgerId: string;
}

async function getTrainingUserId(): Promise<string | null> {
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

/**
 * Check if the current user has completed training.
 */
export async function isTrainingCertified(): Promise<boolean> {
  const userId = await getTrainingUserId();
  if (!userId) return false;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("training_certified")
    .eq("id", userId)
    .single();

  return data?.training_certified ?? false;
}

/**
 * Mark training as complete: award 50 Gold + set training_certified flag.
 * Uses quest_id "training_v1" for idempotent loot award.
 */
export async function completeTraining(): Promise<ActionResult<TrainingCompleteResult>> {
  const userId = await getTrainingUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  // Award 50 Gold — quest_id ensures idempotency
  const lootResult = await awardLoot(50, "training_complete", "training_v1");
  if (!lootResult.success) return lootResult;

  // Set training_certified flag — check for errors
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ training_certified: true })
    .eq("id", userId);

  if (error) {
    console.error("Failed to set training_certified:", error);
    return { success: false, error: "Failed to certify training" };
  }

  return {
    success: true,
    data: { newGold: lootResult.data.newGold, ledgerId: lootResult.data.ledgerId },
  };
}
