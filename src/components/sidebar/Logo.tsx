import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { labelMotion } from "./motion";

/**
 * Torob's logo with the hackathon's name hanging off its end side. The name is absolutely
 * positioned so the logo's box never changes size — that's what keeps it perfectly still
 * while the sidebar width animates. Clicking it goes to the home page.
 */
export function Logo({ collapsed = false, onClick }: { collapsed?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="صفحه‌ی اصلی"
      title="صفحه‌ی اصلی"
      className="relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl"
    >
      <img src="/brand/torob.png" alt="" className="size-7 object-contain" />

      <motion.span
        {...labelMotion(collapsed)}
        aria-hidden
        className={cn(
          "absolute start-full top-0 ms-3 flex h-9 flex-col justify-center text-start leading-tight whitespace-nowrap",
          collapsed && "pointer-events-none",
        )}
      >
        <span className="text-[15px] font-bold text-bone">چالش ترب</span>
        <span className="text-[10px] text-dust">هکاتون استارکوچ</span>
      </motion.span>
    </button>
  );
}
