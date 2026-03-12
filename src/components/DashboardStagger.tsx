"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

const portalWarp = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DashboardStagger({ children }: { children: React.ReactNode }) {
  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Portal warp on first visit after login (one-time)
  const isPortal = useMemo(() => {
    if (typeof window === "undefined" || prefersReduced) return false;
    if (sessionStorage.getItem("portalPlayed")) return false;
    sessionStorage.setItem("portalPlayed", "1");
    return true;
  }, [prefersReduced]);

  if (prefersReduced) {
    return <>{children}</>;
  }

  if (isPortal) {
    return (
      <motion.div initial={portalWarp.initial} animate={portalWarp.animate}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}
