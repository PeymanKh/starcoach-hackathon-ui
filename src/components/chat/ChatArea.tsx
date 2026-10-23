import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Loader2 } from "lucide-react";
import { PromptInput, type PromptSubmitMeta } from "@/components/ui/ai-chat-input";
import { MessageList } from "@/components/chat/MessageList";
import type { ChatMessage } from "@/hooks/useAgentChat";
import { efforts, models } from "@/content/models";
import { placeholders } from "@/content/placeholders";
import { cn } from "@/lib/cn";

type ChatAreaProps = {
  messages: ChatMessage[];
  busy: boolean;
  /** An existing chat's history is being fetched */
  loading?: boolean;
  /** `meta` carries the chosen model + effort. */
  onSubmit: (text: string, meta: PromptSubmitMeta) => void;
  /** This chat's link, for the share button */
  shareUrl?: string | null;
};

/** The thinking level selected at first: "medium" */
const DEFAULT_EFFORT = 1;

/** Closer than this to the bottom counts as "at the bottom": keep following the answer. */
const FOLLOW_THRESHOLD_PX = 120;
/** Farther than this from the bottom: offer the "jump to the end" button. */
const JUMP_BUTTON_PX = 300;

/**
 * Empty: title + prompt box, centered. With messages: one scroll area holding the messages
 * and, pinned to its bottom, the prompt box. Both share one column, so their widths match;
 * the box has a solid background, so nothing is ever visible below it.
 * The prompt box keeps the same place in the tree, so the chosen model survives the switch.
 */
export function ChatArea({
  messages,
  busy,
  loading = false,
  onSubmit,
  shareUrl = null,
}: ChatAreaProps) {
  const empty = messages.length === 0 && !loading;
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const following = useRef(true); // is the user at the bottom, following the answer?
  const [farFromEnd, setFarFromEnd] = useState(false);
  // The model and effort of the last message, so card buttons ask with the same ones.
  const lastMeta = useRef<PromptSubmitMeta | null>(null);
  const submit = (text: string, meta: PromptSubmitMeta) => {
    lastMeta.current = meta;
    following.current = true;
    onSubmit(text, meta);
  };
  const ask = (text: string) => {
    // A chat reopened from history has no last message yet: use the defaults.
    if (!busy) submit(text, lastMeta.current ?? { model: models[0], effort: efforts[DEFAULT_EFFORT] });
  };

  const distanceFromEnd = () => {
    const el = scrollRef.current;
    return el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0;
  };

  // Follow the answer as it streams in, unless the user scrolled up to read
  useEffect(() => {
    const el = scrollRef.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
    setFarFromEnd(distanceFromEnd() > JUMP_BUTTON_PX); // the answer may grow below the user
  }, [messages]);

  // Content also grows on its own (product photos loading, cards animating in): keep following.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      const el = scrollRef.current;
      if (el && following.current) el.scrollTop = el.scrollHeight;
      setFarFromEnd(distanceFromEnd() > JUMP_BUTTON_PX);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  // A newly opened chat starts at its latest message
  useEffect(() => {
    following.current = true;
  }, [loading]);

  const onScroll = () => {
    const distance = distanceFromEnd();
    following.current = distance < FOLLOW_THRESHOLD_PX;
    setFarFromEnd(distance > JUMP_BUTTON_PX);
  };

  const jumpToEnd = () => {
    following.current = true;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        // stable gutters: the scrollbar never shifts the centered column
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable_both-edges]"
      >
        <div
          ref={contentRef}
          className={cn(
            "mx-auto flex min-h-full w-full flex-col px-4 sm:px-6",
            empty ? "max-w-[648px] justify-center pb-16" : "max-w-[768px]",
          )}
        >
          {empty ? (
            <h1 className="mb-7 text-center text-[28px] font-extrabold leading-tight text-bone sm:text-4xl">
              چطور می‌تونم کمکت کنم؟{" "}
              <span dir="ltr" className="brand-text">
                :)
              </span>
            </h1>
          ) : loading ? (
            <div className="grid flex-1 place-items-center" role="status" aria-label="در حال بارگذاری گفتگو">
              <Loader2 className="size-6 animate-spin text-dust" />
            </div>
          ) : (
            <MessageList messages={messages} onAsk={ask} shareUrl={shareUrl} className="flex-1" />
          )}

          {/* Pinned under the messages. Solid background: nothing shows through below the box. */}
          <div className={cn(!empty && "sticky bottom-0 bg-ink pb-3")}>
            {!empty && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-ink to-transparent"
              />
            )}
            {/* Scrolled up in a long chat: one tap back to the latest message */}
            <AnimatePresence>
              {!empty && !loading && farFromEnd && (
                <motion.button
                  type="button"
                  onClick={jumpToEnd}
                  aria-label="رفتن به آخر گفتگو"
                  title="رفتن به آخر گفتگو"
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -top-14 left-1/2 z-10 grid -translate-x-1/2 size-10 cursor-pointer place-items-center rounded-full border border-white/10 bg-ash text-bone shadow-lg shadow-black/40 transition-colors hover:bg-smoke"
                >
                  <ArrowDown className="size-[18px]" />
                  {/* the answer is still coming in below */}
                  {busy && (
                    <span className="absolute -top-0.5 -end-0.5 size-2.5 rounded-full bg-brand ring-2 ring-ink" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
            <PromptInput
              models={models}
              efforts={efforts}
              defaultEffortIndex={DEFAULT_EFFORT}
              placeholders={empty ? placeholders : undefined}
              placeholder="هرچی میخوای بپرس..."
              compact={!empty}
              disabled={busy}
              onSubmit={submit}
            />
            {!empty && (
              <p className="mt-2 text-center text-xs text-faint">
                هوش مصنوعی ممکن است اشتباه کند؛ اطلاعات مهم را بررسی کنید.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
