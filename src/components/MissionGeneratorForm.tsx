// src/components/MissionGeneratorForm.tsx
"use client";

import { useState } from "react";
import type { TemplateManifest } from "@/lib/missions/templates";

type MissionGeneratorFormProps = {
  templates: TemplateManifest[];
  onGenerate: (input: {
    topic: string;
    skillFocus: string;
    gradeLevel: number;
    templateId: string;
    problemCount: number;
    difficulty: string;
    narrativeTheme: string;
    timeEstimate: string;
  }) => void;
};

const SKILL_OPTIONS = [
  { value: "multiplication", label: "Multiplication" },
  { value: "division", label: "Division" },
  { value: "fractions", label: "Fractions" },
  { value: "decimals", label: "Decimals" },
  { value: "place-value", label: "Place Value" },
  { value: "area", label: "Area" },
  { value: "addition", label: "Addition" },
  { value: "subtraction", label: "Subtraction" },
  { value: "mixed", label: "Mixed Operations" },
];

export function MissionGeneratorForm({
  templates,
  onGenerate,
}: MissionGeneratorFormProps) {
  const [topic, setTopic] = useState("");
  const [skillFocus, setSkillFocus] = useState("multiplication");
  const [gradeLevel, setGradeLevel] = useState(4);
  const [templateId, setTemplateId] = useState(templates[0]?.templateId ?? "");
  const [problemCount, setProblemCount] = useState(3);
  const [difficulty, setDifficulty] = useState("medium");
  const [narrativeTheme, setNarrativeTheme] = useState("space");
  const [timeEstimate, setTimeEstimate] = useState("medium");

  const canSubmit = topic.trim().length >= 2 && templateId;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 font-mono text-lg font-bold text-[#F0E6D3]">
        MISSION GENERATOR
      </h2>

      {/* Topic */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          TOPIC
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Moons of Jupiter, The Wild Robot, Vikings..."
          className="w-full rounded border-2 border-[#3B82F633] bg-[#0A1628] px-4 py-3 font-mono text-sm text-[#F0E6D3] placeholder-[#A8977E55] outline-none transition-colors focus:border-[#3B82F6]"
        />
      </div>

      {/* Skill Focus */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          MATH SKILL
        </label>
        <select
          value={skillFocus}
          onChange={(e) => setSkillFocus(e.target.value)}
          className="w-full rounded border-2 border-[#3B82F633] bg-[#0A1628] px-4 py-3 font-mono text-sm text-[#F0E6D3] outline-none transition-colors focus:border-[#3B82F6]"
        >
          {SKILL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Level */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          GRADE LEVEL
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
            <button
              key={g}
              onClick={() => setGradeLevel(g)}
              className={`h-10 w-10 rounded border-2 font-mono text-sm font-bold transition-all ${
                g === gradeLevel
                  ? "border-[#3B82F6] bg-[#3B82F620] text-[#3B82F6] shadow-[0_0_10px_#3B82F620]"
                  : "border-[#3B82F633] text-[#A8977E] hover:border-[#3B82F666]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Template Selector */}
      <div className="mb-8">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          BLUEPRINT TEMPLATE
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((t) => (
            <button
              key={t.templateId}
              onClick={() => setTemplateId(t.templateId)}
              className={`rounded border-2 p-3 text-left transition-all ${
                t.templateId === templateId
                  ? "border-[#3B82F6] bg-[#3B82F615] shadow-[0_0_15px_#3B82F620]"
                  : "border-[#3B82F633] hover:border-[#3B82F666]"
              }`}
            >
              <div className="mb-1 font-mono text-xs font-bold text-[#F0E6D3]">
                {t.displayName.toUpperCase()}
              </div>
              <div className="font-mono text-[10px] text-[#A8977E]">
                {t.zones.length} zones | Grade {t.gradeRange[0]}-
                {t.gradeRange[1]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Problem Count */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          PROBLEM COUNT
        </label>
        <div className="flex gap-2">
          {[3, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => setProblemCount(n)}
              className={`h-10 min-w-[3rem] rounded border-2 font-mono text-sm font-bold transition-all ${
                n === problemCount
                  ? "border-[#3B82F6] bg-[#3B82F620] text-[#3B82F6] shadow-[0_0_10px_#3B82F620]"
                  : "border-[#3B82F633] text-[#A8977E] hover:border-[#3B82F666]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          DIFFICULTY
        </label>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`h-10 rounded border-2 px-4 font-mono text-sm font-bold uppercase transition-all ${
                d === difficulty
                  ? "border-[#3B82F6] bg-[#3B82F620] text-[#3B82F6] shadow-[0_0_10px_#3B82F620]"
                  : "border-[#3B82F633] text-[#A8977E] hover:border-[#3B82F666]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Narrative Theme */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          NARRATIVE THEME
        </label>
        <div className="flex gap-2">
          {(["space", "nature", "history", "fantasy"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setNarrativeTheme(t)}
              className={`h-10 rounded border-2 px-4 font-mono text-sm font-bold uppercase transition-all ${
                t === narrativeTheme
                  ? "border-[#3B82F6] bg-[#3B82F620] text-[#3B82F6] shadow-[0_0_10px_#3B82F620]"
                  : "border-[#3B82F633] text-[#A8977E] hover:border-[#3B82F666]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Time Estimate */}
      <div className="mb-8">
        <label className="mb-1.5 block font-mono text-xs font-bold text-[#A8977E]">
          TIME ESTIMATE
        </label>
        <div className="flex gap-2">
          {([
            { value: "short", label: "SHORT (10min)" },
            { value: "medium", label: "MEDIUM (20min)" },
            { value: "long", label: "LONG (30min)" },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => setTimeEstimate(t.value)}
              className={`h-10 rounded border-2 px-4 font-mono text-xs font-bold transition-all ${
                t.value === timeEstimate
                  ? "border-[#3B82F6] bg-[#3B82F620] text-[#3B82F6] shadow-[0_0_10px_#3B82F620]"
                  : "border-[#3B82F633] text-[#A8977E] hover:border-[#3B82F666]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={() =>
          onGenerate({ topic: topic.trim(), skillFocus, gradeLevel, templateId, problemCount, difficulty, narrativeTheme, timeEstimate })
        }
        disabled={!canSubmit}
        className="w-full rounded border-2 border-[#3B82F6] bg-[#3B82F615] px-6 py-4 font-mono text-sm font-bold text-[#3B82F6] transition-all hover:bg-[#3B82F625] hover:shadow-[0_0_30px_#3B82F630] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#3B82F615] disabled:hover:shadow-none"
      >
        GENERATE MISSION
      </button>
    </div>
  );
}
