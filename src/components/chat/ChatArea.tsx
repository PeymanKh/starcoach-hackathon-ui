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

/**
 * Empty: title + prompt box, centered. With messages: the conversation, prompt box at the bottom.
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

  return (
    <main
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col items-center px-4 sm:px-6",
        empty ? "justify-center pb-16" : "pb-4",
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
        <MessageList
          messages={messages}
          shareUrl={shareUrl}
          className="flex-1"
        />
      )}

      <PromptInput
        className={empty ? "max-w-[600px]" : "max-w-[720px]"}
        models={models}
        efforts={efforts}
        defaultEffortIndex={0}
        placeholders={empty ? placeholders : undefined}
        placeholder="هرچی میخوای بپرس..."
        compact={!empty}
        disabled={busy}
        onSubmit={onSubmit}
      />
    </main>
  );
}
