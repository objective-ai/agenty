// src/components/MissionModeShell.tsx
"use client";

import { useReducer, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MissionConfig } from "@/lib/missions/registry";
import { missionReducer, initialState } from "@/lib/missions/missionReducer";
import { MissionBriefingBoard } from "./MissionBriefingBoard";
import { CommsPanel } from "./CommsPanel";
import { IntelDrawer } from "./IntelDrawer";

type MissionModeShellProps = {
  config: MissionConfig;
};

export function MissionModeShell({ config }: MissionModeShellProps) {
  const [state, dispatch] = useReducer(missionReducer, initialState(config));
  const [signalLost, setSignalLost] = useState(false);

  // Show SIGNAL LOST if Cooper never calls initMission within 15s
  useEffect(() => {
    const t = setTimeout(() => {
      if (state.status === "ghost") setSignalLost(true);
    }, 15_000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear signalLost once mission becomes active
  useEffect(() => {
    if (state.status !== "ghost") setSignalLost(false);
  }, [state.status]);

  const intelButtonDisabled =
    (config.isCritical ?? false) && state.status === "active";

  return (
    <div className="flex h-screen flex-col bg-[#050B14]">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b-2 px-6 py-3 transition-colors duration-500"
        style={{
          borderColor: state.status === "complete" ? "#10B981" : "#3B82F633",
        }}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-black tracking-tight text-[#F0E6D3]">
            {config.title.toUpperCase()}
          </h1>
          <span className="font-mono text-xs text-[#A8977E]">
            // mission mode active
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: "OPEN_INTEL_DRAWER" })}
          disabled={intelButtonDisabled}
          title={
            intelButtonDisabled
              ? "MISSION CRITICAL — complete current objective first"
              : "Load Intel"
          }
          className={[
            "rounded-xl border-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest transition-all duration-200",
            intelButtonDisabled
              ? "cursor-not-allowed opacity-40"
              : "hover:scale-105 hover:shadow-[0_0_12px_#3B82F644] active:scale-95",
          ].join(" ")}
          style={{
            borderColor: "#3B82F6",
            backgroundColor: "#3B82F622",
            color: "#3B82F6",
          }}
        >
          LOAD INTEL
        </button>
      </div>

      {/* Main two-panel layout */}
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {/* Board: w-[40%] shrink-0 — sizing lives here, NOT inside MissionBriefingBoard */}
        <div className="w-[40%] min-w-[280px] shrink-0 min-h-0">
          <MissionBriefingBoard
            config={config}
            state={state}
            dispatch={dispatch}
            signalLost={signalLost}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CommsPanel
            missionConfig={config}
            dispatchMission={dispatch}
          />
        </div>
      </div>

      {/* Intel Drawer + Backdrop — AnimatePresence requires DIRECT children with keys.
          Do NOT wrap in a fragment — fragments cannot be animated by AnimatePresence. */}
      <AnimatePresence>
        {state.isDrawerOpen && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-[#050B14]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
          />
        )}
        {state.isDrawerOpen && (
          <IntelDrawer
            key="drawer"
            onClose={() => dispatch({ type: "CLOSE_INTEL_DRAWER" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
