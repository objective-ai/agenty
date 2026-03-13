// src/app/parent/page.tsx
// ════════════════════════════════════════════════════════════
// /parent — Parent overview dashboard
// ════════════════════════════════════════════════════════════
import Link from "next/link";

export default function ParentPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-white">Parent Dashboard</h1>
      <p className="text-sm text-slate-400">
        Manage missions and track your agent&apos;s progress.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/parent/missions"
          className="rounded-2xl border border-white/10 bg-slate-800/50 p-5 transition-colors hover:border-white/20 hover:bg-slate-800"
        >
          <p className="mb-1 text-base font-semibold text-white">Missions</p>
          <p className="text-sm text-slate-400">
            Generate and manage AI-powered learning missions.
          </p>
        </Link>
      </div>
    </div>
  );
}
