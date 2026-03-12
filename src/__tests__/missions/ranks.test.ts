import { describe, it, expect } from "vitest";
import { getRankTitle } from "@/lib/ranks";

describe("getRankTitle", () => {
  it("returns 'Technical Scout' for level 1", () => {
    expect(getRankTitle(1)).toBe("Technical Scout");
  });

  it("returns 'Technical Scout' for level 5", () => {
    expect(getRankTitle(5)).toBe("Technical Scout");
  });

  it("returns 'Field Engineer' for level 6", () => {
    expect(getRankTitle(6)).toBe("Field Engineer");
  });

  it("returns 'Field Engineer' for level 10", () => {
    expect(getRankTitle(10)).toBe("Field Engineer");
  });

  it("returns 'Tactical Architect' for level 11", () => {
    expect(getRankTitle(11)).toBe("Tactical Architect");
  });

  it("returns 'Tactical Architect' for level 15", () => {
    expect(getRankTitle(15)).toBe("Tactical Architect");
  });

  it("returns 'Agenty Commander' for level 16", () => {
    expect(getRankTitle(16)).toBe("Agenty Commander");
  });

  it("returns 'Agenty Commander' for level 100", () => {
    expect(getRankTitle(100)).toBe("Agenty Commander");
  });
});
