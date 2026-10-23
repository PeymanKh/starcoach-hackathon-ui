import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
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

/** Closer than this to the bottom counts as "at the bottom": keep following the answer. */
const FOLLOW_THRESHOLD_PX = 120;

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
  const following = useRef(true); // is the user at the bottom, following the answer?

  // Follow the answer as it streams in, unless the user scrolled up to read
  useEffect(() => {
    const el = scrollRef.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // A newly opened chat starts at its latest message
  useEffect(() => {
    following.current = true;
  }, [loading]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    following.current = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_THRESHOLD_PX;
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
            <MessageList messages={messages} shareUrl={shareUrl} className="flex-1" />
          )}

          {/* Pinned under the messages. Solid background: nothing shows through below the box. */}
          <div className={cn(!empty && "sticky bottom-0 bg-ink pb-3")}>
            {!empty && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-ink to-transparent"
              />
            )}
            <PromptInput
              models={models}
              efforts={efforts}
              defaultEffortIndex={0}
              placeholders={empty ? placeholders : undefined}
              placeholder="هرچی میخوای بپرس..."
              compact={!empty}
              disabled={busy}
              onSubmit={onSubmit}
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
