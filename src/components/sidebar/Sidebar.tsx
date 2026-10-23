import { motion } from "motion/react";
import { MapPin, PanelRightClose, PanelRightOpen, Plus, X } from "lucide-react";
import { Logo } from "./Logo";
import { InfoButtons } from "./InfoButtons";
import { ChatHistory } from "./ChatHistory";
import {
  LABEL_ENTER,
  LABEL_EXIT,
  SIDEBAR_GUTTER,
  SIDEBAR_MORPH,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
  labelMotion,
} from "./motion";
import { cn } from "@/lib/cn";
import type { Chat } from "@/content/chats";

export { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./motion";

export type SidebarProps = {
  chats: Chat[];
  collapsed: boolean;
  onToggle: () => void;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onOpenCard: (cardId: string) => void;
  /** Open the "where are you?" map */
  onOpenLocation: () => void;
  /** Mobile drawer: never collapses, shows a close button instead of the toggle */
  drawer?: boolean;
  onClose?: () => void;
  className?: string;
};

/**
 * Floating sidebar card. Collapses to an icon rail by animating ONLY its
 * width; every row keeps the same padding so icons never move, and labels
 * just fade. In the rail, the toggle becomes the first item.
 *
 * Layout: header → the three info buttons → "chat history" divider →
 * new chat → chat list.
 */
export function Sidebar({
  chats,
  collapsed,
  onToggle,
  activeChatId,
  onSelectChat,
  onNewChat,
  onOpenCard,
  onOpenLocation,
  drawer = false,
  onClose,
  className,
}: SidebarProps) {
  const isCollapsed = !drawer && collapsed;
  const width =
    (isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH) + SIDEBAR_GUTTER * 2;

  return (
    <motion.aside
      aria-label="نوار کناری"
      initial={false}
      animate={{ width }}
      transition={SIDEBAR_MORPH}
      style={{ padding: SIDEBAR_GUTTER }}
      className={cn("relative h-dvh shrink-0 will-change-[width]", className)}
    >
      {/* ── the card ── */}
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-soot shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        {/* ── header ── */}
        {/* px-4 keeps the 36px tile centered in the 68px rail (16 + 18 = 34) */}
        {/* collapsed: tighter under the logo, so the first icon doesn't float far below it */}
        <div className={cn("relative px-4 pt-3.5 transition-[padding] duration-300", isCollapsed ? "pb-1" : "pb-3")}>
          {/* rail-only row: the toggle is the first item when collapsed */}
          <motion.div
            initial={false}
            animate={{ height: isCollapsed ? 44 : 0, opacity: isCollapsed ? 1 : 0 }}
            transition={SIDEBAR_MORPH}
            aria-hidden={!isCollapsed}
            className={cn(
              "flex items-center justify-center overflow-hidden",
              !isCollapsed && "pointer-events-none",
            )}
          >
            <ToggleButton collapsed onClick={onToggle} tabIndex={isCollapsed ? 0 : -1} />
          </motion.div>

          <div className="flex items-center justify-between gap-2">
            <Logo collapsed={isCollapsed} onClick={onNewChat} />
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={isCollapsed ? LABEL_EXIT : LABEL_ENTER}
              aria-hidden={isCollapsed}
              className={cn("shrink-0", isCollapsed && "pointer-events-none")}
            >
              {drawer ? (
                <IconButton onClick={onClose} label="بستن منو">
                  <X className="size-[18px]" strokeWidth={1.75} />
                </IconButton>
              ) : (
                <ToggleButton collapsed={false} onClick={onToggle} tabIndex={isCollapsed ? -1 : 0} />
              )}
            </motion.div>
          </div>
        </div>

        {/* ── my location + the three hackathon buttons ── */}
        <div className={cn("relative flex flex-col gap-1 px-3", !isCollapsed && "mt-2")}>
          <button
            type="button"
            onClick={onOpenLocation}
            title={isCollapsed ? "لوکیشن (برای تست)" : undefined}
            aria-label={isCollapsed ? "لوکیشن (برای تست)" : undefined}
            className="group flex h-11 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-3 text-start text-[14px] font-medium text-dust transition-colors duration-200 hover:bg-white/5 hover:text-bone"
          >
            <span className="grid size-5 shrink-0 place-items-center">
              <MapPin className="size-[18px] transition-colors duration-200 group-hover:text-brand" />
            </span>
            <motion.span
              {...labelMotion(isCollapsed)}
              aria-hidden={isCollapsed}
              className="min-w-0 flex-1 truncate"
            >
              لوکیشن (برای تست)
            </motion.span>
          </button>
          <InfoButtons collapsed={isCollapsed} onOpen={onOpenCard} />
        </div>

        {/* ── "chat history" divider ── */}
        <LabeledDivider collapsed={isCollapsed} className="my-3">
          تاریخچه گفتگو‌ها
        </LabeledDivider>

        {/* ── new chat: first item of the history section ── */}
        <div className="relative px-3">
          <button
            type="button"
            onClick={onNewChat}
            title={isCollapsed ? "گفتگوی جدید" : undefined}
            aria-label="گفتگوی جدید"
            className="group relative flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-brand px-3 text-[14px] font-semibold text-white transition-transform duration-200 active:scale-[0.98]"
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-white/0 transition-colors duration-200 group-hover:bg-white/15"
            />
            <span className="relative grid size-5 shrink-0 place-items-center">
              <Plus className="size-[18px]" strokeWidth={2.25} />
            </span>
            {/* icon + label stay centered as a pair; the label's width closes
                with the rail so the icon glides to the middle */}
            <motion.span
              initial={false}
              animate={{
                width: isCollapsed ? 0 : "auto",
                marginInlineStart: isCollapsed ? 0 : 8,
                opacity: isCollapsed ? 0 : 1,
              }}
              transition={{
                width: SIDEBAR_MORPH,
                marginInlineStart: SIDEBAR_MORPH,
                opacity: isCollapsed ? LABEL_EXIT : LABEL_ENTER,
              }}
              aria-hidden={isCollapsed}
              className="relative overflow-hidden whitespace-nowrap"
            >
              گفتگوی جدید
            </motion.span>
          </button>
        </div>

        {/* ── chat list ── */}
        <div className="relative mt-3 flex min-h-0 flex-1 flex-col px-3">
          <ChatHistory
            chats={chats}
            collapsed={isCollapsed}
            activeId={activeChatId}
            onSelect={onSelectChat}
            onExpand={onToggle}
          />
        </div>
      </div>
    </motion.aside>
  );
}

function IconButton({
  onClick,
  label,
  tabIndex,
  children,
}: {
  onClick?: () => void;
  label: string;
  tabIndex?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={tabIndex}
      className="grid size-9 cursor-pointer place-items-center rounded-lg text-faint transition-colors duration-200 hover:bg-white/5 hover:text-bone"
    >
      {children}
    </button>
  );
}

function ToggleButton({
  collapsed,
  onClick,
  tabIndex,
}: {
  collapsed: boolean;
  onClick: () => void;
  tabIndex?: number;
}) {
  const Icon = collapsed ? PanelRightOpen : PanelRightClose;
  return (
    <IconButton
      onClick={onClick}
      tabIndex={tabIndex}
      label={collapsed ? "باز کردن نوار کناری" : "بستن نوار کناری"}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </IconButton>
  );
}

/** The soft line, with a label sitting in the middle of it (label hides in the rail) */
function LabeledDivider({
  collapsed,
  className,
  children,
}: {
  collapsed: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative mx-4 h-4", className)}>
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-linear-to-l from-transparent via-white/10 to-transparent"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.h3
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={collapsed ? LABEL_EXIT : LABEL_ENTER}
          aria-hidden={collapsed}
          className="bg-soot px-2.5 text-[11px] font-medium whitespace-nowrap text-faint"
        >
          {children}
        </motion.h3>
      </div>
    </div>
  );
}
