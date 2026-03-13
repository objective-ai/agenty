// src/app/parent/missions/page.tsx
// ════════════════════════════════════════════════════════════
// /parent/missions — Mission Factory (moved from /bridge/command-deck)
// ════════════════════════════════════════════════════════════
import { getMyMissions } from "@/lib/actions/missions";
import { TEMPLATE_MANIFESTS } from "@/lib/missions/templates";
import { CommandDeckShell } from "@/components/CommandDeckShell";

export default async function ParentMissionsPage() {
  const result = await getMyMissions();
  const missions = result.success ? result.data : [];

  return (
    <CommandDeckShell
      initialMissions={missions}
      templates={TEMPLATE_MANIFESTS}
    />
  );
}
