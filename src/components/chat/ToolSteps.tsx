import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  FileText,
  LayoutGrid,
  MapPin,
  Scale,
  Search,
  Shuffle,
  Store,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Orb, type OrbLook } from "@/components/ui/thinking-orbs";
import { ShimmerText } from "@/components/chat/AgentStatus";
import { cn } from "@/lib/cn";
import { faNumber, formatDistance, formatToman } from "@/lib/format";

/** One tool call, as the chat keeps it. `args` come from tool_start, `ui` from tool_end. */
export type StepView = {
  id: string;
  tool: string;
  status: "running" | "done" | "failed";
  args?: Record<string, unknown>;
  ui: Record<string, unknown> | null;
};

type ToolMeta = { running: string; label: string; icon: LucideIcon };

/** Every tool call spins the same orb. */
const TOOL_LOOK: OrbLook = { state: "background", variant: "spiral" };

/** Each tool's words while running and once done, and its icon. */
const TOOLS: Record<string, ToolMeta> = {
  explore_category: {
    running: "در حال بررسی دسته‌بندی",
    label: "بررسی دسته‌بندی",
    icon: LayoutGrid,
  },
  search_products: {
    running: "در حال جستجوی محصولات",
    label: "جستجوی محصولات",
    icon: Search,
  },
  get_product_details: {
    running: "در حال خواندن مشخصات محصول",
    label: "مشخصات محصول",
    icon: FileText,
  },
  compare_products: {
    running: "در حال مقایسه‌ی محصولات",
    label: "مقایسه‌ی محصولات",
    icon: Scale,
  },
  find_alternatives: {
    running: "در حال پیدا کردن جایگزین‌ها",
    label: "جایگزین‌ها",
    icon: Shuffle,
  },
  find_stores: {
    running: "در حال پیدا کردن فروشگاه‌های نزدیک",
    label: "فروشگاه‌های نزدیک",
    icon: MapPin,
  },
  find_stores_by_category: {
    running: "در حال پیدا کردن فروشگاه‌های این دسته",
    label: "فروشگاه‌های این دسته",
    icon: Store,
  },
  get_store_details: {
    running: "در حال گرفتن اطلاعات فروشگاه",
    label: "اطلاعات فروشگاه",
    icon: Store,
  },
  compare_stores: {
    running: "در حال مقایسه‌ی فروشگاه‌ها",
    label: "مقایسه‌ی فروشگاه‌ها",
    icon: Scale,
  },
};

const UNKNOWN_TOOL: ToolMeta = {
  running: "در حال کار",
  label: "ابزار",
  icon: Wrench,
};

const metaOf = (tool: string) => TOOLS[tool] ?? UNKNOWN_TOOL;

/**
 * The agent's tool calls as a small timeline. The running one has its orb and a shimmer;
 * finished ones show what they found. `collapsible` folds a finished list into one line.
 */
export function ToolSteps({
  steps,
  collapsible = false,
  className,
}: {
  steps: StepView[];
  collapsible?: boolean;
  className?: string;
}) {
  const names = useMemo(() => namesFrom(steps), [steps]);
  const finished = steps.every((s) => s.status !== "running");
  const folds = collapsible && finished;
  const [open, setOpen] = useState(false);

  if (steps.length === 0) return null;

  const list = (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <StepRow key={step.id} step={step} names={names} last={i === steps.length - 1} />
      ))}
    </ol>
  );

  if (!folds) return <div className={className}>{list}</div>;

  const tools = [...new Set(steps.map((s) => s.tool))].slice(0, 4);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-fit cursor-pointer items-center gap-2.5 text-[13px] text-dust transition-colors hover:text-bone"
      >
        <span className="flex -space-x-1">
          {tools.map((tool) => {
            const Icon = metaOf(tool).icon;
            return (
              <span
                key={tool}
                className="grid size-[22px] place-items-center rounded-full bg-ash text-dust ring-2 ring-ink"
              >
                <Icon className="size-3" />
              </span>
            );
          })}
        </span>
        {faNumber(steps.length)} مرحله انجام شد
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {list}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepRow({ step, names, last }: { step: StepView; names: Names; last: boolean }) {
  const meta = metaOf(step.tool);
  const running = step.status === "running";
  const result = step.status === "done" ? summarize(step.ui, names) : null;
  const failed = step.status === "failed" || result?.failed;
  const chips = running ? argChips(step.args ?? {}, names) : (result?.tags ?? []);
  const Icon = meta.icon;

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-3"
    >
      {/* the thread connecting this step to the next */}
      {!last && (
        <span aria-hidden className="absolute start-[19.5px] top-[42px] -bottom-3 w-px bg-white/[0.07]" />
      )}

      <span className="grid size-10 shrink-0 place-items-center">
        {running ? (
          <Orb {...TOOL_LOOK} size={40} className="text-brand" />
        ) : failed ? (
          <span className="grid size-[26px] place-items-center rounded-full bg-brand/15 text-brand">
            <X className="size-3.5" />
          </span>
        ) : (
          <span className="grid size-[26px] place-items-center rounded-full bg-white/[0.06] text-dust">
            <Icon className="size-3.5" />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm leading-10">
          {running ? (
            <ShimmerText text={`${meta.running}…`} className="font-medium" />
          ) : (
            <span className={cn(failed ? "text-dust/70" : "text-dust")}>{meta.label}</span>
          )}
          {result?.text && <span className="text-[13px] text-faint">· {result.text}</span>}
          {step.status === "failed" && <span className="text-[13px] text-brand/80">· انجام نشد</span>}
        </div>

        {chips.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="max-w-[240px] truncate rounded-full glass px-2.5 py-0.5 text-[11px] leading-5 text-dust"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {result && result.images.length > 0 && <Thumbs images={result.images} more={result.more} />}
      </div>
    </motion.li>
  );
}

/** Product photos, overlapping, with "+N" for the rest. Torob's photos are on white. */
function Thumbs({ images, more }: { images: string[]; more: number }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex -space-x-2.5">
        {images.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            className="size-9 rounded-xl bg-white object-contain p-0.5 ring-2 ring-ink"
          />
        ))}
      </div>
      {more > 0 && <span className="text-xs text-faint">+{faNumber(more)}</span>}
    </div>
  );
}

// ─── reading the tool data ────────────────────────────────────────────

type Row = Record<string, unknown>;
type Names = Map<string, string>;

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) => (typeof v === "number" ? v : null);

/** "گوشی اپل iPhone 15 Pro | حافظه 256 گیگابایت" → "گوشی اپل iPhone 15 Pro" */
const shortTitle = (title: string) => title.split(" | ")[0];

/** Product and store names from every result so far, so a later step can say "فروشگاه‌های «iPhone 15»". */
function namesFrom(steps: StepView[]): Names {
  const names: Names = new Map();
  const add = (row: Row | null | undefined) => {
    const id = str(row?.id);
    const name = str(row?.persian_title) ?? str(row?.name);
    if (id && name) names.set(id, shortTitle(name));
  };
  for (const { ui } of steps) {
    if (!ui) continue;
    add(ui);
    add(ui.original as Row | undefined);
    add(ui.product as Row | undefined); // store results name the product they're about
    for (const key of ["products", "alternatives", "stores"]) rows(ui[key]).forEach(add);
  }
  return names;
}

/** What the agent asked the tool for, as short chips. */
function argChips(args: Row, names: Names): string[] {
  const chips: string[] = [];
  const query = str(args.query);
  if (query) chips.push(`«${query}»`);
  for (const key of ["category", "brand"]) {
    const value = str(args[key]);
    if (value) chips.push(value);
  }
  const product = str(args.product_id);
  if (product && names.has(product)) chips.push(names.get(product)!);
  const shop = str(args.shop_id);
  if (shop && names.has(shop)) chips.push(names.get(shop)!);
  if (Array.isArray(args.product_ids)) chips.push(`${faNumber(args.product_ids.length)} محصول`);
  if (Array.isArray(args.shop_ids)) chips.push(`${faNumber(args.shop_ids.length)} فروشگاه`);
  const min = num(args.min_price);
  const max = num(args.max_price);
  if (min) chips.push(`از ${formatToman(min)}`);
  if (max) chips.push(`تا ${formatToman(max)}`);
  const radius = num(args.radius_km);
  if (radius) chips.push(`تا ${formatDistance(radius)}`);
  if (args.open_now) chips.push("الان باز است");
  if (args.installment) chips.push("خرید قسطی");
  if (args.torob_pay) chips.push("ترب‌پی");
  const page = num(args.page);
  if (page && page > 1) chips.push(`صفحه‌ی ${faNumber(page)}`);
  return chips;
}

type Summary = { text: string | null; tags: string[]; images: string[]; more: number; failed?: boolean };

const MAX_THUMBS = 4;

function photos(list: Row[], total = list.length) {
  const images = list.map((p) => str(p.main_image)).filter((s): s is string => !!s);
  const shown = images.slice(0, MAX_THUMBS);
  return { images: shown, more: Math.max(0, total - shown.length) };
}

/** The photo of the product a store result is about. */
function productPhoto(ui: Row) {
  const product = ui.product as Row | null | undefined;
  return product ? photos([product]) : { images: [], more: 0 };
}

/** One line about what the tool found, plus photos or tags. */
function summarize(ui: Row | null, names: Names): Summary {
  const none: Summary = { text: null, tags: [], images: [], more: 0 };
  if (!ui) return none;

  switch (ui.type) {
    case "product_list": {
      const total = num(ui.total) ?? 0;
      const query = str(ui.query);
      return {
        ...none,
        text: `${query ? `«${query}» · ` : ""}${faNumber(total)} نتیجه`,
        ...photos(rows(ui.products), total),
      };
    }
    case "category_overview":
      return {
        ...none,
        text: `${faNumber(num(ui.product_count) ?? 0)} محصول`,
        tags: (Array.isArray(ui.top_brands) ? (ui.top_brands as string[]) : []).slice(0, 4),
      };
    case "product_details":
      return {
        ...none,
        text: shortTitle(str(ui.persian_title) ?? ""),
        ...photos([ui]),
      };
    case "product_comparison":
      return { ...none, text: `${faNumber(rows(ui.products).length)} محصول`, ...photos(rows(ui.products)) };
    case "alternatives": {
      const list = rows(ui.alternatives);
      return { ...none, text: `${faNumber(list.length)} گزینه‌ی مشابه`, ...photos(list) };
    }
    case "store_list": {
      const stores = rows(ui.stores);
      const distances = stores.map((s) => num(s.distance_km)).filter((d): d is number => d !== null);
      const open = stores.filter((s) => (s.opening as Row | undefined)?.state === "open").length;
      const tags: string[] = [];
      if (distances.length) tags.push(`نزدیک‌ترین: ${formatDistance(Math.min(...distances))}`);
      if (open) tags.push(`${faNumber(open)} فروشگاه باز`);
      return {
        ...none,
        text: `${faNumber(num(ui.total) ?? stores.length)} فروشگاه`,
        tags,
        ...productPhoto(ui),
      };
    }
    case "store_details": {
      const where = [str(ui.building), num(ui.floor) !== null ? `طبقه‌ی ${faNumber(num(ui.floor)!)}` : null]
        .filter(Boolean)
        .join("، ");
      return { ...none, text: str(ui.name), tags: where ? [where] : [] };
    }
    case "store_comparison": {
      const stores = rows(ui.stores);
      const winner = (badge: string) =>
        stores.find((s) => (s.badges as Row | undefined)?.[badge]);
      const tags: string[] = [];
      const cheapest = winner("cheapest");
      const nearest = winner("nearest");
      if (cheapest) tags.push(`ارزان‌ترین: ${names.get(str(cheapest.id) ?? "") ?? str(cheapest.name)}`);
      if (nearest) tags.push(`نزدیک‌ترین: ${names.get(str(nearest.id) ?? "") ?? str(nearest.name)}`);
      return { ...none, text: `${faNumber(stores.length)} فروشگاه`, tags, ...productPhoto(ui) };
    }
    case "error":
      return { ...none, text: "چیزی پیدا نشد", failed: true };
    default:
      return none;
  }
}
