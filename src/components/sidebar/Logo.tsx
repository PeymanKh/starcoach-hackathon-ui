import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { labelMotion } from "./motion";

export function LogoMark({ className }: { className?: string }) {
  // Unique gradient id per instance — a shared id breaks when the first
  // copy sits inside a display:none subtree (e.g. the hidden mobile sidebar).
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-7", className)}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF5A73" />
          <stop offset="0.55" stopColor="#F31E3A" />
          <stop offset="1" stopColor="#B80F26" />
        </linearGradient>
      </defs>
      <path
        d="M16 2c1.2 7.6 6.4 12.8 14 14-7.6 1.2-12.8 6.4-14 14-1.2-7.6-6.4-12.8-14-14 7.6-1.2 12.8-6.4 14-14Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

/**
 * Logo tile with the wordmark hanging off its end side. The wordmark is
 * absolutely positioned so the tile's box never changes size — that's what
 * keeps it perfectly still while the sidebar width animates.
 */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="relative size-9 shrink-0">
      <div className="relative grid size-9 place-items-center rounded-xl border border-white/8 bg-ink/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div
          aria-hidden
          className="absolute inset-0 rounded-xl bg-brand/20 blur-md"
        />
        <LogoMark className="relative size-6" />
      </div>

      <motion.div
        {...labelMotion(collapsed)}
        aria-hidden={collapsed}
        className={cn(
          "absolute start-full top-0 ms-3 flex h-9 flex-col justify-center leading-tight whitespace-nowrap",
          collapsed && "pointer-events-none",
        )}
      >
        <div className="text-[15px] font-bold text-bone">استارکوچ</div>
        <div className="text-[10px] text-dust">مربی هوشمند تو</div>
      </motion.div>
    </div>
  );
}
