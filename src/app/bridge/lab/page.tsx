// src/app/bridge/lab/page.tsx
// ═══════════════════════════════════════════════════════════════════
// /bridge/lab — Mission Mode: Holographic Briefing Board + Agent Comms
// ═══════════════════════════════════════════════════════════════════
import { resolveMission, DEFAULT_MISSION_ID } from "@/lib/missions/registry";
import { MissionModeShell } from "@/components/MissionModeShell";

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  const { mission } = await searchParams;
  const missionId = mission ?? DEFAULT_MISSION_ID;
  const config =
    (await resolveMission(missionId)) ??
    (await resolveMission(DEFAULT_MISSION_ID))!;
  return <MissionModeShell config={config} />;
}
