// src/components/IntelDrawer.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { KnowledgeDropzone } from "./KnowledgeDropzone";
import { listIntelFiles, deleteIntelFile, type IntelFile } from "@/lib/actions/intel";

type IntelDrawerProps = {
  onClose: () => void;
};

export function IntelDrawer({ onClose }: IntelDrawerProps) {
  const [scanComplete, setScanComplete] = useState(false);
  const [files, setFiles] = useState<IntelFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deletingSource, setDeletingSource] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    const result = await listIntelFiles();
    if (result.success) setFiles(result.data);
    setLoadingFiles(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  function handleUploadSuccess() {
    setScanComplete(true);
    setTimeout(() => {
      setScanComplete(false);
      onClose();
    }, 600); // 500ms bar + 100ms buffer
  }

  async function handleDelete(source: string) {
    setDeletingSource(source);
    await deleteIntelFile(source);
    setFiles((prev) => prev.filter((f) => f.source !== source));
    setDeletingSource(null);
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
        <motion.button
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-white/10 font-mono text-sm text-[#A8977E] hover:border-[#3B82F6] hover:text-[#3B82F6]"
          aria-label="Close Intel Vault"
          whileTap={{
            scale: 0.95,
            boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          ×
        </motion.button>
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        <KnowledgeDropzone onSuccess={handleUploadSuccess} />

        {/* Uploaded files list */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#A8977E] mb-3">
            CLASSIFIED DOCUMENTS
            {!loadingFiles && files.length > 0 && (
              <span className="ml-2 text-[#3B82F6]">({files.length})</span>
            )}
          </p>

          {loadingFiles ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl animate-pulse"
                  style={{ background: "#0A1423", border: "1px solid #1F2937" }}
                />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div
              className="rounded-xl px-4 py-6 text-center"
              style={{ background: "#0A1423", border: "1px solid #1F2937" }}
            >
              <p className="font-mono text-[10px] text-[#A8977E44] uppercase tracking-widest">
                NO DOCUMENTS UPLOADED
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <div
                  key={file.source}
                  className="flex items-center justify-between rounded-xl px-4 py-3 gap-3"
                  style={{ background: "#0A1423", border: "1px solid #1F2937" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#F0E6D3]">
                      {file.source}
                    </p>
                    <p className="font-mono text-[10px] text-[#A8977E] mt-0.5">
                      {file.chunkCount} chunks ·{" "}
                      {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(file.source)}
                    disabled={deletingSource === file.source}
                    title="Delete all chunks for this file"
                    className="shrink-0 rounded-lg border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 hover:bg-[#EF444411]"
                    style={{
                      borderColor: "#EF444433",
                      color: "#EF4444",
                      background: "transparent",
                    }}
                  >
                    {deletingSource === file.source ? "…" : "DELETE"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
