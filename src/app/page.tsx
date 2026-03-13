"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { loginWithPin, sendMagicLink } from "@/lib/actions/auth";

// ─── Cooper Holographic Avatar ──────────────────────────────────
function CooperAvatar() {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      {/* Outer pulse ring */}
      <div className="absolute h-32 w-32 rounded-full bg-blue-500/10 animate-pulse" />
      <div className="absolute h-28 w-28 rounded-full border border-blue-500/30" />
      {/* Circular image frame with blue glow */}
      <div
        className="relative h-24 w-24 overflow-hidden rounded-full
                   border-2 border-blue-500/60
                   shadow-[0_0_32px_rgba(59,130,246,0.5)]"
      >
        <Image
          src="/cooper-hologram.png"
          alt="Cooper"
          fill
          className="object-cover"
          priority
        />
      </div>
      {/* Status dot */}
      <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6] ring-2 ring-[#050B14]" />
    </div>
  );
}

// ─── Cooper Greetings ───────────────────────────────────────────
const COOPER_GREETINGS = [
  "Stats are looking good. Ready to secure some Gold today?",
  "Base systems online. Authenticate to proceed.",
  "Analyze your objective. Execute the mission.",
  "All systems nominal. Enter your code, Agent.",
];

function getGreeting() {
  return COOPER_GREETINGS[Math.floor(Math.random() * COOPER_GREETINGS.length)];
}

// ─── PIN Display ────────────────────────────────────────────────
function PinDisplay({
  length,
  filled,
  shake,
}: {
  length: number;
  filled: number;
  shake: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 ${
        shake ? "animate-shake" : ""
      }`}
    >
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-full transition-all duration-200 ${
            i < filled
              ? "bg-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Keypad Button ──────────────────────────────────────────────
function KeyButton({
  label,
  onPress,
  wide,
  disabled,
}: {
  label: string;
  onPress: () => void;
  wide?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`
        flex items-center justify-center rounded-2xl border-2
        border-white/10 bg-[#0A1423] text-xl font-bold
        text-[#F0E6D3] shadow-lg
        hover:border-[#3B82F6]/40 hover:shadow-[0_0_16px_rgba(59,130,246,0.2)]
        disabled:opacity-30 disabled:cursor-not-allowed
        ${wide ? "col-span-1" : ""}
        min-h-[64px] min-w-[64px]
      `}
      whileTap={{
        scale: 0.95,
        boxShadow: "0 0 20px rgba(245, 197, 66, 0.6)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {label}
    </motion.button>
  );
}

// ─── Lockout Countdown ──────────────────────────────────────────
function LockoutDisplay({ remainingSeconds }: { remainingSeconds: number }) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="text-4xl">&#x1F6E1;</div>
      <h2 className="text-xl font-bold text-amber-400">Tactical Lockdown!</h2>
      <p className="text-sm text-amber-300/80">
        Base is secured. Too many failed attempts detected.
      </p>
      <div className="font-mono text-3xl font-bold text-amber-400 tabular-nums">
        {display}
      </div>
      <p className="text-xs text-[#A8977E]">
        Cooper says: &quot;Stand by, Agent. System cooldown in progress.&quot;
      </p>
    </div>
  );
}

// ─── Magic Link Form (Parent Setup) ────────────────────────────
function MagicLinkForm({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    const result = await sendMagicLink(formData);

    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">&#x2709;</div>
        <h2 className="text-lg font-bold text-[#3B82F6]">Check your email!</h2>
        <p className="text-sm text-[#A8977E]">
          A setup link has been sent. Click it to create your agent&apos;s
          account.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-2 text-xs text-[#A8977E] underline hover:text-[#F0E6D3]"
          >
            Back to PIN
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
      {!onBack && (
        <>
          <h2 className="text-lg font-bold text-[#F0E6D3]">
            Parent Setup Required
          </h2>
          <p className="text-xs text-[#A8977E] text-center">
            No agent account found on this device. Enter your email to receive a
            setup link.
          </p>
        </>
      )}
      {onBack && (
        <>
          <h2 className="text-lg font-bold text-[#F0E6D3]">
            Send Setup Link
          </h2>
          <p className="text-xs text-[#A8977E] text-center">
            Need to set up a new agent account? Enter your email below.
          </p>
        </>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="parent@example.com"
        required
        className="w-full rounded-xl border-2 border-white/10 bg-[#0A1423] px-4 py-3
                   text-sm text-[#F0E6D3] placeholder:text-[#6B5F4D]
                   focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30"
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl border-2 border-[#3B82F6]/30 bg-[#3B82F6] px-6 py-3
                   text-sm font-bold text-white shadow-lg
                   hover:bg-[#2563EB] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
                   disabled:opacity-50 transition-all duration-150"
      >
        {isLoading ? "Sending..." : "Send Setup Link"}
      </button>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#A8977E] underline hover:text-[#F0E6D3]"
        >
          Back to PIN
        </button>
      )}
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Page Component — PIN Login
// ═══════════════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // State
  const [pin, setPin] = useState("");
  const [kidEmail, setKidEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockout, setLockout] = useState<{
    unlockAt: string;
    remainingSeconds: number;
  } | null>(null);
  const [showParentForm, setShowParentForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [greeting] = useState(getGreeting);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Load kidEmail and displayName from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("agenty_kid_email");
    if (stored) setKidEmail(stored);
    const name = localStorage.getItem("agenty_display_name");
    if (name) setDisplayName(name);
    setMounted(true);
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockout || lockout.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setLockout((prev) => {
        if (!prev) return null;
        const next = prev.remainingSeconds - 1;
        if (next <= 0) return null;
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockout]);

  // Auto-submit when 6 digits reached
  const submitPin = useCallback(
    async (fullPin: string) => {
      if (!kidEmail || isLoading) return;

      setIsLoading(true);
      setError(null);

      const result = await loginWithPin(kidEmail, fullPin);

      setIsLoading(false);

      if (result.success) {
        startTransition(() => router.push("/play"));
        return;
      }

      // Shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");

      if (result.error === "tactical_lockdown") {
        setLockout({
          unlockAt: result.unlockAt!,
          remainingSeconds: result.remainingSeconds!,
        });
        setError(null);
        setAttemptsRemaining(null);
      } else {
        setError("Wrong code, Agent!");
        setAttemptsRemaining(result.attemptsRemaining ?? null);
      }
    },
    [kidEmail, isLoading, router]
  );

  // Key press handler
  const handleKey = useCallback(
    (key: string) => {
      if (lockout || isLoading) return;

      if (key === "clear") {
        setPin("");
        setError(null);
        return;
      }
      if (key === "back") {
        setPin((prev) => prev.slice(0, -1));
        return;
      }

      setPin((prev) => {
        if (prev.length >= 6) return prev;
        const next = prev + key;
        if (next.length === 6) {
          submitPin(next);
        }
        return next;
      });
    },
    [lockout, isLoading, submitPin]
  );

  // Keyboard support
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        handleKey(e.key);
      } else if (e.key === "Backspace") {
        handleKey("back");
      } else if (e.key === "Escape") {
        handleKey("clear");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // Don't render until mounted (avoid hydration mismatch with localStorage)
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050B14]" />
    );
  }

  // ─── No kidEmail: Show Parent Setup Form ────────────────────
  if (!kidEmail && !showParentForm) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4"
        data-agent="cooper"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-black tracking-tight text-[#F0E6D3]">
            AGENTY
          </h1>
          <p className="text-xs text-[#A8977E]">Quest for Knowledge</p>
        </div>
        <MagicLinkForm />
      </div>
    );
  }

  // ─── Parent Form Toggle (when kidEmail exists but parent clicked link) ─
  if (showParentForm) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4"
        data-agent="cooper"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-black tracking-tight text-[#F0E6D3]">
            AGENTY
          </h1>
          <p className="text-xs text-[#A8977E]">Quest for Knowledge</p>
        </div>
        <MagicLinkForm onBack={() => setShowParentForm(false)} />
      </div>
    );
  }

  // ─── PIN Pad Login ──────────────────────────────────────────
  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["clear", "0", "back"],
  ];

  const isDisabled = !!lockout || isLoading;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] px-4"
      data-agent="cooper"
    >
      {/* Logo */}
      <div className="mb-4 text-center">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-[#F0E6D3]">
          AGENTY
        </h1>
        <p className="text-xs text-[#A8977E]">Quest for Knowledge</p>
      </div>

      {/* Cooper Holographic Avatar */}
      <CooperAvatar />

      {/* Personalized Greeting */}
      <div className="mb-8 text-center">
        {displayName ? (
          <p className="text-base font-bold text-[#F0E6D3]">
            Welcome back, Agent {displayName}
          </p>
        ) : (
          <p className="text-sm font-medium text-[#3B82F6]">{greeting}</p>
        )}
      </div>

      {/* Lockout or PIN Area */}
      {lockout ? (
        <LockoutDisplay remainingSeconds={lockout.remainingSeconds} />
      ) : (
        <>
          {/* PIN Display */}
          <div className="mb-8">
            <PinDisplay length={6} filled={pin.length} shake={shake} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-center">
              <p className="text-sm font-medium text-red-400">{error}</p>
              {attemptsRemaining !== null && (
                <p className="mt-1 text-xs text-[#A8977E]">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""}{" "}
                  remaining
                </p>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <p className="mb-4 text-sm text-[#3B82F6] animate-pulse">
              Verifying...
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
            {keypadRows.map((row) =>
              row.map((key) => {
                let label = key;
                if (key === "clear") label = "C";
                if (key === "back") label = "\u232B";

                return (
                  <KeyButton
                    key={key}
                    label={label}
                    onPress={() => handleKey(key)}
                    disabled={isDisabled}
                  />
                );
              })
            )}
          </div>
        </>
      )}

      {/* Parent link */}
      <button
        type="button"
        onClick={() => setShowParentForm(true)}
        className="mt-8 text-xs text-[#6B5F4D] hover:text-[#A8977E] transition-colors"
      >
        Parent? Send a new setup link
      </button>
    </div>
  );
}
