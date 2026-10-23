import { useCallback, useEffect, useId, useRef } from "react";
import { motion } from "motion/react";
import type { Chat } from "@/content/chats";
import { cn } from "@/lib/cn";
import { maskIcon } from "@/components/ui/mask-icon";
import historyIcon from "@/assets/icons/history.png";
import emptyChatsIcon from "@/assets/icons/empty-chats.png";
import { LABEL_ENTER, LABEL_EXIT } from "./motion";

const HistoryIcon = maskIcon(historyIcon);
const EmptyChatsIcon = maskIcon(emptyChatsIcon);

type ChatHistoryProps = {
  chats: Chat[];
  collapsed: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onExpand: () => void;
};

/**
 * Flat chat list. No scrollbar — instead, soft fades at the top/bottom edge
 * appear only when there is more to scroll in that direction.
 */
export function ChatHistory({
  chats,
  collapsed,
  activeId,
  onSelect,
  onExpand,
}: ChatHistoryProps) {
  // Per-instance layoutId so the desktop sidebar and the mobile drawer
  // (both mounted at once) never share one shared-layout animation.
  const activeBarId = `chat-active-bar-${useId()}`;

  const listRef = useRef<HTMLDivElement>(null);
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);

  const updateFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const remaining = scrollHeight - clientHeight - scrollTop;
    if (topFadeRef.current) {
      topFadeRef.current.style.opacity = Math.min(scrollTop / 24, 1).toString();
    }
    if (bottomFadeRef.current) {
      bottomFadeRef.current.style.opacity = Math.min(Math.max(remaining, 0) / 24, 1).toString();
    }
  }, []);

  // Keep the fades right on mount and whenever the list's size changes
  useEffect(() => {
    updateFades();
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateFades]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* list + its edge fades — fade out together while the rail closes */}
      <motion.div
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1 }}
        transition={collapsed ? LABEL_EXIT : LABEL_ENTER}
        aria-hidden={collapsed}
        inert={collapsed}
        className={cn(
          "relative flex min-h-0 flex-1 flex-col",
          collapsed && "pointer-events-none",
        )}
      >
        {chats.length === 0 && (
          /* empty state: no chats yet */
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-4 pb-12 text-center">
            <EmptyChatsIcon className="size-8 text-faint/70" />
            <p className="text-[12.5px] text-faint">هیچ گفتگویی پیدا نشد.</p>
          </div>
        )}
        <div
          ref={listRef}
          onScroll={updateFades}
          className={cn(
            "no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-3",
            chats.length === 0 && "hidden",
          )}
        >
          <ul className="flex flex-col gap-0.5">
            {chats.map((chat) => {
              const active = chat.id === activeId;
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 w-full cursor-pointer items-center overflow-hidden rounded-lg px-3 text-start text-[13.5px] transition-colors duration-200",
                      active
                        ? "bg-white/6 text-bone"
                        : "text-dust hover:bg-white/4 hover:text-bone",
                    )}
                  >
                    {/* brand accent on the start edge of the active chat */}
                    {active && (
                      <motion.span
                        layoutId={activeBarId}
                        aria-hidden
                        className="absolute inset-y-2 start-0 w-0.5 rounded-full brand-gradient"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="truncate">{chat.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          ref={topFadeRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-soot to-transparent"
          style={{ opacity: 0 }}
        />
        <div
          ref={bottomFadeRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-soot to-transparent"
          style={{ opacity: 0 }}
        />
      </motion.div>

      {/* rail: one history icon, aligned with the other rail icons; re-expands */}
      <motion.button
        type="button"
        initial={false}
        animate={{ opacity: collapsed ? 1 : 0 }}
        transition={collapsed ? LABEL_ENTER : LABEL_EXIT}
        tabIndex={collapsed ? 0 : -1}
        aria-hidden={!collapsed}
        onClick={onExpand}
        title="تاریخچه گفتگوها"
        aria-label="باز کردن تاریخچه گفتگوها"
        className={cn(
          "absolute inset-x-0 top-0 flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-dust transition-colors duration-200 hover:bg-white/5 hover:text-bone",
          !collapsed && "pointer-events-none",
        )}
      >
        <span className="grid size-5 shrink-0 place-items-center">
          <HistoryIcon className="size-[18px]" />
        </span>
      </motion.button>
    </div>
  );
}
