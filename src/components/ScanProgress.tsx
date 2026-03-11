"use client";

import { useEffect, useState } from "react";

export function ScanProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((p) => (p >= 99.9 ? 0 : Math.min(p + 1.7, 99.9)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filled = Math.round((percent / 100) * 18);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(18 - filled);

  return (
    <div className="font-mono text-sm text-[#A8977E]">
      <span className="text-[#3B82F6]">[{bar}]</span>
      {" "}{percent.toFixed(1)}% {percent >= 99.9 ? "Searching..." : "Scanning for Quests..."}
    </div>
  );
}
