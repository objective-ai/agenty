// src/components/CommandDeckShell.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MissionRow } from "@/lib/actions/missions";
import type { TemplateManifest } from "@/lib/missions/templates";
import type { MissionStatConfig } from "@/lib/missions/registry";
import { MissionGeneratorForm } from "./MissionGeneratorForm";
import { MissionPreview } from "./MissionPreview";
import { MissionList } from "./MissionList";
import { saveMission, updateMissionStatus, deleteMission } from "@/lib/actions/missions";

type FlowState = "list" | "form" | "generating" | "preview";

type GeneratedMissionData = {
  title: string;
  slug: string;
  defaultObjective: string;
  description: string;
  accentColor: string;
  stats: MissionStatConfig[];
  xpReward: number;
  goldReward: number;
  templateId: string;
  gradeLevel: number;
  topic: string;
  skillFocus: string;
  problemCount: number;
  difficulty: string;
  narrativeTheme: string;
  timeEstimate: string;
};

type CommandDeckShellProps = {
  initialMissions: MissionRow[];
  templates: TemplateManifest[];
};

export function CommandDeckShell({
  initialMissions,
  templates,
}: CommandDeckShellProps) {
  const [flowState, setFlowState] = useState<FlowState>("list");
  const [missions, setMissions] = useState<MissionRow[]>(initialMissions);
  const [generatedMission, setGeneratedMission] =
    useState<GeneratedMissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Generate handler ──────────────────────────────────────────
  const handleGenerate = useCallback(
    async (input: {
      topic: string;
      skillFocus: string;
      gradeLevel: number;
      templateId: string;
      problemCount: number;
      difficulty: string;
      narrativeTheme: string;
      timeEstimate: string;
    }) => {
      setFlowState("generating");
      setError(null);

      try {
        const res = await fetch("/api/generate-mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(
            data.error || "Generation failed"
          );
          setFlowState("form");
          return;
        }

        setGeneratedMission(data.mission);
        setFlowState("preview");
      } catch {
        setError("Network error — check your connection.");
        setFlowState("form");
      }
    },
    []
  );

  // ── Approve handler ───────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!generatedMission) return;
    setSaving(true);
    setError(null);

    const result = await saveMission({
      slug: generatedMission.slug,
      title: generatedMission.title,
      templateId: generatedMission.templateId,
      accentColor: generatedMission.accentColor,
      defaultObjective: generatedMission.defaultObjective,
      description: generatedMission.description,
      stats: generatedMission.stats,
      xpReward: generatedMission.xpReward,
      goldReward: generatedMission.goldReward,
      gradeLevel: generatedMission.gradeLevel,
      topic: generatedMission.topic,
      skillFocus: generatedMission.skillFocus,
      problemCount: generatedMission.problemCount,
      difficulty: generatedMission.difficulty,
      narrativeTheme: generatedMission.narrativeTheme,
      timeEstimate: generatedMission.timeEstimate,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Add to local list and return to list view
    const newRow: MissionRow = {
      id: result.data.id,
      slug: result.data.slug,
      title: generatedMission.title,
      template_id: generatedMission.templateId,
      status: "active",
      accent_color: generatedMission.accentColor,
      is_critical: false,
      default_objective: generatedMission.defaultObjective,
      description: generatedMission.description,
      stats: generatedMission.stats,
      xp_reward: generatedMission.xpReward,
      gold_reward: generatedMission.goldReward,
      grade_level: generatedMission.gradeLevel,
      topic: generatedMission.topic,
      skill_focus: generatedMission.skillFocus,
      problem_count: generatedMission.problemCount,
      difficulty: generatedMission.difficulty,
      narrative_theme: generatedMission.narrativeTheme,
      time_estimate: generatedMission.timeEstimate,
      banner_url: null,
      created_by: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMissions((prev) => [newRow, ...prev]);
    setGeneratedMission(null);
    setFlowState("list");
  }, [generatedMission]);

  // ── Mission management handlers ───────────────────────────────
  const handleStatusChange = useCallback(
    async (id: string, status: "active" | "archived") => {
      const result = await updateMissionStatus(id, status);
      if (result.success) {
        setMissions((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
      }
    },
    []
  );

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteMission(id);
    if (result.success) {
      setMissions((prev) => prev.filter((m) => m.id !== id));
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#050B14]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#3B82F633] px-6 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-black tracking-tight text-[#F0E6D3]">
            COMMAND DECK
          </h1>
          <span className="font-mono text-xs text-[#A8977E]">
            // mission factory
          </span>
        </div>
        {flowState !== "list" && (
          <button
            onClick={() => {
              setFlowState("list");
              setGeneratedMission(null);
              setError(null);
            }}
            className="rounded border-2 border-[#3B82F644] px-4 py-1.5 font-mono text-xs font-bold text-[#3B82F6] transition-colors hover:border-[#3B82F6] hover:bg-[#3B82F610]"
          >
            BACK TO LIST
          </button>
        )}
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mt-3 rounded border-2 border-red-500/40 bg-red-500/10 px-4 py-2 font-mono text-sm text-red-400"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-500 hover:text-red-300"
            >
              DISMISS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {flowState === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-6">
                <button
                  onClick={() => setFlowState("form")}
                  className="rounded border-2 border-[#3B82F6] bg-[#3B82F615] px-6 py-3 font-mono text-sm font-bold text-[#3B82F6] transition-all hover:bg-[#3B82F625] hover:shadow-[0_0_20px_#3B82F620]"
                >
                  + CREATE MISSION
                </button>
              </div>
              <MissionList
                missions={missions}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </motion.div>
          )}

          {flowState === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MissionGeneratorForm
                templates={templates}
                onGenerate={handleGenerate}
              />
            </motion.div>
          )}

          {flowState === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-20"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
              <p className="font-mono text-sm text-[#3B82F6]">
                MISSION ARCHITECT IS DESIGNING...
              </p>
              <p className="font-mono text-xs text-[#A8977E]">
                Generating config, validating math bounds, checking zone
                coverage
              </p>
            </motion.div>
          )}

          {flowState === "preview" && generatedMission && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MissionPreview
                mission={generatedMission}
                templateId={generatedMission.templateId}
                templates={templates}
                onApprove={handleApprove}
                onRegenerate={() => setFlowState("form")}
                saving={saving}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
