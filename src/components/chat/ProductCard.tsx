import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Package, Shuffle, Store } from "lucide-react";
import { cn } from "@/lib/cn";
import { faNumber, formatToman } from "@/lib/format";

/** A product as the tools return it (search_products, find_alternatives, product_details…). */
export type ProductCardData = {
  id: string;
  persian_title: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  main_image?: string | null;
  lowest_price?: number | null;
  highest_price?: number | null;
  seller_count?: number | null;
};

/** Sends a follow-up to the agent, e.g. "stores near me for this product". */
type Ask = (text: string) => void;

const storesQuestion = (name: string) => `فروشگاه‌های نزدیک من که «${name}» دارند`;
const alternativesQuestion = (name: string) => `جایگزین‌های «${name}» رو نشونم بده`;

/** "گوشی اپل iPhone 15 Pro | حافظه 256 گیگابایت" → name and variant */
function splitTitle(title: string | null) {
  const [name, ...rest] = (title ?? "محصول بدون نام").split(" | ");
  return { name, variant: rest.join(" · ") || null };
}

/**
 * One product, recommended in the answer: photo, name, variant, price range, sellers,
 * and the next steps (stores near me, alternatives).
 */
export function ProductCard({ product, onAsk }: { product: ProductCardData; onAsk?: Ask }) {
  const { name, variant } = splitTitle(product.persian_title);
  const meta = [product.brand_name, product.category_name].filter(Boolean).join(" · ");

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-colors hover:border-white/[0.12]"
    >
      <div className="flex gap-3.5 p-3">
        <ProductImage src={product.main_image} className="size-[104px] shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          {meta && <p className="truncate text-[11px] text-faint">{meta}</p>}
          <h3 className="mt-0.5 line-clamp-2 text-[14px] font-semibold leading-6 text-bone">{name}</h3>
          {variant && (
            <span className="mt-1 w-fit max-w-full truncate rounded-md bg-white/[0.06] px-1.5 py-px text-[11px] text-dust">
              {variant}
            </span>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-2">
            <Price low={product.lowest_price} high={product.highest_price} />
            <Sellers count={product.seller_count} />
          </div>
        </div>
      </div>

      {onAsk && (
        <div className="flex border-t border-white/[0.06]">
          {/* No store sells it: alternatives become the main way forward */}
          {product.seller_count ? (
            <>
              <CardAction
                icon={<MapPin />}
                label="فروشگاه‌های نزدیک"
                onClick={() => onAsk(storesQuestion(name))}
                primary
              />
              <span aria-hidden className="w-px bg-white/[0.06]" />
            </>
          ) : null}
          <CardAction
            icon={<Shuffle />}
            label="جایگزین‌ها"
            onClick={() => onAsk(alternativesQuestion(name))}
            primary={!product.seller_count}
          />
        </div>
      )}
    </motion.article>
  );
}

/** Several options side by side, swipeable: compact cards that each lead to their stores. */
export function ProductCarousel({ products, onAsk }: { products: ProductCardData[]; onAsk?: Ask }) {
  const ref = useRef<HTMLDivElement>(null);

  // Always start at the first card: the right edge, in Persian. Safari can snap a right-to-left
  // carousel to its far end on first layout (and again when cards stream in), so put it back
  // at the start, once now and once after Safari's own snapping has run.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = 0;
    const frame = requestAnimationFrame(() => {
      el.scrollLeft = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [products.length]);

  return (
    <div
      ref={ref}
      dir="rtl"
      className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 no-scrollbar sm:-mx-6 sm:scroll-px-6 sm:px-6">
      {products.map((product, i) => (
        <CompactProductCard key={product.id} product={product} index={i} onAsk={onAsk} />
      ))}
    </div>
  );
}

function CompactProductCard({
  product,
  index,
  onAsk,
}: {
  product: ProductCardData;
  index: number;
  onAsk?: Ask;
}) {
  const { name, variant } = splitTitle(product.persian_title);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-[196px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-colors hover:border-white/[0.12]"
    >
      <div className="p-2 pb-0">
        <ProductImage src={product.main_image} className="aspect-square w-full" />
      </div>
      <div className="flex flex-1 flex-col p-3 pt-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.7] text-bone">{name}</h3>
        {variant && <p className="mt-0.5 truncate text-[11px] text-faint">{variant}</p>}
        <div className="mt-auto pt-2.5">
          <Price low={product.lowest_price} high={product.highest_price} compact />
          <Sellers count={product.seller_count} className="mt-1" />
        </div>
      </div>
      {onAsk && (
        <div className="flex border-t border-white/[0.06]">
          {product.seller_count ? (
            <CardAction icon={<Store />} label="فروشگاه‌ها" onClick={() => onAsk(storesQuestion(name))} primary />
          ) : (
            <CardAction icon={<Shuffle />} label="جایگزین‌ها" onClick={() => onAsk(alternativesQuestion(name))} primary />
          )}
        </div>
      )}
    </motion.article>
  );
}

// ─── pieces ───────────────────────────────────────────────────────────

/** Torob's photos are on white, so the frame is white too. Falls back to an icon. */
function ProductImage({ src, className }: { src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid place-items-center rounded-xl bg-white/[0.05] text-faint", className)}>
        <Package className="size-7" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden rounded-xl bg-white p-2", className)}>
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </div>
  );
}

/** "۷۶٫۹ میلیون تومان", or "از ۷۶٫۹ تا ۸۴٫۵ میلیون تومان" when stores differ. */
function Price({
  low,
  high,
  compact = false,
}: {
  low?: number | null;
  high?: number | null;
  compact?: boolean;
}) {
  if (!low) return <p className="text-[13px] text-dust">قیمت ثبت نشده</p>;
  const range = high && high > low;
  return (
    <div className="leading-tight">
      {range && <p className="text-[11px] text-faint">از</p>}
      <p className={cn("font-bold text-bone", compact ? "text-[14px]" : "text-[15px]")}>
        {formatToman(low)}
      </p>
      {range && !compact && <p className="mt-0.5 text-[11px] text-faint">تا {formatToman(high)}</p>}
    </div>
  );
}

function Sellers({ count, className }: { count?: number | null; className?: string }) {
  if (!count) {
    return <span className={cn("text-[11px] text-faint", className)}>در فروشگاه‌های حضوری نیست</span>;
  }
  return (
    <span className={cn("flex items-center gap-1 text-[11px] text-dust", className)}>
      <Store className="size-3" />
      {faNumber(count)} فروشگاه
    </span>
  );
}

function CardAction({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 text-[12px] font-medium transition-colors",
        "[&_svg]:size-3.5",
        primary ? "text-brand-1 hover:bg-brand/10" : "text-dust hover:bg-white/[0.04] hover:text-bone",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
