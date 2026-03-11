"use client";

interface CommsRippleProps {
  color: string;       // agent.color hex
  active?: boolean;    // true = "speaking" (fast dance), false = idle (low pulse)
  className?: string;
}

export function CommsRipple({
  color,
  active = true,
  className = "",
}: CommsRippleProps) {
  return (
    <div
      className={`flex items-center gap-0.5 ${active ? "" : "comms-ripple-idle"} ${className}`}
      style={{ height: 20 }}
    >
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="comms-ripple-bar inline-block w-[3px] rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
