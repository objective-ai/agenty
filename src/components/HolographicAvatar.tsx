"use client";

import Image from "next/image";
import type { Agent } from "@/contexts/AgentContext";

interface HolographicAvatarProps {
  agent: Agent;
  size?: number;      // px, default 40
  className?: string;
}

export function HolographicAvatar({
  agent,
  size = 40,
  className = "",
}: HolographicAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: agent.color,
        boxShadow: `0 0 ${size / 4}px ${agent.color}66`,
      }}
    >
      {agent.avatar ? (
        <Image
          src={agent.avatar}
          alt={agent.name}
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      ) : (
        <span
          className="font-black uppercase"
          style={{
            fontSize: size * 0.45,
            color: agent.color,
            textShadow: `0 0 8px ${agent.color}88`,
          }}
        >
          {agent.name[0]}
        </span>
      )}
    </div>
  );
}
