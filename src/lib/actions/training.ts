"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardLoot } from "@/lib/actions/economy";
import type { ActionResult } from "@/lib/actions/economy";

export interface TrainingCompleteResult {
  newGold: number;
  ledgerId: string;
}

/**
 * Mark training as complete: award 50 Gold + set training_certified flag.
 * Uses quest_id "training_v1" for idempotent loot award.
 */
export async function completeTraining(): Promise<ActionResult<TrainingCompleteResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Award 50 Gold — quest_id ensures idempotency
  const lootResult = await awardLoot(50, "training_complete", "training_v1");
  if (!lootResult.success) return lootResult;

  // Set training_certified flag
  await supabaseAdmin
    .from("profiles")
    .update({ training_certified: true })
    .eq("id", user.id);

  return {
    success: true,
    data: { newGold: lootResult.data.newGold, ledgerId: lootResult.data.ledgerId },
  };
}
