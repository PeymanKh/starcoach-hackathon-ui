import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { PhoneCall, RotateCcw } from "lucide-react";
import { AgentStatus, type AgentState } from "@/components/chat/AgentStatus";
import { Markdown } from "@/components/chat/Markdown";
import { ProductCard, ProductCarousel } from "@/components/chat/ProductCard";
import { StoreCard, StoreList, type StoreCardData, type VerifiedPrice } from "@/components/chat/StoreCard";
import { AiCallScreen, CallSheet } from "@/components/chat/StoreCall";
import { ToolSteps, type StepView } from "@/components/chat/ToolSteps";
import { GroupLabel } from "@/components/docs/DocBlocks";
import { Orb } from "@/components/ui/thinking-orbs";
import { cn } from "@/lib/cn";
import {
  CALL_PRODUCT,
  CARD_PRODUCTS,
  COMPARED_STORES,
  COMPARE_DONE,
  DETAILS_FAILED,
  MARKDOWN_SAMPLE,
  NO_IMAGE_PRODUCT,
  NO_SELLER_PRODUCT,
  REPLAY_AFTER,
  REPLAY_BEFORE,
  REPLAY_QUESTION,
  REPLAY_STORE,
  SEARCH_DONE,
  SEARCH_RUNNING,
  STORES_DONE,
  STORES_RUNNING,
  TIER_STORES,
} from "@/content/showcase-data";

/**
 * Everything the chat can show, live: the real components with sample data, each in a frame
 * that says what it is and when it appears. Buttons work: cards "send" their follow-up (shown
 * as a toast), and the call buttons open the real call flow.
 */
export function ChatShowcase() {
  const [asked, setAsked] = useState<string | null>(null);
  const [calling, setCalling] = useState<{ store: StoreCardData; mode: "sheet" | "ai" } | null>(null);
  const [verified, setVerified] = useState<Record<string, VerifiedPrice>>({});

  useEffect(() => {
    if (!asked) return;
    const timer = window.setTimeout(() => setAsked(null), 2600);
    return () => window.clearTimeout(timer);
  }, [asked]);

  const call = (store: StoreCardData) => setCalling({ store, mode: "sheet" });
  const confirm = (result: VerifiedPrice) => {
    if (calling) setVerified((all) => ({ ...all, [calling.store.id]: result }));
    setCalling(null);
  };

  return (
    <div className="not-prose flex flex-col gap-4">
      <GroupLabel>وضعیت‌های ایجینت</GroupLabel>
      <StatesSpecimen />
      <StepsSpecimen />

      <GroupLabel className="mt-6">یک پاسخ کامل</GroupLabel>
      <ReplaySpecimen verified={verified} onCall={call} />

      <GroupLabel className="mt-6">کارت‌ها و پاسخ</GroupLabel>
      <Specimen
        title="پاسخ متنی"
        tag="markdown"
        note="فقط همون مقدار markdown که پرامپت اجازه میده: پررنگ، فهرست، مراحل و جدول مقایسه با هدر قرمز."
        user="پرو مکس یا پرو؟ کدوم برای عکاسی بهتره؟"
      >
        <Markdown text={MARKDOWN_SAMPLE} />
      </Specimen>
      <ProductSpecimen onAsk={setAsked} />
      <Specimen
        title="چند گزینه"
        tag="ProductCarousel"
        note="وقتی چند محصول مناسب هست، کارت‌ها جمع‌وجور و کشیدنی‌ان؛ هر کدوم مستقیم به فروشگاه‌هاش می‌رسه."
        user="یه آیفون ۱۵ میخوام، چه گزینه‌هایی دارم؟"
      >
        <Markdown text="چند تا گزینه با قیمت‌های مختلف پیدا کردم؛ برای دیدن بقیه، بکشید:" />
        <ProductCarousel products={CARD_PRODUCTS} onAsk={setAsked} />
      </Specimen>
      <TiersSpecimen verified={verified} onCall={call} />
      <Specimen
        title="مقایسه‌ی فروشگاه‌ها"
        tag="compare_stores"
        note="برنده‌ها با نشان مشخص میشن: ارزان‌ترین، نزدیک‌ترین، و فروشگاه‌هایی که توی یک پاساژن."
        user="بین این دو تا کدوم فروشگاه بهتره؟"
      >
        <Markdown text="«فرورا رویس» **ارزون‌تره** ولی الان بسته‌ست؛ «نیورا نیکین» **نزدیک‌تره** و بازه. هر دو توی یک پاساژن، پس می‌تونی هر دو رو ببینی:" />
        <StoreList stores={COMPARED_STORES} />
      </Specimen>
      <CallSpecimen onCall={() => setCalling({ store: TIER_STORES.old, mode: "ai" })} />

      {calling?.mode === "sheet" && (
        <CallSheet
          store={calling.store}
          productName={CALL_PRODUCT}
          onClose={() => setCalling(null)}
          onAiCall={() => setCalling({ store: calling.store, mode: "ai" })}
          onResult={confirm}
        />
      )}
      {calling?.mode === "ai" && (
        <AiCallScreen
          store={calling.store}
          productName={CALL_PRODUCT}
          onClose={() => setCalling(null)}
          onResult={confirm}
        />
      )}
      <Toast text={asked} />
    </div>
  );
}

// ─── the frame ────────────────────────────────────────────────────────

/** One component on display: what it is and when it shows up, then the live thing. */
function Specimen({
  title,
  note,
  tag,
  action,
  controls,
  user,
  children,
}: {
  title: string;
  note: string;
  /** The user's message it answers: the stage then reads like the chat */
  user?: string;
  /** The component, event or tool behind it */
  tag?: string;
  /** Replaces the tag, e.g. a replay button */
  action?: ReactNode;
  /** A switcher between variants, under the caption */
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/[0.06] bg-ink/70">
      <figcaption className="flex items-start gap-3 border-b border-white/[0.05] px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-6 text-bone">{title}</p>
          <p className="mt-0.5 text-[12.5px] leading-6 text-faint">{note}</p>
        </div>
        {action ??
          (tag && (
            <span
              dir="ltr"
              className="mt-0.5 shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] leading-4 text-dust"
            >
              {tag}
            </span>
          ))}
      </figcaption>
      {controls && <div className="border-b border-white/[0.05] px-3 py-2 sm:px-4">{controls}</div>}
      {/* 16px on phones; the carousel's 20px bleed is clipped by the frame and lines up */}
      <div className="p-4 sm:p-6">
        {user ? (
          <div className="flex flex-col gap-6">
            <UserBubble text={user} />
            <div className="flex flex-col gap-4">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </figure>
  );
}

/** Pills to switch between the variants of one component. */
function Switcher<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; dot?: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto no-scrollbar">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
              active ? "bg-white/[0.09] text-bone" : "text-faint hover:text-dust",
            )}
          >
            {option.dot && <span aria-hidden className={cn("size-1.5 rounded-full", option.dot)} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[85%] self-start whitespace-pre-wrap rounded-2xl bg-brand px-4 py-2.5 text-[15px] leading-7 text-white">
      {text}
    </div>
  );
}

/** A small caption above one example inside a frame. */
function Caption({ children }: { children: ReactNode }) {
  return <p className="mb-3.5 text-[11.5px] font-medium text-faint">{children}</p>;
}

/** What a card button would have sent to the agent. */
function Toast({ text }: { text: string | null }) {
  return createPortal(
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
        >
          <p className="max-w-[90vw] truncate rounded-full bg-ash px-4 py-2.5 text-[12.5px] text-dust shadow-xl ring-1 ring-white/10">
            این پیام به ایجینت فرستاده می‌شد: <span className="text-bone">{text}</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─── specimens ────────────────────────────────────────────────────────

const STATES: { state: AgentState; tag: string; note: string; timer?: boolean }[] = [
  { state: "waiting", tag: "queued", note: "پیام ثبت شده و منتظر ورکره؛ هنوز هیچ رویدادی نرسیده." },
  { state: "thinking", tag: "thinking", note: "مدل در حال استدلاله؛ شمارنده نشون میده چقدر طول کشیده.", timer: true },
  { state: "slow", tag: "slow", note: "اجرا طولانی‌تر از معمول شده؛ کاربر می‌دونه کار هنوز ادامه داره.", timer: true },
  { state: "retrying", tag: "reconnect", note: "اتصال قطع شده؛ استریم با Last-Event-ID از همون‌جا ادامه پیدا می‌کنه." },
];

function StatesSpecimen() {
  const [since] = useState(() => Date.now() - 4000);
  return (
    <Specimen
      title="بین رویدادها"
      tag="AgentStatus"
      note="کاربر هیچ‌وقت جلوی صفحه‌ی خالی نمی‌مونه؛ هر حالت اورب و جمله‌ی خودش رو داره."
      user="یه گوشی خوب تا ۵۰ میلیون میخوام"
    >
      <ul className="flex flex-col divide-y divide-white/[0.05]">
        {STATES.map(({ state, tag, note, timer }) => (
          <li key={state} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <AgentStatus state={state} since={timer ? since : undefined} className="min-w-0" />
              <span dir="ltr" className="shrink-0 font-mono text-[10.5px] text-faint">
                {tag}
              </span>
            </div>
            <p className="mt-1 ps-[52px] text-[12.5px] leading-6 text-faint">{note}</p>
          </li>
        ))}
      </ul>
    </Specimen>
  );
}

function StepsSpecimen() {
  return (
    <Specimen
      title="ابزارها در حال کار"
      tag="tool_start · tool_end"
      note="هر ابزار با ورودی‌هاش نشون داده میشه و بعد از تموم شدن، خلاصه‌ی نتیجه‌ش رو می‌بینید."
      user="آیفون ۱۵ پرو مکس، نزدیک من، قسطی"
    >
      <div className="flex flex-col gap-6">
        <div>
          <Caption>یکی تموم شده، یکی در حال اجرا</Caption>
          <ToolSteps steps={[SEARCH_DONE, STORES_RUNNING]} />
        </div>
        <div className="border-t border-dashed border-white/[0.07] pt-6">
          <Caption>وقتی جواب شروع میشه، مراحل جمع میشن (کلیک کنید)</Caption>
          <ToolSteps steps={[SEARCH_DONE, STORES_DONE, COMPARE_DONE]} collapsible />
        </div>
        <div className="border-t border-dashed border-white/[0.07] pt-6">
          <Caption>خطای یک ابزار؛ اجرا متوقف نمیشه و مدل ادامه میده</Caption>
          <ToolSteps steps={[DETAILS_FAILED]} />
        </div>
      </div>
    </Specimen>
  );
}

const PRODUCT_VARIANTS = {
  normal: {
    label: "با فروشنده",
    product: CARD_PRODUCTS[0],
    user: "آیفون ۱۵ پرو مکس زیر ۹۰ میلیون",
    answer: "بهترین گزینه توی بودجه‌ت اینه؛ توی **۱۲ فروشگاه حضوری** تهران پیدا میشه:",
  },
  noSeller: {
    label: "بدون فروشنده",
    product: NO_SELLER_PRODUCT,
    user: "گلکسی S24 اولترا ۵۱۲ گیگ میخوام",
    answer: "این مدل الان توی هیچ فروشگاه حضوری‌ای ثبت نشده؛ ولی می‌تونم جایگزین‌های نزدیکش رو پیدا کنم:",
  },
  noImage: {
    label: "بدون عکس",
    product: NO_IMAGE_PRODUCT,
    user: "یه هندزفری بی‌سیم ارزون میخوام",
    answer: "این یکی از ارزون‌ترین‌هاست و ۵ تا فروشگاه دارنش:",
  },
};
type ProductVariant = keyof typeof PRODUCT_VARIANTS;

function ProductSpecimen({ onAsk }: { onAsk: (text: string) => void }) {
  const [variant, setVariant] = useState<ProductVariant>("normal");
  return (
    <Specimen
      title="کارت محصول"
      tag="ProductCard"
      note="بازه‌ی قیمت و تعداد فروشنده‌ها، با قدم بعدی. اگه هیچ فروشگاهی نداشته باشه، «جایگزین‌ها» دکمه‌ی اصلی میشه."
      user={PRODUCT_VARIANTS[variant].user}
      controls={
        <Switcher
          value={variant}
          onChange={setVariant}
          options={Object.entries(PRODUCT_VARIANTS).map(([id, v]) => ({ id: id as ProductVariant, label: v.label }))}
        />
      }
    >
      <Markdown key={`${variant}-text`} text={PRODUCT_VARIANTS[variant].answer} />
      <ProductCard key={variant} product={PRODUCT_VARIANTS[variant].product} onAsk={onAsk} />
    </Specimen>
  );
}

const TIERS = {
  fresh: { label: "به‌روز", dot: "bg-emerald-400" },
  recent: { label: "چند هفته پیش", dot: "bg-dust" },
  old: { label: "قدیمی", dot: "bg-amber-400" },
  stale: { label: "نامعتبر", dot: "bg-brand" },
};
type Tier = keyof typeof TIERS;

function TiersSpecimen({
  verified,
  onCall,
}: {
  verified: Record<string, VerifiedPrice>;
  onCall: (store: StoreCardData) => void;
}) {
  const [tier, setTier] = useState<Tier>("old");
  const store = TIER_STORES[tier];
  return (
    <Specimen
      title="کارت فروشگاه و اعتبار قیمت"
      tag="find_stores"
      note="بیشتر قیمت‌های دیتا قدیمی‌ان؛ پس کارت صادقانه میگه چقدر میشه به قیمت اعتماد کرد. فقط قیمت به‌روز بدون استعلامه؛ بقیه دکمه‌ی استعلام دارن."
      user="آیفون ۱۵ پرو مکس رو نزدیک خودم کجا پیدا کنم؟"
      controls={
        <Switcher
          value={tier}
          onChange={setTier}
          options={Object.entries(TIERS).map(([id, t]) => ({ id: id as Tier, label: t.label, dot: t.dot }))}
        />
      }
    >
      <Markdown text="این فروشگاه نزدیکت این گوشی رو داره؛ قبل از رفتن به تاریخ قیمتش نگاه کن:" />
      <StoreCard key={store.id} store={store} verified={verified[store.id]} onCall={onCall} />
    </Specimen>
  );
}

function CallSpecimen({ onCall }: { onCall: () => void }) {
  return (
    <Specimen
      title="استعلام با تماس"
      tag="call"
      note="روی دکمه‌ی استعلام هر کارت: یا ایجینت به‌جای کاربر زنگ می‌زنه و کاربر زنده گوش میده، یا خود کاربر با فهرست سؤال‌ها تماس می‌گیره."
    >
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/[0.05]">
          <Orb state="base" size={40} className="text-bone" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-6 text-bone">ایجینت برای شما زنگ می‌زنه</p>
          <p className="mt-0.5 text-[12.5px] leading-6 text-faint">
            قیمت و موجودی رو می‌پرسه و نتیجه، قیمت قدیمی کارت رو با قیمت تأییدشده عوض می‌کنه.
          </p>
        </div>
        <button
          type="button"
          onClick={onCall}
          className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-1"
        >
          <PhoneCall className="size-4" />
          امتحان کنید
        </button>
      </div>
    </Specimen>
  );
}

// ─── the replay ───────────────────────────────────────────────────────

type Frame = {
  status: AgentState | null;
  steps: StepView[];
  before: string;
  card: boolean;
  after: string;
};

const START: Frame = { status: "waiting", steps: [], before: "", card: false, after: "" };

/**
 * One whole answer, played with timings like the real stream: waiting, thinking, two tools,
 * then the answer typing in with its store card. Starts when it scrolls into view.
 */
function ReplaySpecimen({
  verified,
  onCall,
}: {
  verified: Record<string, VerifiedPrice>;
  onCall: (store: StoreCardData) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0); // 0: not started yet
  const [frame, setFrame] = useState<Frame>(START);
  const [statusSince, setStatusSince] = useState(() => Date.now());

  // Start once it's actually seen, not while the reader is still on the first section.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun((r) => r || 1);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!run) return;
    const timers: number[] = [];
    const at = (ms: number, change: Partial<Frame>) =>
      timers.push(
        window.setTimeout(() => {
          setFrame((f) => ({ ...f, ...change }));
          if ("status" in change) setStatusSince(Date.now());
        }, ms),
      );
    const type = (from: number, text: string, key: "before" | "after") => {
      const words = text.split(" ");
      words.forEach((_, i) => at(from + i * 60, { [key]: words.slice(0, i + 1).join(" ") } as Partial<Frame>));
      return from + words.length * 60;
    };

    setFrame(START);
    setStatusSince(Date.now());
    at(1300, { status: "thinking" });
    at(3200, { status: null, steps: [SEARCH_RUNNING] });
    at(5600, { steps: [SEARCH_DONE] });
    at(6200, { steps: [SEARCH_DONE, STORES_RUNNING] });
    at(8600, { steps: [SEARCH_DONE, STORES_DONE] });
    at(8900, { status: "thinking" });
    at(10400, { status: null });
    const typed = type(10400, REPLAY_BEFORE, "before");
    at(typed + 250, { card: true });
    type(typed + 900, REPLAY_AFTER, "after");
    return () => timers.forEach(window.clearTimeout);
  }, [run]);

  const answering = !!frame.before;

  return (
    <Specimen
      title="از سؤال تا جواب"
      note="یک پیام واقعی با همون زمان‌بندی استریم: آماده‌سازی، فکر کردن، دو ابزار و بعد جواب با کارت فروشگاه."
      action={
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-dust transition-colors hover:bg-white/10 hover:text-bone"
        >
          <RotateCcw className="size-3.5" />
          پخش دوباره
        </button>
      }
    >
      <div ref={ref} className="flex min-h-[23rem] flex-col gap-6">
        <UserBubble text={REPLAY_QUESTION} />
        <div className="flex flex-col gap-4">
          {frame.steps.length > 0 && <ToolSteps steps={frame.steps} collapsible={answering} />}
          {frame.status && (
            <AgentStatus
              key={`${run}-${frame.status}`}
              state={frame.status}
              since={frame.status === "thinking" ? statusSince : undefined}
            />
          )}
          {frame.before && <Markdown text={frame.before} />}
          {frame.card && <StoreList stores={[REPLAY_STORE]} verified={verified} onCall={onCall} />}
          {frame.after && <Markdown text={frame.after} />}
        </div>
      </div>
    </Specimen>
  );
}
