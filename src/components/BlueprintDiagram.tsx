// src/components/BlueprintDiagram.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import type { Dispatch } from "react";
import type { MissionAction } from "@/lib/missions/missionReducer";

type BlueprintDiagramProps = {
  blueprintAsset: string;
  highlightId: string | null;
  solvedIds: string[];
  dispatchMission: Dispatch<MissionAction>;
};

export function BlueprintDiagram({
  blueprintAsset,
  highlightId,
  solvedIds,
  dispatchMission,
}: BlueprintDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [svgHtml, setSvgHtml] = useState<string | null>(null);

  // Fetch the SVG file and inline it
  useEffect(() => {
    let cancelled = false;
    fetch(`/blueprints/${blueprintAsset}.svg`)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setSvgHtml(text);
      });
    return () => { cancelled = true; };
  }, [blueprintAsset]);

  // Apply and clear the active highlight
  useEffect(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    if (!highlightId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`#${highlightId}`);
    if (!el) return;

    el.setAttribute("data-highlight", "true");
    highlightTimerRef.current = setTimeout(() => {
      el.removeAttribute("data-highlight");
      highlightTimerRef.current = null;
      dispatchMission({ type: "HIGHLIGHT_CLEAR" });
    }, 900);

    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, [highlightId, dispatchMission]);

  // Apply permanent solved state
  useEffect(() => {
    if (!containerRef.current) return;
    solvedIds.forEach((id) => {
      containerRef.current!.querySelector(`#${id}`)?.setAttribute("data-solved", "true");
    });
  }, [solvedIds, svgHtml]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl p-3 [&_svg]:w-full [&_svg]:h-auto"
      style={{
        background:
          "repeating-linear-gradient(0deg,transparent,transparent 14px,#3B82F60A 14px,#3B82F60A 15px)," +
          "repeating-linear-gradient(90deg,transparent,transparent 14px,#3B82F60A 14px,#3B82F60A 15px)",
        border: "1px solid #3B82F644",
      }}
      dangerouslySetInnerHTML={svgHtml ? { __html: svgHtml } : undefined}
    />
  );
}
