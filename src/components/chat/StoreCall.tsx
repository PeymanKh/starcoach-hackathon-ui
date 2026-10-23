import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Check, Mic, Phone, PhoneOff, Sparkles, X } from "lucide-react";
import { Orb } from "@/components/ui/thinking-orbs";
import type { StoreCardData, VerifiedPrice } from "@/components/chat/StoreCard";
import { cn } from "@/lib/cn";
import { faDigits, faNumber, formatToman } from "@/lib/format";

/** What the call is about, for the questions and the script. */
type CallTopic = { store: StoreCardData; productName: string };

// ─── the sheet: who makes the call ────────────────────────────────────

/**
 * Two ways to check price and stock: the agent calls while the user listens live,
 * or the user calls (tel: link) with the questions to ask and reports back.
 */
export function CallSheet({
  store,
  productName,
  onClose,
  onAiCall,
  onResult,
}: CallTopic & {
  onClose: () => void;
  onAiCall: () => void;
  onResult: (result: VerifiedPrice) => void;
}) {
  const [step, setStep] = useState<"choose" | "self">("choose");
  useEscape(onClose);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`تماس با ${store.name}`}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[460px] rounded-t-3xl border border-white/[0.07] bg-ash p-5 pb-7 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-bone">{store.name}</h2>
            {store.phone && (
              <p dir="ltr" className="text-end text-[13px] tabular-nums text-dust">
                {faDigits(store.phone)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-dust hover:bg-white/[0.06] hover:text-bone"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "choose" ? (
          <div className="flex flex-col gap-2.5">
            <CallOption
              icon={<Orb state="base" size={28} className="text-bone" />}
              title="ایجنت برام زنگ بزنه"
              text="ایجنت تماس می‌گیرد و قیمت و موجودی را می‌پرسد؛ شما زنده گوش می‌دهید."
              badge="پیشنهادی"
              onClick={onAiCall}
            />
            <CallOption
              icon={<Phone className="size-5 text-bone" />}
              title="خودم زنگ می‌زنم"
              text="شماره گرفته می‌شود و سؤال‌های مهم را همین‌جا می‌بینید."
              href={store.phone ? `tel:${store.phone}` : undefined}
              onClick={() => setStep("self")}
            />
          </div>
        ) : (
          <SelfCallChecklist store={store} productName={productName} onResult={onResult} />
        )}
      </motion.div>
    </div>,
    document.body,
  );
}

function CallOption({
  icon,
  title,
  text,
  badge,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  badge?: string;
  href?: string;
  onClick: () => void;
}) {
  const body = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.06]">{icon}</span>
      <span className="min-w-0 flex-1 text-start">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-bone">
          {title}
          {badge && (
            <span className="rounded-full bg-brand/15 px-2 py-px text-[10px] font-medium text-brand-1">{badge}</span>
          )}
        </span>
        <span className="mt-0.5 block text-[12px] leading-5 text-dust">{text}</span>
      </span>
    </>
  );
  const className =
    "flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]";
  // The self call is a real tel: link, so the phone dials; the sheet then shows the questions.
  return href ? (
    <a href={href} onClick={onClick} className={className}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

/** While the user is on the phone: what to ask, then what they found out. */
function SelfCallChecklist({
  store,
  productName,
  onResult,
}: CallTopic & { onResult: (result: VerifiedPrice) => void }) {
  const [newPrice, setNewPrice] = useState<string | null>(null);
  const questions = callQuestions(store, productName);

  return (
    <div>
      <p className="text-[13px] font-semibold text-bone">این‌ها را بپرسید:</p>
      <ul className="mt-2.5 flex flex-col gap-2">
        {questions.map((q) => (
          <li key={q} className="flex gap-2 text-[13px] leading-6 text-dust">
            <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand" />
            {q}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[13px] font-semibold text-bone">بعد از تماس:</p>
      {newPrice === null ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <ResultButton onClick={() => onResult({ price: store.price?.min ?? null, inStock: true })}>
            <Check className="size-4" /> قیمت همین بود
          </ResultButton>
          <ResultButton onClick={() => setNewPrice("")}>قیمت فرق داشت</ResultButton>
          <ResultButton
            className="col-span-2"
            onClick={() => onResult({ price: store.price?.min ?? null, inStock: false })}
          >
            موجود نبود
          </ResultButton>
        </div>
      ) : (
        <form
          className="mt-2.5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const millions = Number(toLatinDigits(newPrice));
            if (millions > 0) onResult({ price: Math.round(millions * 1_000_000), inStock: true });
          }}
        >
          <label className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-white/[0.05] px-3 ring-1 ring-white/[0.08] focus-within:ring-brand">
            <input
              autoFocus
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="مثلاً ۸۶٫۵"
              className="min-w-0 flex-1 bg-transparent text-base text-bone outline-none sm:text-[14px] placeholder:text-faint"
            />
            <span className="text-[12px] text-faint">میلیون تومان</span>
          </label>
          <button
            type="submit"
            className="h-11 cursor-pointer rounded-xl bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-1"
          >
            ثبت
          </button>
        </form>
      )}
      <p className="mt-3 text-[11px] leading-5 text-faint">
        پاسخ شما قیمت این فروشگاه را برای بقیه‌ی کاربران هم به‌روز می‌کند.
      </p>
    </div>
  );
}

function ResultButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] text-[13px] text-bone ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.08]",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── the live AI call ─────────────────────────────────────────────────

/**
 * DEMO: recorded voices. First a notice that the call is simulated (a man's voice), then the
 * ringing, then the agent (a woman's voice) asking the store. A telephony service
 * (outbound call + speech-to-text + text-to-speech) would replace the recordings.
 */
const NOTICE_VOICE = "/calls/intro.mp3";
const AGENT_VOICE = "/calls/agent.mp3";
/** Ringback before the agent speaks: 425 Hz, the Iranian tone, about a second on, then a pause. */
const RING_HZ = 425;
const RINGS = 2;
const RING_EVERY_S = 2;
const RING_ON_S = 1.1;
/** Waveform bars, one per frequency band of the voice. */
const BARS = 28;

/**
 * The agent calls the store while the user listens: just the agent's orb, breathing with its
 * voice, a timer, "let me talk" and "hang up". It ends with what the call found out.
 */
export function AiCallScreen({
  store,
  productName,
  onClose,
  onResult,
}: CallTopic & { onClose: () => void; onResult: (result: VerifiedPrice) => void }) {
  const confirmed = useMemo(() => confirmedPrice(store), [store]);
  const [phase, setPhase] = useState<"notice" | "dialing" | "live" | "ended">("notice");
  const [takenOver, setTakenOver] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Updated straight from the audio every frame, without re-rendering React.
  const orbRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  useEscape(onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.7;
    analyser.connect(ctx.destination);

    // both voices go through the analyser, so the orb and bars follow them
    const notice = new Audio(NOTICE_VOICE);
    const audio = new Audio(AGENT_VOICE);
    audioRef.current = audio;
    ctx.createMediaElementSource(notice).connect(analyser);
    ctx.createMediaElementSource(audio).connect(analyser);
    audio.onended = () => setPhase("ended");
    void ctx.resume();

    let answer = 0;
    // after the notice: ring, then the agent picks up the conversation
    const dial = () => {
      setPhase("dialing");
      setConnectedAt(Date.now()); // the call timer runs from the first ring
      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.frequency.value = RING_HZ;
      ringGain.gain.value = 0;
      ring.connect(ringGain).connect(ctx.destination);
      const t0 = ctx.currentTime + 0.15;
      for (let i = 0; i < RINGS; i++) {
        ringGain.gain.setValueAtTime(0.06, t0 + i * RING_EVERY_S);
        ringGain.gain.setValueAtTime(0, t0 + i * RING_EVERY_S + RING_ON_S);
      }
      ring.start(t0);
      ring.stop(t0 + RINGS * RING_EVERY_S);
      answer = window.setTimeout(() => {
        setPhase("live");
        // If the browser refuses to play, still finish the demo.
        audio.play().catch(() => window.setTimeout(() => setPhase("ended"), 2500));
      }, (RINGS * RING_EVERY_S + 0.3) * 1000);
    };
    notice.onended = dial;
    notice.play().catch(dial);

    const bins = new Uint8Array(analyser.frequencyBinCount);
    let raf = requestAnimationFrame(function draw() {
      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = 2; i < 2 + BARS; i++) sum += bins[i] ?? 0;
      const level = Math.min(1, sum / BARS / 200);
      if (orbRef.current) orbRef.current.style.transform = `scale(${1 + level * 0.14})`;
      barRefs.current.forEach((bar, i) => {
        if (bar) bar.style.transform = `scaleY(${0.12 + ((bins[i + 2] ?? 0) / 255) ** 1.5 * 0.88})`;
      });
      raf = requestAnimationFrame(draw);
    });

    return () => {
      window.clearTimeout(answer);
      cancelAnimationFrame(raf);
      notice.onended = null;
      audio.onended = null;
      notice.pause();
      audio.pause();
      void ctx.close();
    };
  }, []);

  const takeOver = () => {
    audioRef.current?.pause();
    setTakenOver(true);
  };

  const status =
    phase === "notice"
      ? "این یک تماس شبیه‌سازی‌شده است"
      : phase === "dialing"
      ? "در حال برقراری تماس…"
      : phase === "ended"
        ? "تماس تمام شد"
        : takenOver
          ? "شما روی خط هستید"
          : "ایجنت در حال صحبت است";

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`تماس ایجنت با ${store.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-ink/[0.97] backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-5 pt-10 pb-8">
        {/* who and how long */}
        <div className="text-center">
          <p className="text-[12px] text-faint">ایجنت از طرف شما تماس می‌گیرد</p>
          <h2 className="mt-1 text-[22px] font-bold text-bone">{store.name}</h2>
          <p className="mt-1 text-[13px] text-dust">استعلام «{productName}»</p>
          <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-dust">
            {status}
            {connectedAt && (phase === "dialing" || phase === "live") && (
              <>
                <span aria-hidden>·</span>
                <CallTimer since={connectedAt} />
              </>
            )}
          </p>
        </div>

        {/* the agent, in the middle, breathing with its voice */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="relative grid size-56 place-items-center">
            {phase === "dialing" && (
              <span className="absolute inset-6 animate-ping rounded-full bg-brand/15 [animation-duration:2s]" />
            )}
            <span className="absolute inset-8 rounded-full bg-brand/[0.07] blur-xl" />
            <div ref={orbRef} className="relative transition-transform duration-75 ease-out">
              <Orb
                state={phase === "notice" ? "base" : phase === "dialing" ? "waiting" : "working"}
                size={152}
                paused={phase === "ended" || takenOver}
                className={cn(
                  "transition-colors duration-500",
                  takenOver ? "text-faint" : phase === "notice" ? "text-dust" : "text-brand",
                )}
              />
            </div>
          </div>
          <div aria-hidden className="flex h-10 items-center justify-center gap-[3px]">
            {Array.from({ length: BARS }, (_, i) => (
              <span
                key={i}
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                style={{ transform: "scaleY(0.12)" }}
                className={cn(
                  "h-full w-[3px] origin-center rounded-full transition-[transform,background-color] duration-75",
                  phase === "notice" ? "bg-dust/70" : "bg-brand/80",
                )}
              />
            ))}
          </div>
          {takenOver && (
            <p className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-dust">
              ایجنت ساکت شد؛ میکروفون شما وصل است
            </p>
          )}
        </div>

        {/* what we found out, or the call controls */}
        {phase === "ended" ? (
          <CallResult
            store={store}
            confirmed={confirmed}
            onApply={() => onResult({ price: confirmed, inStock: true })}
            onClose={onClose}
          />
        ) : (
          <div className="flex items-center justify-center gap-10">
            <RoundButton
              label={takenOver ? "روی خط هستید" : "خودم صحبت می‌کنم"}
              onClick={takeOver}
              disabled={takenOver || phase !== "live"}
              className={takenOver ? "bg-white text-ink" : "bg-white/[0.08] text-bone"}
            >
              <Mic className="size-6" />
            </RoundButton>
            <RoundButton label="قطع تماس" onClick={onClose} className="bg-brand text-white">
              <PhoneOff className="size-6" />
            </RoundButton>
          </div>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}

function CallResult({
  store,
  confirmed,
  onApply,
  onClose,
}: {
  store: StoreCardData;
  confirmed: number | null;
  onApply: () => void;
  onClose: () => void;
}) {
  const where = [store.floor != null && `طبقه‌ی ${faNumber(store.floor)}`, store.unit && `واحد ${faDigits(store.unit)}`]
    .filter(Boolean)
    .join("، ");
  const rows = [
    { label: "موجودی", value: "موجود است" },
    confirmed && { label: "قیمت امروز", value: formatToman(confirmed) },
    store.payments?.length && { label: "خرید قسطی", value: "دارد" },
    where && { label: "کجا بروید", value: where },
  ].filter((r): r is { label: string; value: string } => !!r);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4"
    >
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-300">
        <Sparkles className="size-4" />
        نتیجه‌ی تماس
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11px] text-faint">{row.label}</dt>
            <dd className="text-[14px] font-semibold text-bone">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="h-11 flex-1 cursor-pointer rounded-xl bg-brand text-[13px] font-semibold text-white hover:bg-brand-1"
        >
          ثبت در کارت فروشگاه
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 cursor-pointer rounded-xl bg-white/[0.06] px-4 text-[13px] text-dust hover:text-bone"
        >
          بستن
        </button>
      </div>
    </motion.div>
  );
}

function RoundButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "grid size-16 cursor-pointer place-items-center rounded-full transition-transform hover:scale-105 disabled:cursor-default disabled:hover:scale-100",
          className,
        )}
      >
        {children}
      </button>
      <span className="text-[12px] text-dust">{label}</span>
    </div>
  );
}

function CallTimer({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="tabular-nums">{faDigits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`)}</span>;
}

// ─── helpers ──────────────────────────────────────────────────────────

function useEscape(onClose: () => void) {
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => {
    // Capture runs first: a sheet opened over a popup closes alone, not the popup with it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      latest.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}

function callQuestions(store: StoreCardData, productName: string) {
  const questions = [`«${productName}» موجود دارید؟`, "قیمت امروزش چند است؟"];
  if (store.payments?.length) questions.push("خرید قسطی (مثلاً با ترب‌پی) دارید؟");
  questions.push("تا چه ساعتی باز هستید؟");
  return questions;
}

/** DEMO: the price "the store says" on the call, a bit above an old listed price. */
function confirmedPrice(store: StoreCardData) {
  const listed = store.price?.min;
  if (!listed) return 85_000_000;
  const label = store.price?.freshness?.label;
  const rise = label === "fresh" ? 0 : label === "recent" ? 0.02 : 0.06;
  return Math.round((listed * (1 + rise)) / 100_000) * 100_000;
}

function toLatinDigits(text: string) {
  return text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٫,]/g, ".");
}
