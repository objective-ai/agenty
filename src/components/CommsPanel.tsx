"use client";

// ═══════════════════════════════════════════════════════════════════
// CommsPanel — Streaming AI chat with the active agent companion
// Adventure Navy design system. Agent-colored glow + persona.
// Uses AI SDK v6: useChat from @ai-sdk/react, DefaultChatTransport.
// ═══════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAgent } from "@/contexts/AgentContext";
import { HolographicAvatar } from "@/components/HolographicAvatar";
import type { UIMessage } from "ai";

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

export function CommsPanel() {
  const { agent, activeAgent } = useAgent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Recreate transport when agent changes so body.agentId stays in sync
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { agentId: activeAgent },
      }),
    [activeAgent]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{text}</p>
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
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl border-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: agent.color,
              backgroundColor: `${agent.color}22`,
              color: agent.color,
              boxShadow: `0 0 12px ${agent.color}33`,
            }}
          >
            SEND
          </button>
        </div>
      </form>
    </div>
  );
}
