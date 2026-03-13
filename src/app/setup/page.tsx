"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setupChildAccount } from "@/lib/actions/auth";

// ═══════════════════════════════════════════════════════════════════
// /setup — Parent creates kid account with display name + PIN
// ═══════════════════════════════════════════════════════════════════

export default function SetupPage() {
  const router = useRouter();

  // Step 1 = create account, Step 2 = success
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kidEmail, setKidEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 numbers.");
      return;
    }

    // Validate PIN match
    if (pin !== pinConfirm) {
      setError("PINs don't match, Agent! Try again.");
      setPinConfirm("");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.set("pin", pin);
    formData.set("displayName", displayName || "Adventurer");

    const result = await setupChildAccount(formData);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.kidEmail) {
      // Save to localStorage for this device
      localStorage.setItem("agenty_kid_email", result.kidEmail);
      localStorage.setItem("agenty_display_name", displayName || "Adventurer");
      setKidEmail(result.kidEmail);
      setStep(2);
    }
  }

  function handleCopy() {
    if (kidEmail) {
      navigator.clipboard.writeText(kidEmail).catch(() => {
        // Fallback: select the input text
      });
    }
  }

  // ─── Step Indicator ─────────────────────────────────────────
  function StepIndicator() {
    return (
      <div className="flex items-center gap-2 mb-6">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
            step === 1
              ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#3B82F6]"
              : "border-[#3B82F6] bg-[#3B82F6] text-white"
          }`}
        >
          {step > 1 ? "\u2713" : "1"}
        </div>
        <div className="h-0.5 w-8 bg-white/10" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
            step === 2
              ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#3B82F6]"
              : "border-white/10 bg-transparent text-[#6B5F4D]"
          }`}
        >
          2
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4"
      data-agent="cooper"
    >
      {/* Logo */}
      <div className="mb-6 text-center">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-[#F0E6D3]">
          AGENTY
        </h1>
        <p className="text-xs text-[#A8977E]">Quest for Knowledge</p>
      </div>

      <StepIndicator />

      {/* ─── Step 1: Create Account Form ──────────────────────── */}
      {step === 1 && (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-[#F0E6D3] text-center">
            Create Agent Account
          </h2>
          <p className="text-xs text-[#A8977E] text-center mb-2">
            Set up your young agent&apos;s profile and secure PIN code.
          </p>

          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-xs font-medium text-[#A8977E]"
            >
              Agent Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What's your agent name?"
              className="w-full rounded-xl border-2 border-white/10 bg-[#0A1423] px-4 py-3
                         text-sm text-[#F0E6D3] placeholder:text-[#6B5F4D]
                         focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
            />
          </div>

          {/* PIN */}
          <div>
            <label
              htmlFor="pin"
              className="mb-1 block text-xs font-medium text-[#A8977E]"
            >
              6-Digit PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit PIN"
              className="w-full rounded-xl border-2 border-white/10 bg-[#0A1423] px-4 py-3
                         text-sm text-[#F0E6D3] placeholder:text-[#6B5F4D] font-mono tracking-[0.3em]
                         focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
            />
          </div>

          {/* PIN Confirm */}
          <div>
            <label
              htmlFor="pinConfirm"
              className="mb-1 block text-xs font-medium text-[#A8977E]"
            >
              Confirm PIN
            </label>
            <input
              id="pinConfirm"
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={pinConfirm}
              onChange={(e) =>
                setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Re-enter 6-digit PIN"
              className="w-full rounded-xl border-2 border-white/10 bg-[#0A1423] px-4 py-3
                         text-sm text-[#F0E6D3] placeholder:text-[#6B5F4D] font-mono tracking-[0.3em]
                         focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl border-2 border-[#3B82F6]/30 bg-[#3B82F6] px-6 py-3
                       text-sm font-bold text-white shadow-lg
                       hover:bg-[#2563EB] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
                       disabled:opacity-50 transition-all duration-150 mt-2"
          >
            {isLoading ? "Creating Account..." : "Create Agent Account"}
          </button>
        </form>
      )}

      {/* ─── Step 2: Success ──────────────────────────────────── */}
      {step === 2 && kidEmail && (
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <div className="text-4xl">&#x1F680;</div>
          <h2 className="text-xl font-bold text-[#3B82F6]">
            Agent Account Created!
          </h2>
          <p className="text-sm text-[#A8977E]">
            Cooper says: &quot;New operative registered. Welcome to the team.&quot;
          </p>

          {/* Player ID / Synthetic Email */}
          <div className="w-full">
            <label className="mb-1 block text-xs font-medium text-[#A8977E]">
              Player ID (save this for other devices)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={kidEmail}
                className="flex-1 rounded-xl border-2 border-white/10 bg-[#0A1423] px-4 py-3
                           text-xs text-[#F0E6D3] font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border-2 border-white/10 bg-[#0A1423] px-3 py-3
                           text-xs text-[#A8977E] hover:border-[#3B82F6]/40 hover:text-[#3B82F6]
                           transition-all"
              >
                Copy
              </button>
            </div>
          </div>

          <p className="text-xs text-[#6B5F4D]">
            On this device, your agent can just enter their PIN to log in.
          </p>

          {/* Go to Login */}
          <button
            type="button"
            onClick={() => router.push("/parent")}
            className="w-full rounded-xl border-2 border-[#3B82F6]/30 bg-[#3B82F6] px-6 py-3
                       text-sm font-bold text-white shadow-lg
                       hover:bg-[#2563EB] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
                       transition-all duration-150 mt-2"
          >
            Go to Parent Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
