"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getProfile } from "@/lib/actions/economy";

interface EconomyState {
  gold: number;
  xp: number;
  energy: number;
  level: number;
  streakDays: number;
}

interface EconomyContextValue extends EconomyState {
  setGold: (v: number) => void;
  setXp: (v: number) => void;
  setEnergy: (v: number) => void;
  setLevel: (v: number) => void;
  setStreakDays: (v: number) => void;
  refreshProfile: () => Promise<void>;
}

const EconomyContext = createContext<EconomyContextValue | null>(null);

interface EconomyProviderProps {
  children: ReactNode;
  initialGold: number;
  initialXp: number;
  initialEnergy: number;
  initialLevel: number;
  initialStreakDays?: number;
}

export function EconomyProvider({
  children,
  initialGold,
  initialXp,
  initialEnergy,
  initialLevel,
  initialStreakDays = 0,
}: EconomyProviderProps) {
  const [gold, setGold] = useState(initialGold);
  const [xp, setXp] = useState(initialXp);
  const [energy, setEnergy] = useState(initialEnergy);
  const [level, setLevel] = useState(initialLevel);
  const [streakDays, setStreakDays] = useState(initialStreakDays);

  const refreshProfile = useCallback(async () => {
    const result = await getProfile();
    if (result.success) {
      setGold(result.data.gold);
      setXp(result.data.xp);
      setEnergy(result.data.energy);
      setLevel(result.data.level);
      setStreakDays(result.data.streak_days);
    }
  }, []);

  return (
    <EconomyContext.Provider
      value={{
        gold, xp, energy, level, streakDays,
        setGold, setXp, setEnergy, setLevel, setStreakDays,
        refreshProfile,
      }}
    >
      {children}
    </EconomyContext.Provider>
  );
}

export function useEconomy() {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error("useEconomy must be inside EconomyProvider");
  return ctx;
}
