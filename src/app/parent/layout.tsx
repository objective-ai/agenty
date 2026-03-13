// src/app/parent/layout.tsx
// ════════════════════════════════════════════════════════════
// /parent layout — Server Component
// Auth gate + role guard. No game contexts.
// ════════════════════════════════════════════════════════════
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  // Allowlist: only confirmed parents pass through
  if (!profile || profile.role !== "parent") {
    return redirect("/play");
  }

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-slate-100">
      {/* ── Top navigation bar ───────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-sm font-bold tracking-tight text-white">
            AGENTY <span className="font-normal text-slate-400">Parent</span>
          </span>
          <nav className="hidden gap-6 text-sm text-slate-400 sm:flex">
            <Link href="/parent" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link
              href="/parent/missions"
              className="hover:text-white transition-colors"
            >
              Missions
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
