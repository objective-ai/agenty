import { vi, describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── CSS Verification Tests ─────────────────────────────────────
describe("DASH-01: Agent Picker CSS", () => {
  let globalsCss: string;

  beforeEach(() => {
    globalsCss = readFileSync(
      resolve(__dirname, "../../app/globals.css"),
      "utf-8"
    );
  });

  it("globals.css contains @keyframes agent-glitch", () => {
    expect(globalsCss).toContain("@keyframes agent-glitch");
  });

  it("globals.css contains .agent-glitch-active class", () => {
    expect(globalsCss).toContain(".agent-glitch-active");
  });

  it("globals.css contains @keyframes holo-grid-scroll", () => {
    expect(globalsCss).toContain("@keyframes holo-grid-scroll");
  });

  it("globals.css contains .holo-grid-bg class", () => {
    expect(globalsCss).toContain(".holo-grid-bg");
  });
});

// ── AgentPicker Module Structure Tests ─────────────────────────
describe("DASH-01: AgentPicker component module", () => {
  let pickerSource: string;

  beforeEach(() => {
    pickerSource = readFileSync(
      resolve(__dirname, "../../components/AgentPicker.tsx"),
      "utf-8"
    );
  });

  it("has 'use client' as first line", () => {
    expect(pickerSource.trimStart().startsWith('"use client"')).toBe(true);
  });

  it("imports from 'motion/react' not 'framer-motion'", () => {
    expect(pickerSource).toContain("motion/react");
    expect(pickerSource).not.toContain("framer-motion");
  });

  it("imports AGENTS and AgentId from AgentContext", () => {
    expect(pickerSource).toContain("AGENTS");
    expect(pickerSource).toContain("AgentId");
  });

  it("imports saveAgentSelection from actions/agent", () => {
    expect(pickerSource).toContain("saveAgentSelection");
  });

  it("imports HolographicAvatar component (Comms Patch)", () => {
    expect(pickerSource).toContain("HolographicAvatar");
  });

  it("exports AgentPicker function", () => {
    expect(pickerSource).toContain("export function AgentPicker");
  });

  it("does not contain 'Coach Cooper' (AGENTS.md prohibition)", () => {
    expect(pickerSource).not.toContain("Coach Cooper");
  });

  it("calls router.refresh() after selection delay", () => {
    expect(pickerSource).toContain("router.refresh()");
  });

  it("uses saveAgentSelection in startTransition", () => {
    expect(pickerSource).toContain("saveAgentSelection");
    expect(pickerSource).toContain("startTransition");
  });

  it("renders all 4 agents by iterating AGENTS", () => {
    expect(pickerSource).toContain("Object.values(AGENTS)");
  });
});
