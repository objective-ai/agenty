"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);
  const [floatingBadge, setFloatingBadge] = useState<number | null>(null);

  useEffect(() => {
    const delta = value - prevValue.current;
    const duration = Math.min(0.5 + Math.abs(delta) / 50 * 0.7, 1.2);
    const node = nodeRef.current;
    if (!node) return;

    // Show floating badge on gain
    if (delta > 0) {
      setFloatingBadge(delta);
      const timer = setTimeout(() => setFloatingBadge(null), 1200);
      // timer cleanup in effect teardown
      const controls = animate(prevValue.current, value, {
        duration,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo approximation
        onUpdate(latest) {
          node.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
        },
      });

      prevValue.current = value;
      return () => {
        clearTimeout(timer);
        controls.stop();
      };
    }

    // Non-gain (spend or no change): animate without badge
    const controls = animate(prevValue.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo approximation
      onUpdate(latest) {
        node.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
      },
    });

    prevValue.current = value;
    return () => controls.stop();
  }, [value, prefix, suffix]);

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Scale-bounce wrapper */}
      <motion.span
        animate={floatingBadge !== null ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <span ref={nodeRef}>
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </motion.span>

      {/* Floating gain badge (RPG damage number style) */}
      {floatingBadge !== null && (
        <motion.span
          className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2
                     text-sm font-bold text-[var(--agent-accent)] whitespace-nowrap"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -24 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
        >
          +{floatingBadge}
        </motion.span>
      )}
    </span>
  );
}
