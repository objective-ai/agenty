"use client";

// ═══════════════════════════════════════════════════════════════════
// CommsPanel — Streaming AI chat with the active agent companion
// Adventure Navy design system. Agent-colored glow + persona.
// Uses AI SDK v6: useChat from @ai-sdk/react, DefaultChatTransport.
// ═══════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAgent } from "@/contexts/AgentContext";
import { HolographicAvatar } from "@/components/HolographicAvatar";
import type { UIMessage } from "ai";
import type { Dispatch } from "react";
import type { MissionConfig } from "@/lib/missions/registry";
import type { MissionAction } from "@/lib/missions/missionReducer";
import { MiniCalculator } from "@/components/MiniCalculator";
import { spendEnergy } from "@/lib/actions/economy";

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

type CommsPanelProps = {
  missionConfig?: MissionConfig;
  dispatchMission?: Dispatch<MissionAction>;
  isDamaged?: boolean;
  shields?: number;
};

export function CommsPanel({ missionConfig, dispatchMission, isDamaged, shields }: CommsPanelProps = {}) {
  const { agent, activeAgent } = useAgent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Recreate transport when agent changes so body.agentId stays in sync
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { agentId: activeAgent, missionId: missionConfig?.id ?? null },
      }),
    [activeAgent, missionConfig?.id]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-trigger mission briefing on mount when in mission mode
  const missionTriggered = useRef(false);
  useEffect(() => {
    if (!missionConfig || missionTriggered.current) return;
    missionTriggered.current = true;
    sendMessage({ text: "begin" });
  }, [missionConfig, sendMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track dispatched tool call IDs to prevent duplicate dispatches on re-renders
  const dispatchedToolCallIds = useRef<Set<string>>(new Set());

  // Intercept Cooper's updateStat tool calls from AI SDK v6 message parts
  useEffect(() => {
    if (!dispatchMission) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    for (const part of lastMsg.parts) {
      if (part.type !== "tool-updateStat") continue;

      // Static tool (has execute) — dispatch on output-available
      const p = part as unknown as { toolCallId: string; input: unknown; state: string };
      if (p.state !== "output-available") continue;

      const dedupKey = p.toolCallId || `updateStat-${JSON.stringify(p.input)}`;
      if (dispatchedToolCallIds.current.has(dedupKey)) continue;
      dispatchedToolCallIds.current.add(dedupKey);

      dispatchMission({
        type: "STAT_UPDATE",
        payload: p.input as { id: string; value: number; objective?: string },
      });
    }
  }, [messages, dispatchMission]);

  // Intercept reportWrongAnswer tool calls — drain shields + spend energy
  useEffect(() => {
    if (!dispatchMission) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    for (const part of lastMsg.parts) {
      if (part.type !== "tool-reportWrongAnswer") continue;

      const p = part as unknown as { toolCallId: string; input: unknown; state: string };
      if (p.state !== "output-available") continue;

      const dedupKey = p.toolCallId || `reportWrongAnswer-${JSON.stringify(p.input)}`;
      if (dispatchedToolCallIds.current.has(dedupKey)) continue;
      dispatchedToolCallIds.current.add(dedupKey);

      dispatchMission({ type: "SHIELD_HIT" });
      // Fire-and-forget: spend energy for shield damage (Loot Guard: server validates)
      spendEnergy(10, "shield_damage").catch(() => {
        // Energy spend failure is non-blocking — shields still drain visually
      });
    }
  }, [messages, dispatchMission]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: trimmed }] });
    setInputValue("");
  }

  return (
    <div
      className="flex h-full flex-col rounded-2xl border-2 bg-[#0A1423]"
      style={{
        borderColor: `${agent.color}66`,
        boxShadow: `0 0 24px ${agent.color}22, inset 0 0 40px #00000044`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b-2 px-4 py-3"
        style={{ borderColor: `${agent.color}33` }}
      >
        <HolographicAvatar agent={agent} size={32} />
        <div>
          <p
            className="font-mono text-xs font-black uppercase tracking-widest"
            style={{ color: agent.color, textShadow: `0 0 8px ${agent.color}88` }}
          >
            COMMS: {agent.name}
          </p>
          <p className="text-[10px] text-[#A8977E]">
            {agent.title} · {agent.domain}
          </p>
        </div>
        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <span className="font-mono text-[10px] text-[#A8977E]">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${agent.color}44 transparent` }}
      >
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p
              className="font-mono text-sm"
              style={{ color: `${agent.color}88` }}
            >
              &gt; Comms channel open. Say something, Commander.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isAgent = message.role === "assistant";
          const text = getTextContent(message);
          if (!text && !isAgent) return null;
          // Hide the auto-trigger "begin" message from mission mode
          if (!isAgent && text === "begin" && missionConfig) return null;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
            >
              {/* Avatar */}
              {isAgent ? (
                <HolographicAvatar agent={agent} size={32} className="mt-0.5 shrink-0" />
              ) : (
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: "#F8F9FA33", backgroundColor: "#0A1423" }}
                >
                  <span className="text-[9px] font-black text-[#F8F9FA]">YOU</span>
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  isAgent ? "rounded-tl-none" : "rounded-tr-none"
                }`}
                style={
                  isAgent
                    ? {
                        backgroundColor: `${agent.color}18`,
                        border: `1px solid ${agent.color}44`,
                        color: "#F0E6D3",
                      }
                    : {
                        backgroundColor: "#1A2640",
                        border: "1px solid #ffffff22",
                        color: "#F8F9FA",
                      }
                }
              >
                {isAgent && (
                  <p
                    className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: isDamaged ? "#EF4444" : agent.color }}
                  >
                    {isDamaged ? "[SIGNAL DEGRADED] " : ""}{agent.name}
                  </p>
                )}
                <p
                  className="whitespace-pre-wrap"
                  style={isAgent && isDamaged ? { fontStyle: "italic" } : undefined}
                >
                  {text}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <HolographicAvatar agent={agent} size={32} className="shrink-0" />
            <div
              className="flex items-center gap-1.5 rounded-xl rounded-tl-none px-3 py-2"
              style={{
                backgroundColor: `${agent.color}18`,
                border: `1px solid ${agent.color}44`,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full"
                  style={{
                    backgroundColor: agent.color,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t-2 p-3"
        style={{ borderColor: `${agent.color}33` }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${agent.name}...`}
            disabled={isLoading}
            className="flex-1 rounded-xl border-2 bg-[#050B14] px-3 py-2 font-mono text-sm text-[#F0E6D3] placeholder-[#A8977E] outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              borderColor: `${agent.color}44`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = agent.color;
              e.currentTarget.style.boxShadow = `0 0 12px ${agent.color}44`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `${agent.color}44`;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {missionConfig && (
            <MiniCalculator
              accentColor={agent.color}
              onSend={(text) => {
                if (isLoading) return;
                sendMessage({ role: "user", parts: [{ type: "text", text }] });
              }}
            />
          )}
          <motion.button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="min-h-[44px] rounded-xl border-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: agent.color,
              backgroundColor: `${agent.color}22`,
              color: agent.color,
              boxShadow: `0 0 12px ${agent.color}33`,
            }}
            whileTap={{
              scale: 0.95,
              boxShadow: `0 0 20px rgba(var(--agent-accent-rgb), 0.6)`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            SEND
          </motion.button>
        </div>
      </form>
    </div>
  );
}
