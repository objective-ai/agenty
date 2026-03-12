// ── Rank Tiers ────────────────────────────────────────
// Pure function — no external dependencies.

const RANK_TIERS = [
  { minLevel: 16, title: "Agenty Commander" },
  { minLevel: 11, title: "Tactical Architect" },
  { minLevel: 6, title: "Field Engineer" },
  { minLevel: 1, title: "Technical Scout" },
] as const;

/**
 * Returns the rank title for a given level.
 * Level 1-5: Technical Scout
 * Level 6-10: Field Engineer
 * Level 11-15: Tactical Architect
 * Level 16+: Agenty Commander
 */
export function getRankTitle(level: number): string {
  for (const tier of RANK_TIERS) {
    if (level >= tier.minLevel) return tier.title;
  }
  return RANK_TIERS[RANK_TIERS.length - 1].title;
}
