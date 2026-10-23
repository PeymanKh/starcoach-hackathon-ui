import { useEffect, useState } from "react";
import { Orb, type OrbLook } from "@/components/ui/thinking-orbs";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { cn } from "@/lib/cn";

/** What the agent is doing between events, each with its own orb and words. */
export const AGENT_STATES = {
  // Sent, nothing back yet (connecting, queued in the worker)
  waiting: { look: { state: "working" }, label: "در حال آماده‌سازی…" },
  // A "thinking" event: the model is reasoning
  thinking: { look: { state: "searching", variant: "lighthouse" }, label: "در حال فکر کردن…" },
  // The stream dropped and we reconnect with Last-Event-ID
  retrying: { look: { state: "retrying", variant: "surge" }, label: "ارتباط قطع شد، دوباره وصل می‌شوم…" },
  // A run that takes much longer than usual
  slow: { look: { state: "working" }, label: "کمی بیشتر طول می‌کشد، هنوز روی آن کار می‌کنم…" },
} satisfies Record<string, { look: OrbLook; label: string }>;

export type AgentState = keyof typeof AGENT_STATES;

/** A light, minimal shine sweeping across the text right to left, the way Persian reads. */
export function ShimmerText({ text, className }: { text: string; className?: string }) {
  return (
    <TextShimmer
      text={text}
      direction="right"
      duration={2.2}
      spread={16}
      baseColor="var(--color-dust)"
      shimmerColor="var(--color-bone)"
      className={className}
    />
  );
}

/** The orb and a shimmering label: what the agent is doing right now. */
export function AgentStatus({
  state,
  label,
  since,
  className,
}: {
  state: AgentState;
  /** Overrides the state's own words */
  label?: string;
  /** When this state started (ms timestamp): shows a live seconds counter */
  since?: number;
  className?: string;
}) {
  const preset = AGENT_STATES[state];
  return (
    <div role="status" className={cn("flex items-center gap-3", className)}>
      <Orb {...preset.look} size={40} className="shrink-0 text-brand" />
      <ShimmerText text={label ?? preset.label} className="text-sm font-medium" />
      {since !== undefined && <Elapsed since={since} />}
    </div>
  );
}

/** Seconds since `since`, ticking. */
export function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  if (seconds < 1) return null;
  return (
    <span className="text-xs tabular-nums text-faint">{seconds.toLocaleString("fa-IR")} ثانیه</span>
  );
}
