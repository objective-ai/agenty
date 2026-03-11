"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgent } from "@/contexts/AgentContext";

const NAV_ITEMS = [
  { href: "/bridge/missions", label: "MISSIONS", emoji: "\u{1F3AF}" },
  { href: "/bridge/inventory", label: "INVENTORY", emoji: "\u{1F392}" },
  { href: "/bridge/lab", label: "THE LAB", emoji: "\u{1F52C}" },
] as const;

interface BridgeSidebarProps {
  trainingCertified?: boolean;
}

export function BridgeSidebar({ trainingCertified = false }: BridgeSidebarProps) {
  const { agent } = useAgent();
  const pathname = usePathname();

  return (
    <aside className="flex w-16 flex-col items-center gap-1 border-r-2 border-white/10 bg-[#0A1423] py-4 md:w-48 md:items-start md:px-3">
      {NAV_ITEMS.map(({ href, label, emoji }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3
                       font-bold text-[10px] tracking-wider uppercase transition-all duration-200
                       md:text-xs"
            style={{
              borderColor: isActive ? agent.color : "transparent",
              backgroundColor: isActive ? `${agent.color}11` : "transparent",
              color: isActive ? agent.color : "#A8977E",
              boxShadow: isActive ? `0 0 12px ${agent.color}33` : "none",
            }}
          >
            <span className="text-lg">{emoji}</span>
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}

      {/* Training Certified badge — shown after completing Training Room */}
      {trainingCertified && (
        <div
          className="mt-auto flex w-full items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-bold uppercase tracking-wider"
          style={{ borderColor: "#10B981", color: "#10B981", backgroundColor: "#10B98111" }}
        >
          <span>{"\u2713"}</span>
          <span className="hidden md:inline">CERTIFIED</span>
        </div>
      )}
    </aside>
  );
}
