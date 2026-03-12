// src/__tests__/missions/shields.test.ts
// TDD RED: Tests for shields mechanic in missionReducer + completeMission Server Action

import { describe, it, expect } from "vitest";
import {
  missionReducer,
  initialState,
  type MissionState,
} from "@/lib/missions/missionReducer";
import type { MissionConfig } from "@/lib/missions/registry";

// Minimal mission config fixture
const MOCK_CONFIG: MissionConfig = {
  id: "test-mission",
  title: "Test Mission",
  blueprintAsset: "/test.svg",
  accentColor: "#3B82F6",
  defaultObjective: "Solve the test",
  description: "A test mission",
  stats: [
    { id: "stat-a", label: "Stat A", unit: "m", goalValue: 100, svgHighlightId: "zone-a" },
  ],
  xpReward: 200,
  goldReward: 50,
};

describe("missionReducer shields", () => {
  let state: MissionState;

  beforeEach(() => {
    state = initialState(MOCK_CONFIG);
  });

  it("initialState sets shields=100 and isDamaged=false", () => {
    expect(state.shields).toBe(100);
    expect(state.isDamaged).toBe(false);
  });

  it("SHIELD_HIT reduces shields by 10", () => {
    const next = missionReducer(state, { type: "SHIELD_HIT" });
    expect(next.shields).toBe(90);
    expect(next.isDamaged).toBe(false);
  });

  it("SHIELD_HIT at shields=10 sets shields=0 and isDamaged=true", () => {
    // Drain to 10
    let s = state;
    for (let i = 0; i < 9; i++) {
      s = missionReducer(s, { type: "SHIELD_HIT" });
    }
    expect(s.shields).toBe(10);
    expect(s.isDamaged).toBe(false);

    // One more hit
    const damaged = missionReducer(s, { type: "SHIELD_HIT" });
    expect(damaged.shields).toBe(0);
    expect(damaged.isDamaged).toBe(true);
  });

  it("SHIELD_HIT at shields=0 keeps shields=0 and isDamaged=true", () => {
    // Drain to 0
    let s = state;
    for (let i = 0; i < 10; i++) {
      s = missionReducer(s, { type: "SHIELD_HIT" });
    }
    expect(s.shields).toBe(0);
    expect(s.isDamaged).toBe(true);

    // Extra hit
    const still = missionReducer(s, { type: "SHIELD_HIT" });
    expect(still.shields).toBe(0);
    expect(still.isDamaged).toBe(true);
  });

  it("SET_SHIELDS sets shields to payload value and computes isDamaged", () => {
    const next = missionReducer(state, {
      type: "SET_SHIELDS",
      payload: { shields: 0 },
    });
    expect(next.shields).toBe(0);
    expect(next.isDamaged).toBe(true);

    const restored = missionReducer(next, {
      type: "SET_SHIELDS",
      payload: { shields: 50 },
    });
    expect(restored.shields).toBe(50);
    expect(restored.isDamaged).toBe(false);
  });

  it("MissionAction type includes SHIELD_HIT and SET_SHIELDS", () => {
    // Type-level test: these should compile without error
    const hit: Parameters<typeof missionReducer>[1] = { type: "SHIELD_HIT" };
    const set: Parameters<typeof missionReducer>[1] = {
      type: "SET_SHIELDS",
      payload: { shields: 50 },
    };
    expect(hit.type).toBe("SHIELD_HIT");
    expect(set.type).toBe("SET_SHIELDS");
  });
});
