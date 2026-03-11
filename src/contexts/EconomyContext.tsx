"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface EconomyState {
  gold: number;
  xp: number;
  energy: number;
  level: number;
}

interface EconomyContextValue extends EconomyState {
  setGold: (v: number) => void;
  setEnergy: (v: number) => void;
}

const EconomyContext = createContext<EconomyContextValue | null>(null);

interface EconomyProviderProps {
  children: ReactNode;
  initialGold: number;
  initialXp: number;
  initialEnergy: number;
  initialLevel: number;
}

export function EconomyProvider({
  children,
  initialGold,
  initialXp,
  initialEnergy,
  initialLevel,
}: EconomyProviderProps) {
  const [gold, setGold] = useState(initialGold);
  const [xp] = useState(initialXp);
  const [energy, setEnergy] = useState(initialEnergy);
  const [level] = useState(initialLevel);

  return (
    <EconomyContext.Provider value={{ gold, xp, energy, level, setGold, setEnergy }}>
      {children}
    </EconomyContext.Provider>
  );
}

export function useEconomy() {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error("useEconomy must be inside EconomyProvider");
  return ctx;
}
