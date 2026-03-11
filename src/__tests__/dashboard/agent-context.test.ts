import { existsSync, readFileSync } from "fs";
import path from "path";

describe("AgentContext hydration fix", () => {
  const filePath = path.resolve(__dirname, "../../contexts/AgentContext.tsx");

  it("file exists at src/contexts/AgentContext.tsx", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("has 'use client' as the first line", () => {
    const content = readFileSync(filePath, "utf-8");
    const firstLine = content.split("\n")[0].trim();
    expect(firstLine).toBe('"use client";');
  });

  it("does NOT contain 'Coach Cooper'", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toContain("Coach Cooper");
  });

  it("does NOT have inline document.setAttribute in render body", () => {
    const content = readFileSync(filePath, "utf-8");
    // The broken pattern: if (typeof document !== "undefined") { document.documentElement.setAttribute(...) }
    expect(content).not.toMatch(/if\s*\(\s*typeof document\s*!==?\s*["']undefined["']\s*\)/);
  });

  it("uses useIsomorphicLayoutEffect for data-agent attribute", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useIsomorphicLayoutEffect");
    expect(content).toContain("useLayoutEffect");
  });

  it("AgentProvider accepts initialAgent prop", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("initialAgent");
  });

  it("Agent interface has specialty field", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("specialty:");
    // also in the interface
    expect(content).toMatch(/specialty:\s*string/);
  });

  it("Agent interface has color field", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("color:");
    expect(content).toMatch(/color:\s*string/);
  });

  it("Agent interface has avatar field", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("avatar:");
    expect(content).toMatch(/avatar:\s*string\s*\|\s*null/);
  });

  it("exports AgentProvider, useAgent, AGENTS, and AgentId", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/export\s+function\s+AgentProvider/);
    expect(content).toMatch(/export\s+function\s+useAgent/);
    expect(content).toMatch(/export\s+(const|type)\s+AGENTS/);
    expect(content).toMatch(/export\s+type\s+AgentId/);
  });
});
