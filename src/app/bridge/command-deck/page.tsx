// src/app/bridge/command-deck/page.tsx
// ═══════════════════════════════════════════════════════════════════
// /bridge/command-deck — Parent's Mission Factory dashboard
// Generate, preview, and manage AI-created missions.
// ═══════════════════════════════════════════════════════════════════

import { getMyMissions } from "@/lib/actions/missions";
import { TEMPLATE_MANIFESTS } from "@/lib/missions/templates";
import { CommandDeckShell } from "@/components/CommandDeckShell";

export default async function CommandDeckPage() {
  const result = await getMyMissions();
  const missions = result.success ? result.data : [];

  return (
    <CommandDeckShell
      initialMissions={missions}
      templates={TEMPLATE_MANIFESTS}
    />
  );
}
