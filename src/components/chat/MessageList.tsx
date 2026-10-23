import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Loader2,
  Share2,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { AssistantMessage, ChatMessage, ToolStep } from "@/hooks/useAgentChat";

/** Persian labels for the agent's tools, shown as status chips while it works. */
const TOOL_LABELS: Record<string, string> = {
  explore_category: "بررسی دسته‌بندی",
  search_products: "جستجوی محصولات",
  get_product_details: "مشخصات محصول",
  compare_products: "مقایسه‌ی محصولات",
  find_alternatives: "پیدا کردن جایگزین",
  find_stores: "پیدا کردن فروشگاه‌ها",
  find_stores_by_category: "فروشگاه‌های این دسته",
  get_store_details: "اطلاعات فروشگاه",
  compare_stores: "مقایسه‌ی فروشگاه‌ها",
};

/** Card markers like [[product:id]] become cards later; for now they are hidden, even half-typed. */
function withoutMarkers(text: string) {
  return text.replace(/\[\[(?:product|store):[^\]]*\]\]/g, "").replace(/\[\[[^\]]*$/, "");
}

/** Placeholder until real usage is tracked: every answer costs one credit. */
const CREDITS_PER_ANSWER = 1;

type MessageListProps = {
  messages: ChatMessage[];
  /** This chat's link, for the share button */
  shareUrl?: string | null;
  className?: string;
};

export function MessageList({
  messages,
  shareUrl = null,
  className,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the answer as it streams in
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className={cn("min-h-0 w-full overflow-y-auto", className)}>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 py-8">
        {messages.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              className="max-w-[85%] self-start whitespace-pre-wrap rounded-2xl bg-brand px-4 py-2.5 text-[15px] text-white"
            >
              {m.text}
            </div>
          ) : (
            <AssistantBubble key={m.id} message={m} shareUrl={shareUrl} />
          ),
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function AssistantBubble({
  message,
  shareUrl,
}: {
  message: AssistantMessage;
  shareUrl: string | null;
}) {
  const text = withoutMarkers(message.text).trim();
  const waiting =
    message.status === "streaming" && !text && !message.thinking && message.steps.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {(message.steps.length > 0 || message.thinking) && (
        <div className="flex flex-wrap gap-2">
          {message.steps.map((step) => (
            <StepChip key={step.id} step={step} />
          ))}
          {message.thinking && (
            <span className="flex h-7 items-center gap-1.5 rounded-full glass px-3 text-xs text-dust">
              <Loader2 className="size-3.5 animate-spin text-brand" />
              در حال فکر کردن…
            </span>
          )}
        </div>
      )}

      {waiting && <span className="text-dust animate-pulse">…</span>}

      {text && <p className="whitespace-pre-wrap text-[15px] leading-[1.9] text-bone">{text}</p>}

      {message.status === "done" && text && (
        <MessageActions text={text} shareUrl={shareUrl} />
      )}

      {message.status === "error" && (
        <p role="alert" className="text-sm text-brand">
          {message.error ?? "مشکلی پیش آمد. لطفاً دوباره تلاش کنید."}
        </p>
      )}
    </div>
  );
}

function StepChip({ step }: { step: ToolStep }) {
  const label = TOOL_LABELS[step.tool] ?? step.tool;
  return (
    <span className="flex h-7 items-center gap-1.5 rounded-full glass px-3 text-xs text-dust">
      {step.status === "running" && <Loader2 className="size-3.5 animate-spin text-brand" />}
      {step.status === "done" && <Check className="size-3.5 text-bone" />}
      {step.status === "failed" && <X className="size-3.5 text-brand" />}
      {label}
    </span>
  );
}

/** Under a finished answer, right to left: copy, like, dislike, share, credits. */
function MessageActions({ text, shareUrl }: { text: string; shareUrl: string | null }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, flashCopied] = useFlash();
  const [shared, flashShared] = useFlash();

  const copy = () => {
    navigator.clipboard?.writeText(text).then(flashCopied, () => {});
  };
  const share = () => {
    if (!shareUrl) return;
    if (navigator.share) {
      navigator.share({ url: shareUrl }).catch(() => {}); // the phone's share sheet
    } else {
      navigator.clipboard?.writeText(shareUrl).then(flashShared, () => {});
    }
  };

  return (
    <div className="-ms-1.5 flex items-center gap-0.5 text-faint">
      <ActionButton label={copied ? "کپی شد" : "کپی"} onClick={copy}>
        {copied ? <Check /> : <Copy />}
      </ActionButton>
      <ActionButton
        label="پسندیدم"
        pressed={vote === "up"}
        onClick={() => setVote((v) => (v === "up" ? null : "up"))}
      >
        <ThumbsUp className={cn(vote === "up" && "fill-current")} />
      </ActionButton>
      <ActionButton
        label="نپسندیدم"
        pressed={vote === "down"}
        onClick={() => setVote((v) => (v === "down" ? null : "down"))}
      >
        <ThumbsDown className={cn(vote === "down" && "fill-current")} />
      </ActionButton>
      {shareUrl && (
        <ActionButton label={shared ? "لینک کپی شد" : "اشتراک‌گذاری"} onClick={share}>
          {shared ? <Check /> : <Share2 />}
        </ActionButton>
      )}
      <span
        title="اعتبار مصرف‌شده برای این پاسخ"
        className="ms-1.5 flex h-8 items-center gap-1.5 rounded-full bg-white/5 px-3 text-xs font-semibold text-dust"
      >
        {CREDITS_PER_ANSWER.toLocaleString("fa-IR")} اعتبار
        <Zap className="size-3.5 fill-current" />
      </span>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-lg transition-colors duration-200 hover:bg-white/5 hover:text-bone",
        "[&_svg]:size-[17px] [&_svg]:[stroke-width:1.75]",
        pressed && "text-bone",
      )}
    >
      {children}
    </button>
  );
}

/** A flag that turns itself off after a moment, for "copied!" feedback. */
function useFlash(ms = 1500): [boolean, () => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const timer = window.setTimeout(() => setOn(false), ms);
    return () => window.clearTimeout(timer);
  }, [on, ms]);
  const flash = useCallback(() => setOn(true), []);
  return [on, flash];
}
