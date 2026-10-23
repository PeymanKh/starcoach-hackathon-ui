import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  BadgeCheck,
  Check,
  Clock,
  CreditCard,
  History,
  MapPin,
  Phone,
  PhoneCall,
  ShieldCheck,
  TriangleAlert,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { faDigits, faNumber, formatDaysAgo, formatDistance, formatPhone, formatToman } from "@/lib/format";

/** A store as find_stores / compare_stores return it (see _store_card in the backend). */
export type StoreCardData = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance_km?: number | null;
  address?: string | null;
  building?: string | null;
  floor?: number | null;
  unit?: string | null;
  opening?: Opening;
  payments?: { provider: string; channel: string }[];
  fast_delivery?: boolean | null;
  phone?: string | null;
  /** Only when the store is about a product */
  price?: {
    min: number | null;
    max: number | null;
    freshness?: { label: string; days_ago: number | null };
  };
  /** compare_stores only */
  warranties?: string[];
  badges?: { cheapest?: boolean; nearest?: boolean; open_now?: boolean; same_mall_as_others?: boolean };
};

/** What a call found out: replaces the listed price with a confirmed one. */
export type VerifiedPrice = { price: number | null; inStock: boolean };

/**
 * How far to trust the listed price. Most prices in the data are weeks or months old, so this
 * decides the card's main action: go (map) when it's trustworthy, ask (call) when it isn't.
 */
export type Reliability = "verified" | "fresh" | "recent" | "old" | "stale";

export function reliabilityOf(price: StoreCardData["price"], verified?: VerifiedPrice): Reliability {
  if (verified) return "verified";
  if (!price?.min) return "stale";
  switch (price.freshness?.label) {
    case "fresh":
      return "fresh";
    case "recent":
      return "recent";
    case "old":
      return "old";
    default:
      return "stale"; // very_old, unknown
  }
}

type Opening =
  | { state: "open"; closes_at: string; minutes_to_close: number }
  | { state: "closed"; opens_day: string; opens_at: string; opens_today: boolean }
  | { state: "unknown" };

/** Opening the store's spot in Iran's map apps. Both formats checked against the live sites. */
const mapLinks = (lat: number, lon: number) => ({
  neshan: `https://nshn.ir/?lat=${lat}&lng=${lon}`,
  balad: `https://balad.ir/location?latitude=${lat}&longitude=${lon}&zoom=17`,
});

/**
 * One physical store: where it is (down to floor and unit inside the mall), whether it's open,
 * its price for the product and how old that price is, how you can pay, and the way there.
 */
export function StoreCard({
  store,
  index = 0,
  verified,
  onCall,
}: {
  store: StoreCardData;
  index?: number;
  verified?: VerifiedPrice;
  /** Opens the call options; without it (or a phone number) there's no call button */
  onCall?: (store: StoreCardData) => void;
}) {
  const links = mapLinks(store.lat, store.lon);
  const where = placeInBuilding(store);
  const reliability = store.price ? reliabilityOf(store.price, verified) : null;
  // Only a fresh (or call-confirmed) price is safe; anything older is worth a call before going.
  const askFirst =
    !!onCall && !!store.phone && (reliability === "recent" || reliability === "old" || reliability === "stale");

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-colors hover:border-white/[0.12]"
    >
      <div className="p-4">
        {/* name, opening, distance */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg font-bold text-bone"
          >
            {store.name.trim().charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-7 text-bone">{store.name}</h3>
            <OpeningLine opening={store.opening} />
          </div>
          {store.distance_km != null && (
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-bone">
              {formatDistance(store.distance_km)}
            </span>
          )}
        </div>

        {store.badges && <WinnerBadges badges={store.badges} />}

        {/* where exactly: the mall, floor and unit first, the street address under it */}
        {(where || store.address) && (
          <div className="mt-3.5 flex gap-2.5">
            <MapPin className="mt-1 size-4 shrink-0 text-faint" />
            <div className="min-w-0">
              {where && <p className="text-[14px] font-medium leading-6 text-bone">{where}</p>}
              {store.address && (
                <p className={cn("line-clamp-2 text-[12px] leading-5 text-faint", !where && "text-[13px] text-dust")}>
                  {faDigits(store.address)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* contact: always shown. The number dials directly; "تماس" offers the agent's call too. */}
        {store.phone && (
          <div className="mt-2.5 flex items-center gap-2.5">
            <Phone className="size-4 shrink-0 text-faint" />
            <a
              href={`tel:${store.phone}`}
              dir="ltr"
              className="text-[14px] font-medium tabular-nums text-bone transition-colors hover:text-brand-1"
            >
              {formatPhone(store.phone)}
            </a>
            {onCall && !askFirst && reliability !== "verified" && (
              <button
                type="button"
                onClick={() => onCall(store)}
                className="ms-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-bone transition-colors hover:bg-white/10"
              >
                <PhoneCall className="size-3.5" />
                تماس
              </button>
            )}
          </div>
        )}

        {store.price && reliability && (
          <PriceRow price={store.price} reliability={reliability} verified={verified} />
        )}

        <Extras store={store} />
      </div>

      {askFirst && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onCall!(store)}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-1"
          >
            <PhoneCall className="size-4" />
            استعلام قیمت و موجودی
          </button>
        </div>
      )}

      {/* the way there */}
      <div className="flex border-t border-white/[0.06]">
        <MapButton href={links.neshan} logo="/maps/neshan.png" label="باز کردن در نشان" />
        <span aria-hidden className="w-px bg-white/[0.06]" />
        <MapButton href={links.balad} logo="/maps/balad.png" label="باز کردن در بلد" />
      </div>
    </motion.article>
  );
}

/** Several stores, nearest (or cheapest) first, as the tool sorted them. */
export function StoreList({
  stores,
  verified = {},
  onCall,
}: {
  stores: StoreCardData[];
  /** Prices confirmed by a call, by store id */
  verified?: Record<string, VerifiedPrice>;
  onCall?: (store: StoreCardData) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {stores.map((store, i) => (
        <StoreCard key={store.id} store={store} index={i} verified={verified[store.id]} onCall={onCall} />
      ))}
    </div>
  );
}

// ─── pieces ───────────────────────────────────────────────────────────

const DAYS: Record<string, string> = {
  sat: "شنبه",
  sun: "یکشنبه",
  mon: "دوشنبه",
  tue: "سه‌شنبه",
  wed: "چهارشنبه",
  thu: "پنجشنبه",
  fri: "جمعه",
};

/** Closing within the hour gets a warning: the user may not make it. */
const CLOSING_SOON_MIN = 60;

function OpeningLine({ opening }: { opening?: Opening }) {
  let dot = "bg-faint";
  let text = "ساعت کاری ثبت نشده";
  let tone = "text-faint";

  if (opening?.state === "open") {
    const soon = opening.minutes_to_close <= CLOSING_SOON_MIN;
    dot = soon ? "bg-amber-400" : "bg-emerald-400";
    tone = soon ? "text-amber-300" : "text-dust";
    text = soon
      ? `باز است · ${faNumber(opening.minutes_to_close)} دقیقه‌ی دیگر می‌بندد`
      : `باز است · تا ${faDigits(opening.closes_at)}`;
  } else if (opening?.state === "closed") {
    dot = "bg-brand";
    const when = opening.opens_today ? "امروز" : (DAYS[opening.opens_day] ?? "");
    text = `بسته است · ${when} ساعت ${faDigits(opening.opens_at)} باز می‌شود`;
    tone = "text-dust";
  }

  return (
    <p className={cn("flex items-start gap-1.5 text-[12px] leading-5", tone)}>
      <span aria-hidden className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", dot)} />
      {text}
    </p>
  );
}

/** "پاساژ علاالدین ۲ · طبقه‌ی ۴ · واحد ۴۲۶" */
function placeInBuilding(store: StoreCardData) {
  const parts: string[] = [];
  if (store.building) parts.push(faDigits(store.building));
  if (store.floor != null) {
    parts.push(
      store.floor === 0
        ? "همکف"
        : store.floor < 0
          ? `زیرزمین ${faNumber(-store.floor)}`
          : `طبقه‌ی ${faNumber(store.floor)}`,
    );
  }
  // "426" → "۴۲۶", but a code like "B12" stays as written
  if (store.unit) parts.push(`واحد ${/^\d+$/.test(store.unit) ? faDigits(store.unit) : store.unit}`);
  return parts.join(" · ");
}

/** Each reliability level: its icon, colors, and what it tells the user. */
const TIERS: Record<
  Reliability,
  { icon: LucideIcon; chip: string; label: (ago: string | null) => string; hint?: string; dim?: boolean }
> = {
  verified: {
    icon: PhoneCall,
    chip: "bg-emerald-400/10 text-emerald-300",
    label: () => "تأیید شده با تماس · همین الان",
  },
  fresh: {
    icon: Check,
    chip: "bg-emerald-400/10 text-emerald-300",
    label: (ago) => `قیمت به‌روز · ${ago}`,
  },
  recent: {
    icon: Clock,
    chip: "bg-white/[0.06] text-dust",
    label: (ago) => `احتمالاً کمی تغییر کرده · ${ago}`,
    hint: "ممکن است کمی عوض شده باشد؛ بهتر است قبل از رفتن بپرسید.",
  },
  old: {
    icon: History,
    chip: "bg-amber-400/10 text-amber-300",
    label: (ago) => `قیمت قدیمی · ${ago}`,
    hint: "این قیمت چند ماه است عوض نشده؛ قبل از رفتن بپرسید.",
  },
  stale: {
    icon: TriangleAlert,
    chip: "bg-brand/12 text-brand-1",
    label: (ago) => (ago ? `قیمت نامعتبر · ${ago}` : "تاریخ قیمت نامشخص"),
    hint: "به این قیمت نمی‌شود اعتماد کرد؛ حتماً استعلام بگیرید.",
    dim: true,
  },
};

/** The price, and honestly how far to trust it. */
function PriceRow({
  price,
  reliability,
  verified,
}: {
  price: NonNullable<StoreCardData["price"]>;
  reliability: Reliability;
  verified?: VerifiedPrice;
}) {
  const tier = TIERS[reliability];
  const days = price.freshness?.days_ago;
  const Icon = tier.icon;

  if (!verified && !price.min) {
    return (
      <div className="mt-3.5 rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-dust">
        قیمت ثبت نشده؛ قبل از رفتن استعلام بگیرید
      </div>
    );
  }

  const low = verified ? verified.price : price.min;
  const high = verified ? null : price.max;
  const range = !!low && !!high && high > low;

  return (
    <div
      className={cn(
        "mt-3.5 rounded-xl px-3 py-2.5",
        reliability === "verified" ? "bg-emerald-400/[0.06] ring-1 ring-emerald-400/15" : "bg-white/[0.04]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {low ? (
          <p className={cn("text-[15px] font-bold", tier.dim ? "text-dust" : "text-bone")}>
            {(range || tier.dim) && (
              <span className="text-[12px] font-normal text-faint">{tier.dim ? "حدود " : "از "}</span>
            )}
            {formatToman(low)}
            {range && <span className="text-[12px] font-normal text-faint"> تا {formatToman(high!)}</span>}
          </p>
        ) : (
          <p className="text-[13px] text-dust">قیمت ثبت نشده</p>
        )}
        <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", tier.chip)}>
          <Icon className="size-3" />
          {tier.label(days == null ? null : formatDaysAgo(days))}
        </span>
      </div>
      {verified && (
        <p className={cn("mt-1 text-[12px]", verified.inStock ? "text-emerald-300" : "text-brand-1")}>
          {verified.inStock ? "موجود است" : "فعلاً موجود نیست"}
        </p>
      )}
      {!verified && tier.hint && <p className="mt-1.5 text-[12px] leading-5 text-faint">{tier.hint}</p>}
    </div>
  );
}

/** Installments, fast delivery, warranty: only what this store actually has. */
function Extras({ store }: { store: StoreCardData }) {
  const providers = [...new Set((store.payments ?? []).map((p) => p.provider))];
  const chips: { icon: ReactNode; label: string }[] = [];
  if (providers.length) chips.push({ icon: <CreditCard />, label: `قسطی: ${providers.join("، ")}` });
  if (store.fast_delivery) chips.push({ icon: <Truck />, label: "ارسال فوری" });
  for (const warranty of store.warranties ?? []) {
    chips.push({ icon: <ShieldCheck />, label: `گارانتی ${faDigits(warranty)}` });
  }
  if (!chips.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[11px] text-dust [&_svg]:size-3"
        >
          {chip.icon}
          {chip.label}
        </span>
      ))}
    </div>
  );
}

/** compare_stores marks the winners. */
function WinnerBadges({ badges }: { badges: NonNullable<StoreCardData["badges"]> }) {
  const wins = [
    badges.cheapest && "ارزان‌ترین",
    badges.nearest && "نزدیک‌ترین",
    badges.same_mall_as_others && "هم‌پاساژ با بقیه",
  ].filter((w): w is string => !!w);
  if (!wins.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {wins.map((win) => (
        <span
          key={win}
          className="flex items-center gap-1 rounded-full bg-brand/12 px-2.5 py-1 text-[11px] font-medium text-brand-1"
        >
          <BadgeCheck className="size-3" />
          {win}
        </span>
      ))}
    </div>
  );
}

function MapButton({ href, logo, label }: { href: string; logo: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 flex-1 items-center justify-center gap-2 text-[12px] font-medium text-dust transition-colors hover:bg-white/[0.04] hover:text-bone"
    >
      <img src={logo} alt="" className="size-5 rounded-md object-contain" />
      {label}
    </a>
  );
}
