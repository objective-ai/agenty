import { existsSync, readFileSync } from "fs";
import path from "path";

describe("HudStatusRail component", () => {
  const filePath = path.resolve(__dirname, "../../components/HudStatusRail.tsx");

  it("file exists at src/components/HudStatusRail.tsx", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("has 'use client' as the first line", () => {
    const content = readFileSync(filePath, "utf-8");
    const firstLine = content.split("\n")[0].trim();
    expect(firstLine).toBe('"use client";');
  });

  it("imports from 'motion/react' not 'framer-motion'", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("motion/react");
    expect(content).not.toContain("framer-motion");
  });

  it("exports HudStatusRail function", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/export\s+function\s+HudStatusRail/);
  });

  it("uses useEconomy() for gold, xp, energy, level", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useEconomy");
    expect(content).toContain("gold");
    expect(content).toContain("energy");
    expect(content).toContain("xp");
    expect(content).toContain("level");
  });

  it("uses useAgent() for agent data", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useAgent");
    expect(content).toContain("agent.color");
  });

  it("renders AnimatedNumber for gold and energy counters", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("AnimatedNumber");
    // Should have at least two AnimatedNumber usages (gold + energy)
    const matches = content.match(/AnimatedNumber/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3); // import + gold + energy
  });

  it("renders HolographicAvatar for mini agent portrait", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("HolographicAvatar");
  });

  it("renders AgentSwitchOverlay for agent switching", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("AgentSwitchOverlay");
    expect(content).toContain("switchOpen");
  });

  it("calculates XP percentage for progress bar", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("xpPercent");
    expect(content).toContain("XP_PER_LEVEL");
  });

  it("uses agent.color for XP bar styling", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("backgroundColor: agent.color");
  });
});

describe("BridgeSidebar component", () => {
  const filePath = path.resolve(__dirname, "../../components/BridgeSidebar.tsx");

  it("file exists at src/components/BridgeSidebar.tsx", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("has 'use client' as the first line", () => {
    const content = readFileSync(filePath, "utf-8");
    const firstLine = content.split("\n")[0].trim();
    expect(firstLine).toBe('"use client";');
  });

  it("exports BridgeSidebar function", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/export\s+function\s+BridgeSidebar/);
  });

  it("uses useAgent() for agent theming", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useAgent");
    expect(content).toContain("agent.color");
  });

  it("has Missions and Inventory navigation links", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("MISSIONS");
    expect(content).toContain("INVENTORY");
  });

  it("uses usePathname for active link detection", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("usePathname");
    expect(content).toContain("isActive");
  });

  it("applies agent accent color to active links", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("borderColor:");
    expect(content).toContain("agent.color");
  });
});
