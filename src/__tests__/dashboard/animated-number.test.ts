import { existsSync, readFileSync } from "fs";
import path from "path";

describe("AnimatedNumber component", () => {
  const filePath = path.resolve(__dirname, "../../components/AnimatedNumber.tsx");

  it("file exists at src/components/AnimatedNumber.tsx", () => {
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

  it("exports AnimatedNumber function", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/export\s+function\s+AnimatedNumber/);
  });

  it("uses easeOutExpo approximation [0.16, 1, 0.3, 1]", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("0.16, 1, 0.3, 1");
  });

  it("has floating badge with +N pattern for gains", () => {
    const content = readFileSync(filePath, "utf-8");
    // Should reference floating badge and delta > 0 logic
    expect(content).toContain("floatingBadge");
    expect(content).toContain("delta > 0");
  });

  it("uses agent accent color for badge (no hardcoded color)", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("var(--agent-accent)");
  });

  it("implements scale bounce to 110%", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("1.1");
  });

  it("calculates duration based on delta magnitude", () => {
    const content = readFileSync(filePath, "utf-8");
    // Formula: Math.min(0.5 + Math.abs(delta) / 50 * 0.7, 1.2)
    expect(content).toContain("Math.min");
    expect(content).toContain("Math.abs");
  });
});
