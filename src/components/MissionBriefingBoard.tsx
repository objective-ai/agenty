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
  shields?: number;
  isDamaged?: boolean;
  bannerUrl?: string | null;
};

export function MissionBriefingBoard({
  config,
  state,
  dispatch,
  shields = 100,
  isDamaged = false,
  bannerUrl,
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

      {/* Banner image (from Gemini generation) */}
      {bannerUrl && !isGhost && (
        <div className="overflow-hidden rounded-xl border border-[#3B82F633]">
          <img
            src={bannerUrl}
            alt="Mission banner"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {/* Shield bar */}
      {!isGhost && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[2px]">
            <span style={{ color: shields > 30 ? "#3B82F6" : "#EF4444" }}>
              SHIELDS
            </span>
            <span style={{ color: shields > 30 ? "#3B82F699" : "#EF444499" }}>
              {shields}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: "#0A1423", border: "1px solid #1F2937" }}
          >
            <div
              className={isDamaged ? "shield-flicker" : ""}
              style={{
                width: `${shields}%`,
                height: "100%",
                borderRadius: "9999px",
                background:
                  shields > 30
                    ? "linear-gradient(90deg, #3B82F6, #1D4ED8)"
                    : "#EF4444",
                transition: "width 0.4s ease, background 0.4s ease",
              }}
            />
          </div>
          <style>{`
            @keyframes shield-flicker {
              0%, 100% { filter: hue-rotate(0deg) brightness(1); }
              50% { filter: hue-rotate(-30deg) brightness(0.85); }
            }
            .shield-flicker {
              animation: shield-flicker 0.8s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .shield-flicker {
                animation: none;
                filter: hue-rotate(-15deg) brightness(0.9);
              }
            }
          `}</style>
        </div>
      )}

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
              TACTICAL SCAN
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
              blueprintAsset={config.blueprintAsset}
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
