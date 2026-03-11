// src/components/IntelDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { KnowledgeDropzone } from "./KnowledgeDropzone";

type IntelDrawerProps = {
  onClose: () => void;
};

export function IntelDrawer({ onClose }: IntelDrawerProps) {
  const [scanComplete, setScanComplete] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleUploadSuccess() {
    setScanComplete(true);
    setTimeout(() => {
      setScanComplete(false);
      onClose();
    }, 600); // 500ms bar + 100ms buffer
  }

  return (
    <motion.div
      className="fixed right-0 top-0 z-50 flex h-screen flex-col overflow-hidden bg-[#050B14]"
      style={{ width: "65vw", borderLeft: "2px solid #3B82F633" }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Drawer header */}
      <div
        className="flex items-center justify-between border-b-2 px-5 py-4"
        style={{ borderColor: "#3B82F633" }}
      >
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-widest text-[#3B82F6]">
            INTEL VAULT
          </p>
          <p className="font-mono text-[10px] text-[#A8977E]">
            Upload classified documents
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 font-mono text-sm text-[#A8977E] transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
          aria-label="Close Intel Vault"
        >
          ×
        </button>
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto p-5">
        <KnowledgeDropzone onSuccess={handleUploadSuccess} />
      </div>

      {/* SCAN COMPLETE bar — renders when scanComplete is true */}
      {scanComplete && (
        <motion.div
          className="absolute bottom-0 left-0 z-10 flex h-8 items-center justify-center bg-[#10B981]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-mono text-xs font-black tracking-widest text-[#050B14]">
            SCAN COMPLETE
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
