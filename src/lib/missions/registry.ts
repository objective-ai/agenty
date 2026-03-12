// src/lib/missions/registry.ts

export const DEFAULT_MISSION_ID = "dragon-bridge";

export type MissionStatConfig = {
  id: string;
  label: string;
  unit: string;
  goalValue?: number;
  svgHighlightId: string;
};

export type MissionConfig = {
  id: string;
  title: string;
  blueprintAsset: string;
  accentColor: string;
  isCritical?: boolean;
  defaultObjective: string;
  description: string;
  stats: MissionStatConfig[];
  xpReward: number;
  goldReward: number;
};

import { DRAGON_BRIDGE_MISSION } from "./dragon-bridge";
import { MARS_ROVER_MISSION } from "./mars-rover";
import { PYRAMID_MISSION } from "./pyramid-architect";
import { SOLAR_ISS_MISSION } from "./solar-iss";
import { getTemplateById } from "./templates";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Ordered array — first entry is the default
export const MISSION_REGISTRY: MissionConfig[] = [
  DRAGON_BRIDGE_MISSION,
  MARS_ROVER_MISSION,
];

/** Sync lookup — static missions only. */
export function getMissionById(id: string): MissionConfig | undefined {
  return MISSION_REGISTRY.find((m) => m.id === id);
}

// ── DB-backed async resolution ────────────────────────────────────

interface DbMissionRow {
  id: string;
  slug: string;
  title: string;
  template_id: string;
  status: string;
  accent_color: string;
  is_critical: boolean;
  default_objective: string;
  description: string;
  stats: MissionStatConfig[];
  xp_reward: number;
  gold_reward: number;
}

function dbMissionToConfig(row: DbMissionRow): MissionConfig | undefined {
  const template = getTemplateById(row.template_id);
  if (!template) return undefined;

  return {
    id: row.slug,
    title: row.title,
    blueprintAsset: template.svgFile,
    accentColor: row.accent_color,
    isCritical: row.is_critical,
    defaultObjective: row.default_objective,
    description: row.description,
    stats: row.stats,
    xpReward: row.xp_reward,
    goldReward: row.gold_reward,
  };
}

/**
 * Async mission resolver — checks DB first, falls back to static registry.
 * Use this in server components and API routes.
 */
export async function resolveMission(
  id: string
): Promise<MissionConfig | undefined> {
  // Try DB (by slug or uuid)
  const { data } = await supabaseAdmin
    .from("missions")
    .select("*")
    .or(`slug.eq.${id},id.eq.${id}`)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (data) {
    const config = dbMissionToConfig(data as DbMissionRow);
    if (config) return config;
  }

  // Fall back to static registry
  return MISSION_REGISTRY.find((m) => m.id === id);
}

/**
 * Fetch all active missions (static + DB) for the mission selection page.
 */
export async function getAllActiveMissions(): Promise<MissionConfig[]> {
  const staticMissions = [...MISSION_REGISTRY];

  const { data: dbRows } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const dbMissions = (dbRows ?? [])
    .map((row) => dbMissionToConfig(row as DbMissionRow))
    .filter((m): m is MissionConfig => m !== undefined);

  return [...staticMissions, ...dbMissions];
}
