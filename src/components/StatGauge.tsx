// src/components/StatGauge.tsx
"use client";

import { motion } from "motion/react";

type StatGaugeProps = {
  label: string;
  value: number | null;
  unit: string;
  solved: boolean;
};

export function StatGauge({ label, value, unit, solved }: StatGaugeProps) {
  const displayValue = value !== null ? String(value) : "—";

  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-300"
      style={{
        background: "#0A1423",
        border: solved ? "2px solid #10B981" : "1px solid #3B82F633",
        boxShadow: solved ? "0 0 12px #10B98144" : "none",
      }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-widest"
        style={{ color: "#A8977E" }}
      >
        {label}
      </span>

      <div className="flex items-baseline gap-1.5">
        {/* key={value ?? 'unset'} — using the numeric value avoids all-null gauges
            sharing key "—" on initial render, which would cause React key collision */}
        <motion.span
          key={value !== null ? String(value) : "unset"}
          className="font-mono text-sm font-black"
          style={{
            color: solved ? "#10B981" : "#3B82F6",
            textShadow: solved ? "0 0 8px #10B98188" : "0 0 8px #3B82F688",
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={
            value !== null
              ? { scale: [1, 1.06, 1], opacity: [0.5, 1, 1] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          {displayValue}
        </motion.span>

        {value !== null && (
          <span
            className="font-mono text-[9px]"
            style={{ color: "#3B82F666" }}
          >
            {unit}
          </span>
        )}

        {/* Badge: ▲ while active, ✓ when solved */}
        {value !== null && (
          <span
            className="ml-1 text-[9px]"
            style={{ color: "#10B981" }}
          >
            {solved ? "✓" : "▲"}
          </span>
        )}
      </div>
    </div>
  );
}
