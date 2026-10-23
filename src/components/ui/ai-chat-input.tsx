import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RotatingPlaceholder } from "./rotating-placeholder";
import { MicVisualizer } from "./mic-visualizer";
import { useSpeechToText, type SpeechErrorCode } from "@/hooks/useSpeechToText";

/**
 * PromptInput — adapted from the 21st.dev "ai-chat-input" component.
 * Always expanded (no collapsed pill), RTL-native, on the brand palette.
 * Kept: auto-growing textarea with scroll fades, model picker with the
 * sliding hover highlight, reasoning-effort cycle button, morphing labels.
 * Dropped: collapse animation, voice input, image attachments, gallery.
 */

// ----------------------------------------------------------------------
// Physics
// ----------------------------------------------------------------------
const SPRING = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
const TEXTAREA_MIN = 72;
const TEXTAREA_MAX = 168;
const MENU_ROW = 34; // 32px row + 2px gap

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
export type ModelOption = {
  id: string;
  label: string;
  /** Optional logo; falls back to a spark icon */
  iconUrl?: string;
  /** Invert a black logo for dark surfaces */
  invert?: boolean;
  /** Clip the logo to a circle (for square/opaque images) */
  rounded?: boolean;
};

export type EffortOption = {
  id: string;
  label: string;
};

export type PromptSubmitMeta = {
  model: ModelOption;
  effort: EffortOption;
};

export interface PromptInputProps {
  onSubmit?: (value: string, meta: PromptSubmitMeta) => void;
  /** Static placeholder (used when `placeholders` is not given) */
  placeholder?: string;
  /** Example questions that type themselves in rotation while the box is empty */
  placeholders?: string[];
  className?: string;
  models: ModelOption[];
  efforts: EffortOption[];
  defaultModelId?: string;
  defaultEffortIndex?: number;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Show a mic in the send button while empty (live speech-to-text) */
  voice?: boolean;
  /** BCP-47 tag for recognition; Persian = "fa-IR" */
  speechLang?: string;
  /** Mid-conversation layout: no model picker, the thinking button sits beside the send button */
  compact?: boolean;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toPersianDigits = (s: string) => s.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

/** 0 → "۰:۰۰", 83 → "۱:۲۳" */
function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return toPersianDigits(`${m}:${String(s).padStart(2, "0")}`);
}

const VOICE_ERRORS: Record<SpeechErrorCode, string | null> = {
  unsupported: "این مرورگر از ضبط صدا پشتیبانی نمی‌کند.",
  "not-allowed": "دسترسی به میکروفون داده نشد. از تنظیمات مرورگر اجازه بده.",
  network: "تبدیل صدا به متن انجام نشد؛ دوباره تلاش کن.",
  "audio-capture": "میکروفونی پیدا نشد.",
  unknown: "ضبط صدا شروع نشد؛ دوباره تلاش کن.",
  "no-speech": null,
  aborted: null,
};

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------
function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | "auto">("auto");
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) setWidth(spanRef.current.offsetWidth);
  }, [text]);

  return (
    <span
      dir="auto"
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-1">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
      >
        {text}
      </span>
    </span>
  );
}

function ModelIcon({
  model,
  className,
}: {
  model: ModelOption;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [model.iconUrl]);

  if (!model.iconUrl || failed) {
    return (
      <Sparkles
        aria-hidden
        strokeWidth={2}
        className={cn("text-brand", className)}
      />
    );
  }
  return (
    <img
      src={model.iconUrl}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      className={cn(
        "object-contain",
        model.invert && "invert",
        model.rounded && "rounded-full object-cover",
        className,
      )}
    />
  );
}

function ArrowUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M2.75 6.5V7a4.25 4.25 0 0 0 8.5 0v-.5M7 11.25V13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.75" fill="currentColor" />
    </svg>
  );
}

/** One of the stacked icons in the action button; morphs in/out like the original */
function ActionIcon({
  show,
  exitRotate,
  children,
}: {
  show: boolean;
  exitRotate: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
        show
          ? "rotate-0 scale-100 opacity-100 blur-none"
          : cn("pointer-events-none scale-50 opacity-0 blur-[1px]", exitRotate),
      )}
    >
      {children}
    </span>
  );
}

/** Three bars; `ratio` is 0..1 across the effort scale */
function EffortBarsIcon({ ratio }: { ratio: number }) {
  const lit = (threshold: number) => (ratio >= threshold - 0.001 ? 1 : 0.3);
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="8" width="2.5" height="4.5" rx="1" fill="currentColor" className="transition-opacity duration-300" opacity={1} />
      <rect x="5.75" y="5" width="2.5" height="7.5" rx="1" fill="currentColor" className="transition-opacity duration-300" opacity={lit(0.5)} />
      <rect x="10" y="2" width="2.5" height="10.5" rx="1" fill="currentColor" className="transition-opacity duration-300" opacity={lit(1)} />
    </svg>
  );
}

// ----------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------
export const PromptInput = forwardRef<HTMLDivElement, PromptInputProps>(
  function PromptInput(
    {
      onSubmit,
      placeholder = "هر چیزی بپرس…",
      placeholders,
      className,
      models,
      efforts,
      defaultModelId,
      defaultEffortIndex = 1,
      defaultValue = "",
      value: controlledValue,
      onChange,
      disabled = false,
      autoFocus = false,
      voice = true,
      speechLang = "fa-IR",
      compact = false,
    },
    ref,
  ) {
    const [localValue, setLocalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;
    const hasValue = value.trim() !== "";

    const [modelId, setModelId] = useState(defaultModelId ?? models[0]?.id ?? "");
    const selectedModel = models.find((m) => m.id === modelId) ?? models[0];

    const [effortIndex, setEffortIndex] = useState(() =>
      Math.min(Math.max(defaultEffortIndex, 0), Math.max(efforts.length - 1, 0)),
    );
    const effort = efforts[effortIndex];
    const effortRatio = efforts.length > 1 ? effortIndex / (efforts.length - 1) : 1;

    const [menuOpen, setMenuOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const rotating = !!placeholders && placeholders.length > 0;
    const empty = value.length === 0;
    const [hoverStyle, setHoverStyle] = useState<CSSProperties>({
      opacity: 0,
      transform: "translateY(0px) scale(0.95)",
      transition: "none",
    });
    const [isScrolling, setIsScrolling] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const topFadeRef = useRef<HTMLDivElement>(null);
    const bottomFadeRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    const setRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const updateFades = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (topFadeRef.current) {
        topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
      }
      if (bottomFadeRef.current) {
        const remaining = scrollHeight - clientHeight - scrollTop;
        bottomFadeRef.current.style.opacity = Math.min(Math.max(remaining - 16, 0) / 10, 1).toString();
      }
    }, []);

    const setValue = useCallback(
      (next: string) => {
        if (!isControlled) setLocalValue(next);
        onChange?.(next);
      },
      [isControlled, onChange],
    );

    // ── Voice input (live speech-to-text) ──
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const voiceBaseRef = useRef(""); // text that was in the box before recording
    const {
      listening,
      transcribing,
      start: startRecognition,
      stop: stopVoice,
      cancel: cancelVoice,
    } = useSpeechToText({
      lang: speechLang,
      onUpdate: (committed, interim) => {
        const base = voiceBaseRef.current;
        const live = [committed, interim].filter(Boolean).join(" ");
        setValue([base, live].filter(Boolean).join(" "));
      },
      onError: (code) => setVoiceError(VOICE_ERRORS[code]),
    });
    const startVoice = () => {
      voiceBaseRef.current = value.trim();
      setVoiceError(null);
      setMenuOpen(false);
      startRecognition();
    };
    useEffect(() => {
      if (!voiceError) return;
      const t = window.setTimeout(() => setVoiceError(null), 5000);
      return () => window.clearTimeout(t);
    }, [voiceError]);

    // Recording timer (seconds since recording started)
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
      if (!listening) {
        setElapsed(0);
        return;
      }
      const startedAt = Date.now();
      const id = window.setInterval(
        () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
        250,
      );
      return () => window.clearInterval(id);
    }, [listening]);

    // Auto-grow the textarea between MIN and MAX; CSS transitions the height.
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      const prev = el.style.height;
      el.style.transition = "none";
      el.style.height = "0px";
      const scrollHeight = el.scrollHeight;
      el.style.height = prev;
      void el.offsetHeight; // reflow so the transition picks up from `prev`
      el.style.transition = "";
      const next = Math.max(TEXTAREA_MIN, Math.min(scrollHeight, TEXTAREA_MAX));
      el.style.height = `${next}px`;
      setIsScrolling(scrollHeight > TEXTAREA_MAX);
      const t = setTimeout(updateFades, 0);
      return () => clearTimeout(t);
    }, [value, updateFades]);

    // Click outside closes the model menu
    useEffect(() => {
      if (!menuOpen) return;
      const onPointerDown = (e: PointerEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [menuOpen]);

    const submit = () => {
      if (!hasValue || disabled || !selectedModel || !effort) return;
      onSubmit?.(value.trim(), { model: selectedModel, effort });
      setValue("");
      setMenuOpen(false);
      textareaRef.current?.focus();
    };

    const cycleEffort = (e: MouseEvent) => {
      e.stopPropagation();
      setEffortIndex((i) => (i + 1) % efforts.length);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (listening) cancelVoice();
        submit();
      }
      if (e.key === "Escape") setMenuOpen(false);
    };

    /** Buttons inside the card must not steal focus from the textarea */
    const keepFocus = (e: MouseEvent) => e.preventDefault();

    // Thinking-level button: next to the model picker, or beside the send button when compact
    const effortButton = effort && (
      <button
        type="button"
        onMouseDown={keepFocus}
        onClick={cycleEffort}
        title="میزان استدلال"
        aria-label={`میزان استدلال: ${effort.label}. برای تغییر کلیک کن`}
        className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-dust outline-none transition-all duration-200 hover:bg-white/6 hover:text-bone"
      >
        <EffortBarsIcon ratio={effortRatio} />
        <span className="text-xs font-semibold text-brand select-none">تفکر</span>
        <span className="text-xs font-semibold select-none">
          <MorphingText text={effort.label} />
        </span>
      </button>
    );

    return (
      <div ref={setRefs} className={cn("relative w-full", className)}>
        <div
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (target !== textareaRef.current && !target.closest("button")) {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
          className={cn(
            "relative z-10 w-full cursor-text rounded-3xl border border-white/8 bg-ash shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] transition-colors duration-200",
            "focus-within:border-brand/40 focus-within:ring-1 focus-within:ring-brand/20",
            disabled && "opacity-60",
          )}
        >
          {/* textarea + scroll fades */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onScroll={updateFades}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={rotating ? undefined : placeholder}
              aria-placeholder={rotating ? placeholder : undefined}
              aria-label="پیام"
              disabled={disabled}
              readOnly={listening}
              autoFocus={autoFocus}
              rows={1}
              style={{ height: TEXTAREA_MIN, transition: "height 0.15s ease-out" }}
              className={cn(
                "prompt-scrollbar block w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-[26px] text-bone outline-none placeholder:text-faint",
                isScrolling ? "overflow-y-auto" : "overflow-y-hidden",
                // Orange native caret; hidden while empty so the small fake caret stands in
                empty ? "caret-transparent" : "caret-brand",
              )}
            />
            {rotating && (
              <RotatingPlaceholder
                phrases={placeholders}
                // Pauses the moment the box is focused: a fresh box, waiting for input
                active={empty && !focused && !disabled && !listening && !transcribing}
                className="px-4 pt-3.5 text-[15px] leading-[26px]"
              />
            )}
            {/* Fresh state: focused + empty → just a small blinking brand caret */}
            {empty && focused && !disabled && !listening && !transcribing && (
              <span
                aria-hidden
                className="pointer-events-none absolute start-4 top-[19px] h-4 w-0.5 rounded-full bg-brand animate-caret-blink"
              />
            )}
            {/* Recording stopped, final text on its way */}
            {empty && !listening && transcribing && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-3.5 text-[15px] leading-[26px] text-faint animate-in fade-in duration-300"
              >
                در حال تبدیل گفتار به متن…
              </div>
            )}
            {/* Listening, nothing recognized yet */}
            {empty && listening && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-3.5 text-[15px] leading-[26px] text-faint animate-in fade-in duration-300"
              >
                بگو، دارم گوش می‌دم…
              </div>
            )}
            <div
              ref={topFadeRef}
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-8 bg-linear-to-b from-ash via-ash/90 to-transparent"
              style={{ opacity: 0 }}
            />
            <div
              ref={bottomFadeRef}
              aria-hidden
              className="pointer-events-none absolute inset-x-4 bottom-0 h-8 bg-linear-to-t from-ash via-ash/90 to-transparent"
              style={{ opacity: 0 }}
            />
          </div>

          {/* bottom actions: model · effort · … · send */}
          <div className="flex items-center gap-0.5 px-2 pb-2">
            {/* While recording, the pickers give way to a "listening" label */}
            {listening && (
              <span
                role="status"
                className="flex h-8 items-center gap-2 px-2.5 text-xs font-semibold text-dust animate-in fade-in duration-300"
              >
                <span className="relative flex size-2">
                  <span className="absolute inset-0 rounded-full bg-brand animate-rec-pulse" />
                  <span className="relative size-2 rounded-full bg-brand" />
                </span>
                در حال ضبط
              </span>
            )}

            {!listening && !compact && selectedModel && (
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                  aria-controls={listboxId}
                  aria-label={`انتخاب مدل. مدل فعلی: ${selectedModel.label}`}
                  className={cn(
                    "group flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-dust outline-none transition-all duration-200 hover:bg-white/6 hover:text-bone",
                    menuOpen && "bg-white/6 text-bone",
                  )}
                >
                  <ModelIcon
                    model={selectedModel}
                    className="size-3.5 opacity-70 transition-opacity group-hover:opacity-100"
                  />
                  <span className="text-xs font-semibold select-none">
                    <MorphingText text={selectedModel.label} />
                  </span>
                </button>

                {/* model menu — opens upward, anchored to the start edge */}
                <div
                  id={listboxId}
                  role="listbox"
                  aria-label="انتخاب مدل"
                  onMouseLeave={() =>
                    setHoverStyle((p) => ({
                      ...p,
                      opacity: 0,
                      transform: String(p.transform).replace("scale(1)", "scale(0.95)"),
                      transition: "opacity 0.2s ease-in, transform 0.2s ease-out",
                    }))
                  }
                  className={cn(
                    "absolute bottom-full start-0 z-50 mb-2.5 flex w-52 flex-col gap-0.5 rounded-2xl border border-white/8 bg-ash/95 p-1 shadow-xl backdrop-blur-md transition-all duration-400 ltr:origin-bottom-left rtl:origin-bottom-right",
                    menuOpen
                      ? "pointer-events-auto translate-y-0 scale-100 opacity-100 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      : "pointer-events-none translate-y-3 scale-95 opacity-0 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                  )}
                >
                  <div className="relative flex flex-col gap-0.5">
                    <div
                      aria-hidden
                      style={hoverStyle}
                      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-8 rounded-xl bg-white/6"
                    />
                    {models.map((m, idx) => {
                      const selected = m.id === selectedModel.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseDown={keepFocus}
                          onMouseEnter={() =>
                            setHoverStyle((p) => ({
                              opacity: 1,
                              transform: `translateY(${idx * MENU_ROW}px) scale(1)`,
                              transition:
                                p.opacity === 0
                                  ? "opacity 0.15s ease-out"
                                  : `transform 0.3s ${SPRING}, opacity 0.15s ease`,
                            }))
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setModelId(m.id);
                            setMenuOpen(false);
                          }}
                          className="group relative flex h-8 w-full cursor-pointer items-center justify-between rounded-xl px-2.5 text-start text-xs font-medium text-bone/80 outline-none active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-2">
                            <ModelIcon
                              model={m}
                              className="size-3.5 opacity-85 transition-opacity group-hover:opacity-100"
                            />
                            <span dir="auto">{m.label}</span>
                          </span>
                          {selected && (
                            <span aria-hidden className="size-1.5 rounded-full brand-gradient" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!listening && !compact && effortButton}

            {/* end side: live level bars + the action button (send / mic / stop) */}
            <div className="ms-auto flex items-center">
              {!listening && compact && <span className="me-1">{effortButton}</span>}
              {/* timer sits on the start side of the bars (right in RTL) */}
              {listening && (
                <span
                  aria-label={`مدت ضبط ${formatDuration(elapsed)}`}
                  className="me-2.5 text-xs font-semibold tabular-nums text-dust animate-in fade-in duration-300"
                >
                  {formatDuration(elapsed)}
                </span>
              )}
              <MicVisualizer
                active={listening}
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                  listening ? "me-2.5 max-w-16 opacity-100" : "max-w-0 opacity-0",
                )}
              />
              <button
                type="button"
                onMouseDown={keepFocus}
                onClick={() => {
                  if (listening) stopVoice();
                  else if (hasValue) submit();
                  else if (voice) startVoice();
                }}
                disabled={disabled || (!hasValue && !voice)}
                aria-label={listening ? "توقف ضبط" : hasValue ? "ارسال" : "ورودی صوتی"}
                className="relative flex size-8 cursor-pointer items-center justify-center rounded-full bg-brand text-white outline-none transition-all duration-300 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ash active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:brightness-100"
              >
                {listening && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-brand/50 animate-rec-pulse"
                  />
                )}
                <span className="relative flex size-full items-center justify-center">
                  <ActionIcon show={!listening && hasValue} exitRotate="rotate-45">
                    <ArrowUpIcon />
                  </ActionIcon>
                  <ActionIcon show={!listening && !hasValue} exitRotate="-rotate-45">
                    <MicIcon />
                  </ActionIcon>
                  <ActionIcon show={listening} exitRotate="rotate-45">
                    <StopIcon />
                  </ActionIcon>
                </span>
              </button>
            </div>
          </div>
        </div>

        {voiceError && (
          <p
            role="alert"
            className="pointer-events-none absolute inset-x-0 top-full mt-2.5 text-center text-xs text-brand animate-in fade-in slide-in-from-top-1 duration-300"
          >
            {voiceError}
          </p>
        )}
      </div>
    );
  },
);
