"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAgent } from "@/contexts/AgentContext";
import { uploadIntel } from "@/lib/actions/intel";

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "dragover" }
  | { status: "uploading" }
  | { status: "success"; chunkCount: number; fileName: string }
  | { status: "error"; message: string };

// ── Component ─────────────────────────────────────────────────────────────────

export function KnowledgeDropzone() {
  const { agent } = useAgent();
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setUploadState({ status: "error", message: "Only PDF files are accepted." });
        return;
      }

      setUploadState({ status: "uploading" });

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadIntel(formData);

      if (result.success) {
        setUploadState({
          status: "success",
          chunkCount: result.data.chunkCount,
          fileName: result.data.fileName,
        });
      } else {
        setUploadState({ status: "error", message: result.error });
      }
    },
    []
  );

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState((prev) =>
      prev.status === "uploading" ? prev : { status: "dragover" }
    );
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState((prev) =>
      prev.status === "dragover" ? { status: "idle" } : prev
    );
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-uploaded
      e.target.value = "";
    },
    [processFile]
  );

  const handleReset = useCallback(() => {
    setUploadState({ status: "idle" });
  }, []);

  // ── Derived style values ──────────────────────────────────────────────────

  const { status } = uploadState;
  const isActive = status === "dragover" || status === "uploading";

  const borderColor =
    status === "error"
      ? "#EF4444"
      : status === "success" || isActive
      ? agent.color
      : "#374151"; // gray-700

  const glowShadow =
    status === "error"
      ? "0 0 20px #EF444466"
      : isActive || status === "success"
      ? `0 0 24px ${agent.color}66`
      : "none";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: agent.color }}
        >
          Intel Upload
        </span>
        <div
          className="h-px flex-1"
          style={{ backgroundColor: `${agent.color}33` }}
        />
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (status !== "uploading") fileInputRef.current?.click();
        }}
        className="relative cursor-pointer select-none overflow-hidden rounded-2xl border-2 border-dashed bg-[#0A1423] p-8 text-center transition-colors"
        style={{
          borderColor,
          boxShadow: glowShadow,
          backgroundColor: isActive ? "#0D1B30" : "#0A1423",
        }}
        animate={{
          borderColor,
          boxShadow: glowShadow,
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Pulsing glow ring during upload */}
        {status === "uploading" && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ border: `2px solid ${agent.color}` }}
            animate={{ opacity: [0.6, 0.15, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <AnimatePresence mode="wait">
          {/* IDLE */}
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <DocumentIcon color={agent.color} />
              <p className="text-sm font-semibold text-[#F0E6D3]">
                Drop intel files here
              </p>
              <p className="text-xs text-[#A8977E]">
                PDF only · Max 10 MB · Click to browse
              </p>
            </motion.div>
          )}

          {/* DRAGOVER */}
          {status === "dragover" && (
            <motion.div
              key="dragover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-3"
            >
              <DocumentIcon color={agent.color} size={40} />
              <p className="text-sm font-bold" style={{ color: agent.color }}>
                Release to upload
              </p>
            </motion.div>
          )}

          {/* UPLOADING */}
          {status === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <SpinnerIcon color={agent.color} />
              <div>
                <p className="text-sm font-bold text-[#F0E6D3]">
                  Processing intel…
                </p>
                <p className="mt-1 font-mono text-xs text-[#A8977E]">
                  Analyzing sectors — stand by
                </p>
              </div>
              {/* Progress shimmer bar */}
              <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full w-24 rounded-full"
                  style={{ backgroundColor: agent.color }}
                  animate={{ x: [-96, 192] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckIcon color={agent.color} />
              </motion.div>
              <div>
                <p className="text-sm font-bold" style={{ color: agent.color }}>
                  Intel Integrated
                </p>
                <p className="mt-0.5 font-mono text-xs text-[#A8977E]">
                  {uploadState.chunkCount} sectors analyzed ·{" "}
                  {uploadState.fileName}
                </p>
              </div>
              <p className="max-w-xs text-center font-mono text-xs text-[#A8977E]">
                &ldquo;Intel integrated, Agent. Knowledge Vault updated.&rdquo;
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="mt-1 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-[#F0E6D3] transition-colors hover:bg-white/10"
              >
                Upload another
              </button>
            </motion.div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <AlertIcon />
              <div>
                <p className="text-sm font-bold text-red-400">Upload Failed</p>
                <p className="mt-0.5 font-mono text-xs text-red-400/70">
                  {uploadState.message}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Icon sub-components ───────────────────────────────────────────────────────

function DocumentIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SpinnerIcon({ color }: { color: string }) {
  return (
    <motion.svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </motion.svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#EF4444"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
