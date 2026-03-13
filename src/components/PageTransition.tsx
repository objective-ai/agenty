"use client";

import { usePathname } from "next/navigation";
import { useRef, useMemo } from "react";
import { motion } from "motion/react";

// Route depth map for transition direction
function getDepth(path: string): number {
  if (path === "/play") return 0;
  const segments = path.replace("/play/", "").split("/").filter(Boolean);
  // /play/lab is depth 2 (mission mode = deeper)
  if (segments[0] === "lab") return 2;
  return segments.length;
}

const crossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
};

const slideFromRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const slideFromLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function getVariant(prevDepth: number | null, currDepth: number) {
  if (prevDepth === null) return crossfade; // first mount
  if (currDepth > prevDepth) return slideFromRight; // going deeper
  if (currDepth < prevDepth) return slideFromLeft; // going back
  return crossfade; // same depth (lateral)
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevDepthRef = useRef<number | null>(null);

  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const currDepth = getDepth(pathname);
  const variant = prefersReduced
    ? { initial: {}, animate: {} }
    : getVariant(prevDepthRef.current, currDepth);

  // Update ref AFTER computing variant (so we compare old vs new)
  prevDepthRef.current = currDepth;

  return (
    <motion.div
      key={pathname}
      initial={variant.initial}
      animate={variant.animate}
    >
      {children}
    </motion.div>
  );
}
