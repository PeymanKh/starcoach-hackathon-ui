import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Share2, ThumbsDown, ThumbsUp, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AssistantMessage, ChatMessage } from "@/hooks/useAgentChat";
import { AgentStatus, type AgentState } from "@/components/chat/AgentStatus";
import { ToolSteps } from "@/components/chat/ToolSteps";
import { AnswerContent } from "@/components/chat/AnswerContent";
import type { StoreCardData, VerifiedPrice } from "@/components/chat/StoreCard";
import { AiCallScreen, CallSheet } from "@/components/chat/StoreCall";

/** With nothing back after this long, say it's taking longer than usual. */
const SLOW_START_MS = 15_000;

/** The answer without its card markers, even half-typed ones: for copying and "is there text?". */
function withoutMarkers(text: string) {
  return text.replace(/\[\[(?:product|store):[^\]]*\]\]/g, "").replace(/\[\[[^\]]*$/, "");
}

/** Placeholder until real usage is tracked: every answer costs one credit. */
const CREDITS_PER_ANSWER = 1;

type MessageListProps = {
  messages: ChatMessage[];
  /** Sends a follow-up, e.g. from a card's "stores near me" button */
  onAsk: (text: string) => void;
  /** This chat's link, for the share button */
  shareUrl?: string | null;
  className?: string;
};

export function MessageList({
  messages,
  onAsk,
  shareUrl = null,
  className,
}: MessageListProps) {
  // Calling a store from its card: the options sheet, then maybe the live AI call.
  const [calling, setCalling] = useState<{
    store: StoreCardData;
    productName: string;
    mode: "sheet" | "ai";
  } | null>(null);
  // Prices confirmed by a call, by store id: the card turns green.
  const [verified, setVerified] = useState<Record<string, VerifiedPrice>>({});
  const confirm = (result: VerifiedPrice) => {
    if (calling) setVerified((all) => ({ ...all, [calling.store.id]: result }));
    setCalling(null);
  };
  const onCall = useCallback(
    (store: StoreCardData, productName: string) => setCalling({ store, productName, mode: "sheet" }),
    [],
  );

  // Scrolling lives in ChatArea, which also pins the prompt box under the messages.
  return (
    <div className={cn("w-full", className)}>
      <div className="flex w-full flex-col gap-6 py-8">
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.text} />
          ) : (
            <AssistantBubble
              key={m.id}
              message={m}
              shareUrl={shareUrl}
              verified={verified}
              onAsk={onAsk}
              onCall={onCall}
            />
          ),
        )}
      </div>

      {calling?.mode === "sheet" && (
        <CallSheet
          store={calling.store}
          productName={calling.productName}
          onClose={() => setCalling(null)}
          onAiCall={() => setCalling({ ...calling, mode: "ai" })}
          onResult={confirm}
        />
      )}
      {calling?.mode === "ai" && (
        <AiCallScreen
          store={calling.store}
          productName={calling.productName}
          onClose={() => setCalling(null)}
          onResult={confirm}
        />
      )}
    </div>
  );
}

/** The user's message, with a copy button under it (on hover on desktop, always on phones). */
function UserBubble({ text }: { text: string }) {
  const [copied, flashCopied] = useFlash();
  const copy = () => {
    navigator.clipboard?.writeText(text).then(flashCopied, () => {});
  };
  return (
    <div className="group flex max-w-[85%] flex-col items-start gap-1 self-start">
      <div className="whitespace-pre-wrap rounded-2xl bg-brand px-4 py-2.5 text-[15px] text-white">
        {text}
      </div>
      <div
        className={cn(
          "text-faint transition-opacity duration-200",
          "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100",
          copied && "sm:opacity-100",
        )}
      >
        <ActionButton label={copied ? "کپی شد" : "کپی"} onClick={copy}>
          {copied ? <Check /> : <Copy />}
        </ActionButton>
      </div>
    </div>
  );
}

function AssistantBubble({
  message,
  shareUrl,
  verified,
  onAsk,
  onCall,
}: {
  message: AssistantMessage;
  shareUrl: string | null;
  verified: Record<string, VerifiedPrice>;
  onAsk: (text: string) => void;
  onCall: (store: StoreCardData, productName: string) => void;
}) {
  // Text said before a tool call ("let me search…") is hidden while the tools work: the steps
  // show it better, and the next text replaces it anyway.
  const narration = message.status === "streaming" && message.replaceText;
  const raw = narration ? "" : message.text.trim(); // with card markers
  const text = withoutMarkers(raw).trim();
  const toolRunning = message.steps.some((s) => s.status === "running");
  // The real answer has started (text or cards), not the "let me search…" before a tool call.
  const answering = !!raw && !narration;
  const slow = useTimePassed((message.startedAt ?? 0) + SLOW_START_MS, message.status === "streaming");
  const state = agentState(message, { text, toolRunning, answering, slow });

  return (
    <div className="flex flex-col gap-4">
      {message.steps.length > 0 && (
        <ToolSteps steps={message.steps} collapsible={answering && !toolRunning} />
      )}

      {state && (
        <AgentStatus
          key={state}
          state={state}
          since={
            // the counter only for real reasoning, not the gap between tools and the answer
            state === "thinking" && message.thinking
              ? message.thinkingSince
              : state === "slow"
                ? message.startedAt
                : undefined
          }
        />
      )}

      {raw && (
        <AnswerContent
          text={raw}
          results={message.steps}
          verified={verified}
          onAsk={onAsk}
          onCall={onCall}
        />
      )}

      {message.status === "done" && raw && (
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

/**
 * What the orb line under a streaming message says, or nothing: a running tool has its own
 * orb in the steps, and once the answer is being written the text speaks for itself.
 */
function agentState(
  message: AssistantMessage,
  { text, toolRunning, answering, slow }: { text: string; toolRunning: boolean; answering: boolean; slow: boolean },
): AgentState | null {
  if (message.status !== "streaming") return null;
  if (message.reconnecting) return "retrying";
  if (toolRunning || answering) return null;
  if (message.thinking) return "thinking";
  // Between tool calls and the answer, the model is working on it.
  if (message.steps.length > 0 || text) return "thinking";
  return slow ? "slow" : "waiting";
}

/** Becomes true once the clock passes `at`, while `active`. */
function useTimePassed(at: number, active: boolean) {
  const [passed, setPassed] = useState(() => Date.now() >= at);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setPassed(true), Math.max(0, at - Date.now()));
    return () => window.clearTimeout(timer);
  }, [at, active]);
  return passed;
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
    <div className="-ms-1 flex items-center gap-0.5 text-faint">
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
        className="ms-1.5 flex h-6 items-center gap-1 rounded-full bg-white/5 px-2.5 text-[11px] font-medium text-dust"
      >
        {CREDITS_PER_ANSWER.toLocaleString("fa-IR")} اعتبار
        <Zap className="size-3 fill-current" />
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
        "grid size-7 cursor-pointer place-items-center rounded-md transition-colors duration-200 hover:bg-white/5 hover:text-bone",
        "[&_svg]:size-[15px] [&_svg]:[stroke-width:1.5]",
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
