"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResult } from "./economy";
import { awardLoot } from "./economy";
import type { MissionStatConfig } from "@/lib/missions/registry";
import { resolveMission } from "@/lib/missions/registry";

// ── Types ─────────────────────────────────────────────────────────

export interface MissionInsertData {
  slug: string;
  title: string;
  templateId: string;
  accentColor: string;
  isCritical?: boolean;
  defaultObjective: string;
  description: string;
  stats: MissionStatConfig[];
  xpReward: number;
  goldReward: number;
  gradeLevel: number;
  topic: string;
  skillFocus: string;
  problemCount?: number;
  difficulty?: string;
  narrativeTheme?: string;
  timeEstimate?: string;
  bannerUrl?: string;
}

export interface MissionRow {
  id: string;
  slug: string;
  title: string;
  template_id: string;
  status: "draft" | "active" | "archived";
  accent_color: string;
  is_critical: boolean;
  default_objective: string;
  description: string;
  stats: MissionStatConfig[];
  xp_reward: number;
  gold_reward: number;
  grade_level: number;
  topic: string;
  skill_focus: string;
  problem_count: number;
  difficulty: string;
  narrative_theme: string;
  time_estimate: string;
  banner_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true") {
    const { DEV_PARENT_ID } = await import("@/lib/supabase/server");
    return DEV_PARENT_ID; // missions are created by the parent
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Server Actions ────────────────────────────────────────────────

/**
 * Save a generated mission to the database.
 * Defaults to 'active' status (parent already previewed and approved).
 */
export async function saveMission(
  data: MissionInsertData
): Promise<ActionResult<{ id: string; slug: string }>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data: row, error } = await supabaseAdmin
    .from("missions")
    .insert({
      slug: data.slug,
      title: data.title,
      template_id: data.templateId,
      status: "active",
      accent_color: data.accentColor,
      is_critical: data.isCritical ?? false,
      default_objective: data.defaultObjective,
      description: data.description,
      stats: data.stats,
      xp_reward: data.xpReward,
      gold_reward: data.goldReward,
      grade_level: data.gradeLevel,
      topic: data.topic,
      skill_focus: data.skillFocus,
      problem_count: data.problemCount ?? 3,
      difficulty: data.difficulty ?? "medium",
      narrative_theme: data.narrativeTheme ?? "space",
      time_estimate: data.timeEstimate ?? "medium",
      banner_url: data.bannerUrl ?? null,
      created_by: userId,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.message.includes("missions_slug_key")) {
      return { success: false, error: "A mission with this slug already exists" };
    }
    return { success: false, error: "Failed to save mission" };
  }

  return { success: true, data: { id: row.id, slug: row.slug } };
}

/**
 * Update a mission's status (active, archived, draft).
 */
export async function updateMissionStatus(
  id: string,
  status: "active" | "archived" | "draft"
): Promise<ActionResult<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { error } = await supabaseAdmin
    .from("missions")
    .update({ status })
    .eq("id", id)
    .eq("created_by", userId);

  if (error) {
    return { success: false, error: "Failed to update mission status" };
  }

  return { success: true, data: undefined };
}

/**
 * Delete a mission permanently.
 */
export async function deleteMission(
  id: string
): Promise<ActionResult<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { error } = await supabaseAdmin
    .from("missions")
    .delete()
    .eq("id", id)
    .eq("created_by", userId);

  if (error) {
    return { success: false, error: "Failed to delete mission" };
  }

  return { success: true, data: undefined };
}

/**
 * Fetch all missions created by the authenticated user.
 */
export async function getMyMissions(): Promise<ActionResult<MissionRow[]>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Failed to fetch missions" };
  }

  return { success: true, data: (data ?? []) as MissionRow[] };
}

// ── Mission Completion (Loot Guard) ──────────────────────────────

export interface CompleteMissionResult {
  goldAwarded: number;
  xpAwarded: number;
}

/**
 * Complete a mission and award rewards. Server computes actual amounts.
 * When isDamaged=true, rewards are halved (50% signal penalty).
 * This is the Loot Guard compliant replacement for direct awardLoot() calls.
 */
export async function completeMission(
  missionId: string,
  isDamaged: boolean
): Promise<ActionResult<CompleteMissionResult>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  // Look up mission config (DB first, then static registry)
  const config = await resolveMission(missionId);
  if (!config) return { success: false, error: "Mission not found" };

  // Server computes actual rewards — client cannot influence amounts
  const goldReward = isDamaged
    ? Math.floor(config.goldReward / 2)
    : config.goldReward;
  const xpReward = isDamaged
    ? Math.floor(config.xpReward / 2)
    : config.xpReward;

  // Award gold via the standard Loot Guard path
  const lootResult = await awardLoot(
    goldReward,
    `mission:${missionId}`,
    `mission-${missionId}`
  );

  if (!lootResult.success) {
    // Already claimed is acceptable — still return the amounts
    if (lootResult.error !== "Quest reward already claimed") {
      return { success: false, error: lootResult.error };
    }
  }

  // TODO(Phase 3+): Award XP via profile update RPC when XP system is wired
  // For now, XP is tracked client-side / hardcoded (see CLAUDE.md gotcha)

  return {
    success: true,
    data: { goldAwarded: goldReward, xpAwarded: xpReward },
  };
}
