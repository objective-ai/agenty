// src/components/BlueprintDiagram.tsx
"use client";

import { useRef, useEffect } from "react";
import type { Dispatch } from "react";
import type { MissionAction } from "@/lib/missions/missionReducer";

type BlueprintDiagramProps = {
  highlightId: string | null;
  solvedIds: string[];
  dispatchMission: Dispatch<MissionAction>;
};

export function BlueprintDiagram({
  highlightId,
  solvedIds,
  dispatchMission,
}: BlueprintDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // useRef for timer — ensures rapid successive tool calls (Kai answers two questions
  // quickly) clear the previous timer immediately, preventing premature HIGHLIGHT_CLEAR
  // from flickering off the second highlight before its 900ms window is up.
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply and clear the active highlight
  useEffect(() => {
    // Always clear any in-flight timer first
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    if (!highlightId || !svgRef.current) return;
    const el = svgRef.current.querySelector(`#${highlightId}`);
    if (!el) return;

    el.setAttribute("data-highlight", "true");
    highlightTimerRef.current = setTimeout(() => {
      el.removeAttribute("data-highlight");
      highlightTimerRef.current = null;
      dispatchMission({ type: "HIGHLIGHT_CLEAR" });
    }, 900);
    // Cleanup: cancel the timer only — do NOT call removeAttribute here.
    // Removing the attribute in cleanup breaks the highlight in React Strict Mode
    // (dev-only double-invocation clears the attribute before 900ms).
    // The setTimeout callback is the sole authority for removing data-highlight.
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, [highlightId, dispatchMission]);

  // Apply permanent solved state — re-run whenever solvedIds changes
  useEffect(() => {
    if (!svgRef.current) return;
    solvedIds.forEach((id) => {
      svgRef.current!.querySelector(`#${id}`)?.setAttribute("data-solved", "true");
    });
  }, [solvedIds]);

  return (
    <div
      className="relative rounded-xl p-3"
      style={{
        background:
          "repeating-linear-gradient(0deg,transparent,transparent 14px,#3B82F60A 14px,#3B82F60A 15px)," +
          "repeating-linear-gradient(90deg,transparent,transparent 14px,#3B82F60A 14px,#3B82F60A 15px)",
        border: "1px solid #3B82F644",
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 280 100"
        width="100%"
        height="auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Water */}
        <path
          d="M16 72 Q46 68 76 72 Q106 76 136 72 Q166 68 196 72 Q226 76 256 72 Q266 70 264 72"
          stroke="#3B82F6"
          strokeWidth="0.6"
          strokeOpacity="0.25"
        />
        {/* SPAN */}
        <line
          id="span"
          x1="16" y1="62" x2="264" y2="62"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        {/* TOWERS */}
        <g id="towers" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.6">
          <line x1="80" y1="15" x2="80" y2="62" />
          <line x1="200" y1="15" x2="200" y2="62" />
        </g>
        {/* CABLES */}
        <g id="cables" stroke="#3B82F6" strokeWidth="0.9" strokeOpacity="0.4">
          <line x1="80" y1="17" x2="20" y2="62" />
          <line x1="80" y1="17" x2="44" y2="62" />
          <line x1="80" y1="17" x2="62" y2="62" />
          <line x1="80" y1="17" x2="98" y2="62" />
          <line x1="80" y1="17" x2="116" y2="62" />
          <line x1="200" y1="17" x2="260" y2="62" />
          <line x1="200" y1="17" x2="236" y2="62" />
          <line x1="200" y1="17" x2="218" y2="62" />
          <line x1="200" y1="17" x2="182" y2="62" />
          <line x1="200" y1="17" x2="164" y2="62" />
        </g>
        {/* Label */}
        <text
          x="140"
          y="94"
          textAnchor="middle"
          fontSize="8"
          fill="#3B82F644"
          fontFamily="monospace"
          letterSpacing="2"
        >
          DRAGON BRIDGE · DA NANG
        </text>
      </svg>
    </div>
  );
}
