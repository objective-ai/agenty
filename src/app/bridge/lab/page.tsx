// src/app/bridge/lab/page.tsx
// ═══════════════════════════════════════════════════════════════════
// /bridge/lab — Mission Mode: Holographic Briefing Board + Agent Comms
// ═══════════════════════════════════════════════════════════════════
import "@/lib/missions/dragon-bridge"; // ensures dragon-bridge is pushed to MISSION_REGISTRY
import { getMissionById, DEFAULT_MISSION_ID } from "@/lib/missions/registry";
import { MissionModeShell } from "@/components/MissionModeShell";

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  const { mission } = await searchParams;
  const missionId = mission ?? DEFAULT_MISSION_ID;
  // dragon-bridge.ts pushes to MISSION_REGISTRY at module import, so non-null assert is safe
  const config = getMissionById(missionId) ?? getMissionById(DEFAULT_MISSION_ID)!;
  return <MissionModeShell config={config} />;
}
