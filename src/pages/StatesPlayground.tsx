import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Orb, VARIANTS, type OrbLook } from "@/components/ui/thinking-orbs";
import { AgentStatus, type AgentState } from "@/components/chat/AgentStatus";
import { ToolSteps, type StepView } from "@/components/chat/ToolSteps";

/**
 * TEMPORARY design page at /playground: every agent state as a user message and the
 * AI's state under it, with fake data shaped like the real tool results. Not linked anywhere.
 */
export default function StatesPlayground() {
  const since = useMountedAgo(3000);

  return (
    <div className="h-dvh overflow-y-auto [scrollbar-gutter:stable_both-edges]">
      <main className="mx-auto w-full max-w-[768px] px-4 pb-24">
        <header className="flex items-center justify-between gap-4 pt-10 pb-8">
          <div>
            <h1 className="text-2xl font-bold text-bone">حالت‌های ایجنت</h1>
          </div>
          <a
            href="/"
            className="flex shrink-0 items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs text-dust transition-colors hover:text-bone"
          >
            <ArrowRight className="size-3.5" />
            برگشت به چت
          </a>
        </header>

        <OrbGallery />

        <LiveReplay />

        <Scenario tag="waiting" note="پیام رفت، هنوز هیچ رویدادی نرسیده" user="یه گوشی خوب تا ۵۰ میلیون میخوام">
          <AgentStatus state="waiting" />
        </Scenario>

        <Scenario tag="thinking" note="رویداد thinking: مدل در حال استدلال است، با شمارنده‌ی ثانیه" user="آیفون بخرم یا سامسونگ؟ بیشتر عکاسی می‌کنم">
          <AgentStatus state="thinking" since={since} />
        </Scenario>

        <Scenario tag="tool_start · search_products" note="ابزار در حال اجرا: اورب ابزارها + چیپ‌های ورودی" user="آیفون ۱۵ پرو زیر ۹۰ میلیون">
          <ToolSteps steps={[SEARCH_RUNNING]} />
        </Scenario>

        <Scenario tag="tool_end → tool_start" note="جستجو تمام شد (عکس محصولات)، پیدا کردن فروشگاه‌ها در حال اجرا" user="آیفون ۱۵ پرو مکس، نزدیک من، قسطی">
          <ToolSteps steps={[SEARCH_DONE, STORES_RUNNING]} />
        </Scenario>

        <Scenario tag="explore_category" note="کاربر دقیقاً نمی‌داند چه می‌خواهد" user="یه لپ‌تاپ برای دانشگاه میخوام، برنامه‌نویسی">
          <ToolSteps steps={[EXPLORE_RUNNING]} />
          <div className="mt-6 border-t border-dashed border-white/[0.06] pt-6">
            <ToolSteps steps={[EXPLORE_DONE]} />
            <AgentStatus state="thinking" className="mt-4" />
          </div>
        </Scenario>

        <Scenario tag="compare_stores" note="مقایسه‌ی فروشگاه‌ها بعد از پیدا کردنشان" user="کدوم فروشگاه بهتره؟">
          <ToolSteps steps={[SEARCH_DONE, STORES_DONE, COMPARE_RUNNING]} />
        </Scenario>

        <Scenario tag="find_alternatives" note="جایگزین ارزان‌تر" user="ارزون‌ترش رو داری؟">
          <ToolSteps steps={[ALTERNATIVES_DONE, COMPARE_DONE]} />
        </Scenario>

        <Scenario tag="failed + retrying" note="یک ابزار خطا داد و استریم قطع شد" user="اطلاعات فروشگاه نیورا نیکین">
          <ToolSteps steps={[DETAILS_FAILED]} />
          <AgentStatus state="retrying" className="mt-4" />
        </Scenario>

        <Scenario tag="slow" note="اجرای طولانی‌تر از معمول" user="همه‌ی فروشگاه‌های لوازم خانگی تهران رو مقایسه کن">
          <AgentStatus state="slow" since={since} />
        </Scenario>

        <Scenario tag="token (writing)" note="متن در حال آمدن است: مراحل جمع می‌شوند" user="آیفون ۱۵ پرو مکس، نزدیک من، قسطی">
          <ToolSteps steps={[SEARCH_DONE, STORES_DONE]} collapsible />
          <Answer text={ANSWER.slice(0, 120)} />
        </Scenario>

        <Scenario tag="done" note="پاسخ کامل: مراحل با کلیک باز می‌شوند" user="آیفون ۱۵ پرو مکس، نزدیک من، قسطی">
          <ToolSteps steps={[SEARCH_DONE, STORES_DONE, COMPARE_DONE]} collapsible />
          <Answer text={ANSWER} />
        </Scenario>
      </main>
    </div>
  );
}

// ─── building blocks ──────────────────────────────────────────────────

function Scenario({
  tag,
  note,
  user,
  children,
}: {
  tag: string;
  note: string;
  user: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.06] py-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span dir="ltr" className="rounded-md bg-brand/10 px-1.5 py-0.5 font-mono text-[11px] text-brand-1">
          {tag}
        </span>
        <span className="text-xs text-faint">{note}</span>
      </div>
      <div className="flex flex-col gap-6">
        <UserBubble text={user} />
        <div>{children}</div>
      </div>
    </section>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[85%] self-start whitespace-pre-wrap rounded-2xl bg-brand px-4 py-2.5 text-[15px] text-white">
      {text}
    </div>
  );
}

/** The answer text. While it streams in, the growing text is the only indicator. */
function Answer({ text }: { text: string }) {
  return <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.9] text-bone">{text}</p>;
}

/** Every orb the component has, to pick from. The chat uses the ones in USED. */
function OrbGallery() {
  const looks = Object.entries(VARIANTS).flatMap(([state, variants]) =>
    variants.map((variant) => ({ state, variant }) as OrbLook),
  );
  return (
    <section className="mb-2 rounded-3xl glass p-5">
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5">
        {looks.map((look) => {
          const key = `${look.state}-${look.variant}`;
          const used = USED.has(key);
          return (
            <div key={key} className="flex flex-col items-center gap-2">
              <Orb {...look} size={64} className={used ? "text-brand" : "text-faint"} />
              <span dir="ltr" className="font-mono text-[10px] text-dust">
                {look.state}
                {look.variant !== "default" && ` · ${look.variant}`}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const USED = new Set([
  "working-default", // waiting, slow
  "searching-lighthouse", // thinking
  "background-spiral", // every tool call
  "retrying-surge", // reconnecting
]);

/** A whole answer played like the real stream, to feel the transitions. */
function LiveReplay() {
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<AgentState | null>("waiting");
  const [statusSince, setStatusSince] = useState(() => Date.now());
  const [steps, setSteps] = useState<StepView[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const show = (state: AgentState | null) => {
      setStatus(state);
      setStatusSince(Date.now());
    };

    show("waiting");
    setSteps([]);
    setText("");
    at(1400, () => show("thinking"));
    at(3600, () => {
      show(null);
      setSteps([SEARCH_RUNNING]);
    });
    at(6400, () => setSteps([SEARCH_DONE]));
    at(7200, () => setSteps([SEARCH_DONE, STORES_RUNNING]));
    at(10200, () => setSteps([SEARCH_DONE, STORES_DONE]));
    at(10800, () => show("thinking"));
    const words = ANSWER.split(" ");
    const start = 12600;
    words.forEach((_, i) =>
      at(start + i * 55, () => {
        if (i === 0) show(null);
        setText(words.slice(0, i + 1).join(" "));
      }),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [run]);

  return (
    <section className="py-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span dir="ltr" className="rounded-md bg-brand/10 px-1.5 py-0.5 font-mono text-[11px] text-brand-1">
          live replay
        </span>
        <span className="text-xs text-faint">کل جریان یک پاسخ، با زمان‌بندی شبیه واقعی</span>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="ms-auto flex cursor-pointer items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-dust transition-colors hover:text-bone"
        >
          <RotateCcw className="size-3.5" />
          پخش دوباره
        </button>
      </div>
      <div className="flex flex-col gap-6">
        <UserBubble text="آیفون ۱۵ پرو مکس، نزدیک من، قسطی" />
        <div>
          <ToolSteps steps={steps} collapsible={text.length > 0} />
          {status && (
            <AgentStatus
              key={status}
              state={status}
              since={status === "thinking" ? statusSince : undefined}
              className={steps.length ? "mt-4" : undefined}
            />
          )}
          {text && <Answer text={text} />}
        </div>
      </div>
    </section>
  );
}

function useMountedAgo(ms: number) {
  const [at] = useState(() => Date.now() - ms);
  return at;
}

// ─── fake data, shaped like the real tool results ─────────────────────

const IMG = "https://image.torob.com/base/images/";

const PRODUCTS = [
  { id: "p1", persian_title: "گوشی اپل iPhone 15 Pro Max (Active) | حافظه 256 گیگابایت", main_image: `${IMG}NN/3M/NN3MS8qa1mBg8n1U.webp`, lowest_price: 84_500_000 },
  { id: "p2", persian_title: "گوشی اپل دو سیم iPhone 15 Pro (Active) | حافظه 256 گیگابایت", main_image: `${IMG}u2/La/u2LaGEmnJNqzz-jy.webp`, lowest_price: 76_900_000 },
  { id: "p3", persian_title: "گوشی اپل iPhone 15 (Not Active) | حافظه 128 گیگابایت", main_image: `${IMG}A6/E2/A6E2FBRKwSXwO8uz.jpg`, lowest_price: 52_300_000 },
  { id: "p4", persian_title: "گوشی اپل دو سیم (استوک) iPhone 15 Pro | حافظه 256 گیگابایت", main_image: `${IMG}XK/Rm/XKRmbGJz1MWsW4nm.webp`, lowest_price: 61_000_000 },
  { id: "p5", persian_title: "گوشی اپل دو سیم iPhone 15 (Not Active) | حافظه 128 گیگابایت", main_image: `${IMG}c1/c3/c1c30z4aSt4bzZVS.jpg`, lowest_price: 55_800_000 },
  { id: "p6", persian_title: "گوشی اپل (استوک) iPhone 15 Pro | حافظه 512 گیگابایت", main_image: `${IMG}0B/ur/0BurK8yyhf1A3lmO.webp`, lowest_price: 72_400_000 },
];

const STORES = [
  { id: "s1", name: "نیورا نیکین", building: "پاساژ علاالدین ۲", floor: 4, distance_km: 1.2, opening: { state: "open" }, badges: { nearest: true, cheapest: false } },
  { id: "s2", name: "فرورا رویس", building: "پاساژ علاالدین ۲", floor: 6, distance_km: 1.3, opening: { state: "open" }, badges: { nearest: false, cheapest: true } },
  { id: "s3", name: "روین فریسا", building: "پاساژ میخک", floor: 1, distance_km: 3.8, opening: { state: "closed" }, badges: { nearest: false, cheapest: false } },
];

const SEARCH_ARGS = { query: "آیفون ۱۵ پرو", max_price: 90_000_000 };

const SEARCH_RUNNING: StepView = { id: "t1", tool: "search_products", status: "running", args: SEARCH_ARGS, ui: null };

const SEARCH_DONE: StepView = {
  ...SEARCH_RUNNING,
  status: "done",
  ui: { type: "product_list", query: "آیفون ۱۵ پرو", total: 24, products: PRODUCTS },
};

const STORES_ARGS = { product_id: "p1", open_now: true, installment: true };

const STORES_RUNNING: StepView = { id: "t2", tool: "find_stores", status: "running", args: STORES_ARGS, ui: null };

const STORES_DONE: StepView = {
  ...STORES_RUNNING,
  status: "done",
  ui: { type: "store_list", product_id: "p1", total: 3, stores: STORES },
};

const COMPARE_RUNNING: StepView = {
  id: "t3",
  tool: "compare_stores",
  status: "running",
  args: { product_id: "p1", shop_ids: ["s1", "s2", "s3"] },
  ui: null,
};

const COMPARE_DONE: StepView = {
  ...COMPARE_RUNNING,
  status: "done",
  ui: { type: "store_comparison", product_id: "p1", stores: STORES },
};

const EXPLORE_RUNNING: StepView = {
  id: "t4",
  tool: "explore_category",
  status: "running",
  args: { category: "لپ تاپ", max_price: 60_000_000 },
  ui: null,
};

const EXPLORE_DONE: StepView = {
  ...EXPLORE_RUNNING,
  status: "done",
  ui: {
    type: "category_overview",
    query: "لپ تاپ",
    product_count: 1840,
    top_brands: ["ایسوس", "لنوو", "اچ پی", "اپل", "ایسر"],
  },
};

const ALTERNATIVES_DONE: StepView = {
  id: "t5",
  tool: "find_alternatives",
  status: "done",
  args: { product_id: "p1", max_price: 65_000_000 },
  ui: { type: "alternatives", original: PRODUCTS[0], alternatives: PRODUCTS.slice(2) },
};

const DETAILS_FAILED: StepView = {
  id: "t6",
  tool: "get_store_details",
  status: "failed",
  args: { shop_id: "s1" },
  ui: null,
};

const ANSWER =
  "آیفون ۱۵ پرو مکس ۲۵۶ گیگابایت را در ۳ فروشگاه نزدیک شما پیدا کردم. نزدیک‌ترین، «نیورا نیکین» در پاساژ علاالدین ۲، طبقه‌ی ۴، واحد ۴۲۶ است؛ فقط ۱٫۲ کیلومتر با شما فاصله دارد، الان باز است و خرید قسطی هم دارد. قیمت ثبت‌شده‌اش ۸۴٫۵ میلیون تومان است که ۳ روز پیش به‌روز شده، پس پیشنهاد می‌کنم قبل از رفتن یک تماس بگیرید تا از موجودی مطمئن شوید.";
