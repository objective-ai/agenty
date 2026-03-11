import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── AgentSwitchOverlay Module Structure Tests ──────────────────
describe("DASH-01: AgentSwitchOverlay component module", () => {
  let overlaySource: string;

  beforeEach(() => {
    overlaySource = readFileSync(
      resolve(__dirname, "../../components/AgentSwitchOverlay.tsx"),
      "utf-8"
    );
  });

  it("has 'use client' as first line", () => {
    expect(overlaySource.trimStart().startsWith('"use client"')).toBe(true);
  });

  it("imports from 'motion/react' not 'framer-motion'", () => {
    expect(overlaySource).toContain("motion/react");
    expect(overlaySource).not.toContain("framer-motion");
  });

  it("imports AnimatePresence from motion/react", () => {
    expect(overlaySource).toContain("AnimatePresence");
  });

  it("imports saveAgentSelection from actions/agent", () => {
    expect(overlaySource).toContain("saveAgentSelection");
  });

  it("imports HolographicAvatar component (Comms Patch)", () => {
    expect(overlaySource).toContain("HolographicAvatar");
  });

  it("exports AgentSwitchOverlay function", () => {
    expect(overlaySource).toContain("export function AgentSwitchOverlay");
  });

  it("triggers glitch class on document.documentElement", () => {
    expect(overlaySource).toContain("agent-glitch-active");
    expect(overlaySource).toContain("documentElement");
  });

  it("removes glitch class after 800ms timeout", () => {
    expect(overlaySource).toContain("800");
    expect(overlaySource).toContain("classList.remove");
  });

  it("calls saveAgentSelection to persist agent switch", () => {
    expect(overlaySource).toContain("saveAgentSelection");
    expect(overlaySource).toContain("startTransition");
  });

  it("calls router.refresh() on success", () => {
    expect(overlaySource).toContain("router.refresh()");
  });

  it("shows error text on failure (non-intrusive)", () => {
    expect(overlaySource).toContain("error");
    expect(overlaySource).toContain("setError");
  });

  it("shows '0 quests completed' placeholder stat", () => {
    expect(overlaySource).toContain("0 quests completed");
  });

  it("does not contain 'Coach Cooper' (AGENTS.md prohibition)", () => {
    expect(overlaySource).not.toContain("Coach Cooper");
  });

  it("uses backdrop-blur for blurred overlay", () => {
    expect(overlaySource).toContain("backdrop-blur");
  });
});

// ── Bridge Page Wiring Tests ───────────────────────────────────
describe("DASH-01: Bridge page AgentPicker wiring", () => {
  let bridgeSource: string;

  beforeEach(() => {
    bridgeSource = readFileSync(
      resolve(__dirname, "../../app/bridge/page.tsx"),
      "utf-8"
    );
  });

  it("imports AgentPicker from components", () => {
    expect(bridgeSource).toContain("AgentPicker");
    expect(bridgeSource).toContain("@/components/AgentPicker");
  });

  it("renders AgentPicker when no agent_id", () => {
    expect(bridgeSource).toContain("<AgentPicker");
  });

  it("does not contain placeholder 'Loading agent selection' text", () => {
    expect(bridgeSource).not.toContain("Loading agent selection");
  });
});
