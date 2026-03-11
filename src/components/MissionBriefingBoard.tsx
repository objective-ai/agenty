// src/components/MissionBriefingBoard.tsx
"use client";

import type { Dispatch } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MissionConfig } from "@/lib/missions/registry";
import type { MissionState, MissionAction } from "@/lib/missions/missionReducer";
import { BlueprintDiagram } from "./BlueprintDiagram";
import { StatGauge } from "./StatGauge";
import { ObjectiveCard } from "./ObjectiveCard";

type MissionBriefingBoardProps = {
  config: MissionConfig;
  state: MissionState;
  dispatch: Dispatch<MissionAction>;
  signalLost: boolean;
};

export function MissionBriefingBoard({
  config,
  state,
  dispatch,
  signalLost,
}: MissionBriefingBoardProps) {
  const isGhost = state.status === "ghost";
  const isComplete = state.status === "complete";

  // Derive solvedIds from state for BlueprintDiagram
  const solvedIds = Object.entries(state.stats)
    .filter(([, s]) => s.solved)
    .map(([id]) => id);

  // NOTE: width/sizing is controlled by the parent container (MissionModeShell),
  // not by this component. MissionModeShell wraps this in w-[40%] shrink-0.
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border-2 p-4 transition-all duration-500"
      style={{
        background: "#050B14",
        borderColor: isComplete ? "#10B981" : "#3B82F6",
        boxShadow: isComplete
          ? "0 0 32px #10B98133"
          : "0 0 24px #3B82F622",
      }}
    >
      {/* Board header */}
      <div
        className="text-center font-mono text-[9px] uppercase tracking-[3px]"
        style={{ color: isComplete ? "#10B981" : "#3B82F6" }}
      >
        MISSION BRIEFING BOARD
      </div>

      {/* Blueprint area — ghost vs active */}
      <AnimatePresence mode="wait">
        {isGhost ? (
          <motion.div
            key="ghost"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex flex-col items-center justify-center gap-3 rounded-xl py-6"
            style={{
              background:
                "repeating-linear-gradient(0deg,transparent,transparent 18px,#3B82F608 18px,#3B82F608 19px)," +
                "repeating-linear-gradient(90deg,transparent,transparent 18px,#3B82F608 18px,#3B82F608 19px)",
              border: "1px solid #3B82F622",
              minHeight: "80px",
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[2px]"
              style={{ color: "#3B82F633" }}
            >
              {signalLost ? "SIGNAL LOST — retrying…" : "TACTICAL SCAN"}
            </p>
            <p
              className="font-mono text-[10px] animate-ghost-pulse"
              style={{ color: "#3B82F622" }}
            >
              ● ● ●
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 1] }}
            transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1] }}
          >
            <BlueprintDiagram
              highlightId={state.activeHighlight}
              solvedIds={solvedIds}
              dispatchMission={dispatch}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat gauges */}
      <div className="flex flex-col gap-1.5">
        {isGhost
          ? // Skeleton bars
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg"
                style={{ background: "#0A1423", border: "1px solid #1F2937" }}
              />
            ))
          : config.stats.map((stat) => {
              const entry = state.stats[stat.id];
              return (
                <StatGauge
                  key={stat.id}
                  label={stat.label}
                  value={entry?.value ?? null}
                  unit={stat.unit}
                  solved={entry?.solved ?? false}
                />
              );
            })}
      </div>

      {/* Objective card */}
      {isGhost ? (
        <div
          className="mt-auto h-10 rounded-xl"
          style={{ background: "#0A1423", border: "1px solid #1F2937" }}
        />
      ) : (
        <ObjectiveCard objective={state.currentObjective} />
      )}
    </div>
  );
}
