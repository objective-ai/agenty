import { existsSync, readFileSync } from "fs";
import path from "path";

describe("DASH-05: Start Quest Button", () => {
  const filePath = path.resolve(__dirname, "../../components/StartQuestButton.tsx");

  it("file exists at src/components/StartQuestButton.tsx", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("has 'use client' as the first line", () => {
    const content = readFileSync(filePath, "utf-8");
    const firstLine = content.split("\n")[0].trim();
    expect(firstLine).toBe('"use client";');
  });

  it("exports StartQuestButton function", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/export\s+function\s+StartQuestButton/);
  });

  it("calls spendEnergy(10, 'training_quest') on button click", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain('spendEnergy(energyCost, "training_quest")');
  });

  it("uses useTransition for non-blocking Server Action calls", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useTransition");
    expect(content).toContain("startTransition");
  });

  it("updates energy in EconomyContext on success via setEnergy", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("setEnergy");
    expect(content).toContain("result.data.remainingEnergy");
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

  it("has pulsing glow animation", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("boxShadow");
    expect(content).toContain("Infinity");
  });

  it("shows insufficient energy message when not enough energy", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("NOT ENOUGH ENERGY");
    expect(content).toContain("hasEnergy");
  });

  it("uses agent color for button styling", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("useAgent");
    expect(content).toContain("agent.color");
  });

  it("imports from motion/react not framer-motion", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("motion/react");
    expect(content).not.toContain("framer-motion");
  });
});
