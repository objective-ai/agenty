import { existsSync, readFileSync } from "fs";
import path from "path";

describe("DASH-04: Daily Claim", () => {
  const filePath = path.resolve(__dirname, "../../components/DailyClaim.tsx");

  it("file exists at src/components/DailyClaim.tsx", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("has 'use client' as the first line", () => {
    const content = readFileSync(filePath, "utf-8");
    const firstLine = content.split("\n")[0].trim();
    expect(firstLine).toBe('"use client";');
  });

  it("exports DailyClaim function", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/export\s+function\s+DailyClaim/);
  });

  it("calls awardLoot(25, 'daily_bonus') on button click", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('awardLoot(25, "daily_bonus")');
  });

  it("uses useTransition for non-blocking Server Action calls", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useTransition");
    expect(content).toContain("startTransition");
  });

  it("updates gold in EconomyContext on success via setGold", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("setGold");
    expect(content).toContain("result.data.newGold");
  });

  it("does not call supabase directly (Loot Guard)", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toContain("supabase");
    expect(content).not.toContain("createClient");
  });

  it("has min-height 64px for iPad touch target", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("minHeight: 64");
  });

  it("imports from motion/react not framer-motion", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("motion/react");
    expect(content).not.toContain("framer-motion");
  });

  it("shows countdown state after claim", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("claimed");
    expect(content).toContain("Daily Reward Claimed");
  });

  it("uses agent color for button styling", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useAgent");
    expect(content).toContain("agent.color");
  });
});
