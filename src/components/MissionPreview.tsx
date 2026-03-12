// src/components/MissionPreview.tsx
"use client";

import { useCallback } from "react";
import { BlueprintDiagram } from "./BlueprintDiagram";
import type { TemplateManifest } from "@/lib/missions/templates";
import type { MissionStatConfig } from "@/lib/missions/registry";
import type { MissionAction } from "@/lib/missions/missionReducer";

type MissionPreviewProps = {
  mission: {
    title: string;
    slug: string;
    defaultObjective: string;
    description: string;
    accentColor: string;
    stats: MissionStatConfig[];
    xpReward: number;
    goldReward: number;
    bannerUrl?: string | null;
  };
  templateId: string;
  templates: TemplateManifest[];
  onApprove: () => void;
  onRegenerate: () => void;
  saving: boolean;
};

export function MissionPreview({
  mission,
  templateId,
  templates,
  onApprove,
  onRegenerate,
  saving,
}: MissionPreviewProps) {
  const template = templates.find((t) => t.templateId === templateId);
  const svgFile = template?.svgFile ?? "";

  // No-op dispatch for preview mode — no highlight/solve interactions
  const noopDispatch = useCallback((_action: MissionAction) => {}, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 font-mono text-lg font-bold text-[#F0E6D3]">
        MISSION PREVIEW
      </h2>

      {/* Banner Image */}
      {mission.bannerUrl && (
        <div className="mb-4 overflow-hidden rounded-2xl border-2 border-[#3B82F644]" style={{ boxShadow: "0 0 16px #3B82F618" }}>
          <img
            src={mission.bannerUrl}
            alt="Mission banner"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {/* Title + Metadata */}
      <div className="mb-4 rounded border-2 border-[#3B82F633] bg-[#0A1628] p-4">
        <h3 className="mb-2 font-mono text-base font-bold text-[#F0E6D3]">
          {mission.title.toUpperCase()}
        </h3>
        <p className="mb-3 font-mono text-xs leading-relaxed text-[#A8977E]">
          {mission.description}
        </p>
        <div className="flex gap-4 font-mono text-xs text-[#3B82F6]">
          <span>XP: {mission.xpReward}</span>
          <span>GOLD: {mission.goldReward}</span>
          <span>SLUG: {mission.slug}</span>
        </div>
      </div>

      {/* Blueprint Preview */}
      <div className="mb-4">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          BLUEPRINT
        </label>
        <BlueprintDiagram
          blueprintAsset={svgFile}
          highlightId={null}
          solvedIds={[]}
          dispatchMission={noopDispatch}
        />
      </div>

      {/* Stats Preview */}
      <div className="mb-4">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          STAT GAUGES
        </label>
        <div className="grid grid-cols-3 gap-3">
          {mission.stats.map((stat) => (
            <div
              key={stat.id}
              className="rounded border-2 border-[#3B82F644] bg-[#0A1628] p-3"
            >
              <div className="mb-1 font-mono text-[10px] font-bold text-[#A8977E]">
                {stat.label}
              </div>
              <div className="font-mono text-lg font-black text-[#3B82F6]">
                {stat.goalValue}{" "}
                <span className="text-xs font-normal text-[#A8977E]">
                  {stat.unit}
                </span>
              </div>
              <div className="mt-1 font-mono text-[9px] text-[#A8977E55]">
                SVG: {stat.svgHighlightId}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objective */}
      <div className="mb-6 rounded border-2 border-[#3B82F633] bg-[#0A1628] p-3">
        <label className="mb-1 block font-mono text-[10px] font-bold text-[#A8977E]">
          DEFAULT OBJECTIVE
        </label>
        <p className="font-mono text-sm text-[#F0E6D3]">
          {mission.defaultObjective}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          disabled={saving}
          className="flex-1 rounded border-2 border-[#10B981] bg-[#10B98115] px-6 py-3 font-mono text-sm font-bold text-[#10B981] transition-all hover:bg-[#10B98125] hover:shadow-[0_0_20px_#10B98120] disabled:opacity-50"
        >
          {saving ? "DEPLOYING..." : "APPROVE & ACTIVATE"}
        </button>
        <button
          onClick={onRegenerate}
          disabled={saving}
          className="rounded border-2 border-[#F59E0B44] px-6 py-3 font-mono text-sm font-bold text-[#F59E0B] transition-all hover:border-[#F59E0B] hover:bg-[#F59E0B10]"
        >
          REGENERATE
        </button>
      </div>
    </div>
  );
}
