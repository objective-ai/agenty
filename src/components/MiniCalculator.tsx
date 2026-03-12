// src/components/MiniCalculator.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";

type MiniCalculatorProps = {
  accentColor: string;
  onSend: (text: string) => void;
};

// Layout: 4 number cols + 1 operator col on the right
// Row 1: ( ) ⌫ C  | ÷
// Row 2: 7 8 9    | ×
// Row 3: 4 5 6    | −
// Row 4: 1 2 3    | +
// Row 5: 0 . =    | ⌫ (spare)
const ROWS = [
  { keys: ["(", ")", "⌫", "C"], op: "÷" },
  { keys: ["7", "8", "9"], op: "×" },
  { keys: ["4", "5", "6"], op: "−" },
  { keys: ["1", "2", "3"], op: "+" },
  { keys: ["0", ".", "="], op: null },
];

function evaluate(expr: string): number | null {
  const jsExpr = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  if (!/^[\d+\-*/.() ]+$/.test(jsExpr.trim())) return null;
  if (!jsExpr.trim()) return null;
  try {
    const result = Function(`"use strict"; return (${jsExpr})`)();
    if (typeof result !== "number" || !isFinite(result)) return null;
    return Math.round(result * 10000) / 10000;
  } catch {
    return null;
  }
}

export function MiniCalculator({ accentColor, onSend }: MiniCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const result = expr ? evaluate(expr) : null;

  function handleButton(btn: string) {
    if (btn === "C") { setExpr(""); return; }
    if (btn === "⌫") { setExpr((prev) => prev.slice(0, -1)); return; }
    if (btn === "=") {
      // Evaluate and append " = result" to the expression, then continue
      if (result !== null) {
        setExpr(String(result));
      }
      return;
    }
    setExpr((prev) => prev + btn);
  }

  function handleSend() {
    if (result === null) return;
    onSend(`${expr} = ${result}`);
    setExpr("");
    setOpen(false);
  }

  function btnStyle(btn: string) {
    const ops = "÷×−+";
    if (btn === "C") return { bg: "#7F1D1D44", border: "#EF444444", color: "#EF4444" };
    if (btn === "⌫") return { bg: "#7F1D1D22", border: "#EF444433", color: "#EF4444CC" };
    if (btn === "=") return { bg: `${accentColor}33`, border: accentColor, color: accentColor };
    if (btn === "(" || btn === ")") return { bg: `${accentColor}11`, border: `${accentColor}33`, color: `${accentColor}CC` };
    if (ops.includes(btn)) return { bg: `${accentColor}22`, border: `${accentColor}44`, color: accentColor };
    return { bg: "#1A2640", border: "#ffffff15", color: "#F0E6D3" };
  }

  const tapProps = {
    whileTap: {
      scale: 0.92,
      boxShadow: `0 0 12px rgba(var(--agent-accent-rgb), 0.5)`,
    },
    transition: { type: "spring" as const, stiffness: 500, damping: 20 },
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Toggle button — 44px touch target */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border-2 hover:scale-105"
        style={{
          borderColor: open ? accentColor : `${accentColor}44`,
          backgroundColor: open ? `${accentColor}33` : `${accentColor}11`,
          boxShadow: open ? `0 0 12px ${accentColor}44` : "none",
        }}
        title="Calculator"
        {...tapProps}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="8" y2="10.01" />
          <line x1="12" y1="10" x2="12" y2="10.01" />
          <line x1="16" y1="10" x2="16" y2="10.01" />
          <line x1="8" y1="14" x2="8" y2="14.01" />
          <line x1="12" y1="14" x2="12" y2="14.01" />
          <line x1="16" y1="14" x2="16" y2="14.01" />
          <line x1="8" y1="18" x2="8" y2="18.01" />
          <line x1="12" y1="18" x2="16" y2="18" />
        </svg>
      </motion.button>

      {/* Calculator popover */}
      {open && (
        <div
          className="absolute bottom-12 right-0 z-50 w-72 rounded-xl border-2 p-3"
          style={{
            backgroundColor: "#0A1423",
            borderColor: `${accentColor}66`,
            boxShadow: `0 0 24px ${accentColor}22, 0 8px 32px #00000088`,
          }}
        >
          {/* Header */}
          <div
            className="mb-2 text-center font-mono text-[9px] uppercase tracking-[2px]"
            style={{ color: `${accentColor}77` }}
          >
            FIELD CALCULATOR
          </div>

          {/* Display */}
          <div
            className="mb-3 rounded-lg px-3 py-2.5 text-right font-mono"
            style={{
              backgroundColor: "#050B14",
              border: `1px solid ${accentColor}33`,
              minHeight: "60px",
            }}
          >
            <p className="text-sm truncate" style={{ color: `${accentColor}99` }}>
              {expr || "\u00A0"}
            </p>
            <p
              className="text-xl font-bold"
              style={{ color: result !== null ? "#F0E6D3" : `${accentColor}33` }}
            >
              {result !== null ? `= ${result}` : "—"}
            </p>
          </div>

          {/* Button grid — 5 columns: 4 keys + 1 operator */}
          <div className="flex flex-col gap-1.5">
            {ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-1.5">
                {/* Left keys — fill remaining space equally */}
                <div className="flex flex-1 gap-1.5">
                  {row.keys.map((btn) => {
                    const s = btnStyle(btn);
                    return (
                      <motion.button
                        key={btn}
                        type="button"
                        onClick={() => handleButton(btn)}
                        className="flex h-11 flex-1 items-center justify-center rounded-lg font-mono text-sm font-bold hover:scale-105"
                        style={{
                          backgroundColor: s.bg,
                          border: `1px solid ${s.border}`,
                          color: s.color,
                        }}
                        {...tapProps}
                      >
                        {btn}
                      </motion.button>
                    );
                  })}
                </div>
                {/* Right operator column — fixed width */}
                {row.op ? (
                  <motion.button
                    type="button"
                    onClick={() => handleButton(row.op!)}
                    className="flex h-11 w-12 items-center justify-center rounded-lg font-mono text-base font-bold hover:scale-105"
                    style={{
                      backgroundColor: `${accentColor}22`,
                      border: `1px solid ${accentColor}44`,
                      color: accentColor,
                    }}
                    {...tapProps}
                  >
                    {row.op}
                  </motion.button>
                ) : (
                  <div className="w-12" />
                )}
              </div>
            ))}
          </div>

          {/* Send answer */}
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={result === null}
            className="mt-2.5 w-full rounded-lg py-2.5 font-mono text-xs font-black uppercase tracking-widest hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              backgroundColor: `${accentColor}22`,
              border: `2px solid ${accentColor}`,
              color: accentColor,
              boxShadow: result !== null ? `0 0 12px ${accentColor}33` : "none",
            }}
            {...tapProps}
          >
            SEND ANSWER
          </motion.button>
        </div>
      )}
    </div>
  );
}
