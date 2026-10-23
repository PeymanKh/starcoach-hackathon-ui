import { motion } from "motion/react";
import { hackathonCards } from "@/content/hackathon";
import { cn } from "@/lib/cn";
import { labelMotion } from "./motion";

type InfoButtonsProps = {
  collapsed: boolean;
  onOpen: (cardId: string) => void;
};

/** The three "explain our hackathon design" buttons. Content lives in content/hackathon.tsx */
export function InfoButtons({ collapsed, onOpen }: InfoButtonsProps) {
  return (
    <nav aria-label="درباره پروژه" className="flex flex-col gap-1">
      {hackathonCards.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onOpen(id)}
          title={collapsed ? label : undefined}
          aria-label={collapsed ? label : undefined}
          className={cn(
            "group flex h-11 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-3 text-start text-[14px] font-medium text-dust transition-colors duration-200",
            "hover:bg-white/5 hover:text-bone",
          )}
        >
          <span className="grid size-5 shrink-0 place-items-center">
            <Icon className="size-[18px] transition-colors duration-200 group-hover:text-brand" />
          </span>
          <motion.span
            {...labelMotion(collapsed)}
            aria-hidden={collapsed}
            className="min-w-0 flex-1 truncate"
          >
            {label}
          </motion.span>
        </button>
      ))}
    </nav>
  );
}
