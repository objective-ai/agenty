// src/app/auth/page.tsx
// ═══════════════════════════════════════════════════════════════════
// /auth — Magic link login. Adventure Navy design system.
// ═══════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050B14] p-4">
      <div
        className="w-full max-w-md rounded-2xl border-2 p-8"
        style={{
          borderColor: "#3B82F633",
          background: "#080F1A",
          boxShadow: "0 0 40px #3B82F611",
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#3B82F6] mb-2">
            AGENTY MISSION CONTROL
          </p>
          <h1 className="text-2xl font-black text-[#F0E6D3] tracking-tight">
            AGENT SIGN-IN
          </h1>
          <p className="mt-1 text-xs text-[#A8977E]">
            Enter your email — Cooper will send a mission link.
          </p>
        </div>

        {status === "sent" ? (
          <div
            className="rounded-xl border-2 p-6 text-center"
            style={{ borderColor: "#10B98133", background: "#10B98108" }}
          >
            <p className="font-mono text-xs uppercase tracking-widest text-[#10B981] mb-2">
              TRANSMISSION SENT
            </p>
            <p className="text-sm text-[#F0E6D3]">
              Check your email for a magic link. No password needed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-mono text-[10px] uppercase tracking-[2px] text-[#A8977E]"
              >
                Agent Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="rounded-xl border-2 bg-[#050B14] px-4 py-3 text-sm text-[#F0E6D3] outline-none transition-all placeholder:text-[#A8977E44]"
                style={{ borderColor: "#3B82F633" }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#3B82F633")}
              />
            </div>

            {status === "error" && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl border-2 px-6 py-3 font-mono text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50"
              style={{
                borderColor: "#3B82F6",
                background: "#3B82F622",
                color: "#3B82F6",
              }}
            >
              {status === "loading" ? "TRANSMITTING…" : "SEND MAGIC LINK"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
