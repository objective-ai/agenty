// src/components/MissionList.tsx
"use client";

import type { MissionRow } from "@/lib/actions/missions";

type MissionListProps = {
  missions: MissionRow[];
  onStatusChange: (id: string, status: "active" | "archived") => void;
  onDelete: (id: string) => void;
};

const STATUS_COLORS = {
  active: { border: "#10B981", bg: "#10B98120", text: "#10B981" },
  draft: { border: "#F59E0B", bg: "#F59E0B20", text: "#F59E0B" },
  archived: { border: "#6B7280", bg: "#6B728020", text: "#6B7280" },
};

export function MissionList({
  missions,
  onStatusChange,
  onDelete,
}: MissionListProps) {
  if (missions.length === 0) {
    return (
      <div className="rounded border-2 border-dashed border-[#3B82F633] p-12 text-center">
        <p className="font-mono text-sm text-[#A8977E]">
          NO MISSIONS CREATED YET
        </p>
        <p className="mt-2 font-mono text-xs text-[#A8977E55]">
          Hit CREATE MISSION to generate your first AI-powered lesson.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {missions.map((mission) => {
        const colors = STATUS_COLORS[mission.status];
        return (
          <div
            key={mission.id}
            className="rounded border-2 bg-[#0A1628] p-4 transition-colors"
            style={{ borderColor: `${colors.border}44` }}
          >
            <div className="flex items-start justify-between">
              {/* Banner thumbnail */}
              <div className="mr-3 shrink-0">
                {mission.banner_url ? (
                  <img
                    src={mission.banner_url}
                    alt=""
                    className="h-12 w-12 rounded-lg border border-[#3B82F633] object-cover"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#3B82F633] font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor: `${mission.accent_color}15`,
                      color: mission.accent_color,
                    }}
                  >
                    M
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-sm font-bold text-[#F0E6D3]">
                    {mission.title.toUpperCase()}
                  </h3>
                  <span
                    className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {mission.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 flex gap-4 font-mono text-[10px] text-[#A8977E]">
                  <span>Topic: {mission.topic}</span>
                  <span>Skill: {mission.skill_focus}</span>
                  <span>Grade: {mission.grade_level}</span>
                  <span>XP: {mission.xp_reward}</span>
                  <span>Gold: {mission.gold_reward}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {(mission.stats as { label: string }[]).map((stat) => (
                    <span
                      key={stat.label}
                      className="rounded border border-[#3B82F633] px-2 py-0.5 font-mono text-[9px] text-[#3B82F6]"
                    >
                      {stat.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex gap-2">
                {mission.status === "active" && (
                  <>
                    <a
                      href={`/play/missions/${mission.slug}`}
                      className="rounded border border-[#3B82F644] px-3 py-1 font-mono text-[10px] font-bold text-[#3B82F6] transition-colors hover:border-[#3B82F6] hover:bg-[#3B82F610]"
                    >
                      PLAY
                    </a>
                    <button
                      onClick={() => onStatusChange(mission.id, "archived")}
                      className="rounded border border-[#6B728044] px-3 py-1 font-mono text-[10px] font-bold text-[#6B7280] transition-colors hover:border-[#6B7280]"
                    >
                      ARCHIVE
                    </button>
                  </>
                )}
                {mission.status === "archived" && (
                  <button
                    onClick={() => onStatusChange(mission.id, "active")}
                    className="rounded border border-[#10B98144] px-3 py-1 font-mono text-[10px] font-bold text-[#10B981] transition-colors hover:border-[#10B981]"
                  >
                    REACTIVATE
                  </button>
                )}
                <button
                  onClick={() => onDelete(mission.id)}
                  className="rounded border border-red-500/30 px-3 py-1 font-mono text-[10px] font-bold text-red-500/60 transition-colors hover:border-red-500 hover:text-red-500"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
