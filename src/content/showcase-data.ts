import type { StepView } from "@/components/chat/ToolSteps";
import type { ProductCardData } from "@/components/chat/ProductCard";
import type { StoreCardData } from "@/components/chat/StoreCard";

/**
 * Sample data for the product tour in the "agent architecture" popup, shaped exactly like the
 * real tool results so the real chat components render it.
 */

const IMG = "https://image.torob.com/base/images/";

const PRODUCTS = [
  { id: "p1", persian_title: "گوشی اپل iPhone 15 Pro Max (Active) | حافظه 256 گیگابایت", main_image: `${IMG}NN/3M/NN3MS8qa1mBg8n1U.webp`, lowest_price: 84_500_000 },
  { id: "p2", persian_title: "گوشی اپل دو سیم iPhone 15 Pro (Active) | حافظه 256 گیگابایت", main_image: `${IMG}u2/La/u2LaGEmnJNqzz-jy.webp`, lowest_price: 76_900_000 },
  { id: "p3", persian_title: "گوشی اپل iPhone 15 (Not Active) | حافظه 128 گیگابایت", main_image: `${IMG}A6/E2/A6E2FBRKwSXwO8uz.jpg`, lowest_price: 52_300_000 },
  { id: "p4", persian_title: "گوشی اپل دو سیم (استوک) iPhone 15 Pro | حافظه 256 گیگابایت", main_image: `${IMG}XK/Rm/XKRmbGJz1MWsW4nm.webp`, lowest_price: 61_000_000 },
  { id: "p5", persian_title: "گوشی اپل دو سیم iPhone 15 (Not Active) | حافظه 128 گیگابایت", main_image: `${IMG}c1/c3/c1c30z4aSt4bzZVS.jpg`, lowest_price: 55_800_000 },
  { id: "p6", persian_title: "گوشی اپل (استوک) iPhone 15 Pro | حافظه 512 گیگابایت", main_image: `${IMG}0B/ur/0BurK8yyhf1A3lmO.webp`, lowest_price: 72_400_000 },
];

export const CARD_PRODUCTS: ProductCardData[] = PRODUCTS.map((p, i) => ({
  ...p,
  brand_name: "اپل",
  category_name: "گوشی موبایل",
  highest_price: [92_000_000, 81_500_000, 52_300_000, 66_000_000, 58_900_000, 79_000_000][i],
  seller_count: [12, 7, 1, 4, 3, 2][i],
}));

/** No store sells it: "alternatives" becomes the main action. */
export const NO_SELLER_PRODUCT: ProductCardData = {
  id: "np",
  persian_title: "گوشی سامسونگ Galaxy S24 Ultra 5G (ویتنام) دو سیم کارت | حافظه 512 گیگابایت رم 12 گیگابایت",
  brand_name: null,
  category_name: "گوشی موبایل",
  main_image: `${IMG}0B/ur/0BurK8yyhf1A3lmO.webp`,
  lowest_price: null,
  highest_price: null,
  seller_count: 0,
};

export const NO_IMAGE_PRODUCT: ProductCardData = {
  id: "ni",
  persian_title: "هدفون بی سیم شیائومی Redmi Buds 6 Active",
  category_name: "هدفون، هدست و هندزفری",
  main_image: null,
  lowest_price: 1_450_000,
  highest_price: 1_450_000,
  seller_count: 5,
};

export const MARKDOWN_SAMPLE = `بین این دو تا، فرق اصلی **دوربین و اندازه**ست:

| | iPhone 15 Pro Max | iPhone 15 Pro |
|---|---|---|
| صفحه | ۶٫۷ اینچ | ۶٫۱ اینچ |
| زوم دوربین | **۵ برابر** | ۳ برابر |
| باتری | یه روز کامل | کمی کمتر |
| شروع قیمت | ۸۴ و نیم میلیون | ۷۷ میلیون |

اگه عکاسی برات مهمه، **پرو مکس** می‌ارزه:
- زوم ۵ برابر برای عکس از دور
- باتری بیشتر برای یه روز بیرون بودن

قبل از رفتن:
1. با دکمه‌ی استعلام، قیمت امروز رو بپرس
2. طبقه و واحد رو از کارت ببین
3. اگه قسطی می‌خوای، ترب‌پی رو چک کن`;

// ─── stores ───────────────────────────────────────────────────────────

const AGO = (days: number) => ({
  label: days <= 10 ? "fresh" : days <= 30 ? "recent" : days <= 180 ? "old" : "very_old",
  days_ago: days,
});

const NIKIN: StoreCardData = {
  id: "s1",
  name: "نیورا نیکین",
  lat: 35.6889,
  lon: 51.4174,
  distance_km: 1.2,
  address: "تهران، خیابان جمهوری، نرسیده به چهارراه شیخ هادی",
  building: "پاساژ علاالدین 2",
  floor: 4,
  unit: "426",
  phone: "02126467180",
  opening: { state: "open", closes_at: "21:00", minutes_to_close: 250 },
  payments: [{ provider: "ترب پی", channel: "in_person" }, { provider: "اسنپ پی", channel: "in_person" }],
  fast_delivery: true,
  price: { min: 84_500_000, max: 84_500_000, freshness: AGO(3) },
};

const ROYCE: StoreCardData = {
  id: "s2",
  name: "فرورا رویس",
  lat: 35.689,
  lon: 51.4172,
  distance_km: 1.3,
  address: "تهران، خیابان جمهوری، پاساژ علاالدین",
  building: "پاساژ علاالدین 2",
  floor: 6,
  unit: "622",
  phone: "02176557624",
  opening: { state: "closed", opens_day: "sat", opens_at: "16:00", opens_today: true },
  payments: [{ provider: "ترب پی", channel: "in_person" }],
  price: { min: 82_900_000, max: 86_000_000, freshness: AGO(19) },
};

const FRISA: StoreCardData = {
  id: "s3",
  name: "روین فریسا",
  lat: 35.7425,
  lon: 51.4361,
  distance_km: 3.8,
  address: "تهران، خیابان شریعتی، بالاتر از پل رومی",
  building: "پاساژ میخک",
  floor: 1,
  unit: "40",
  phone: "09396925523",
  opening: { state: "unknown" },
  price: { min: 79_000_000, max: 79_000_000, freshness: AGO(64) },
};

const ARIA: StoreCardData = {
  id: "s4",
  name: "تک‌موبایل آریا",
  lat: 35.6831,
  lon: 51.4206,
  distance_km: 2.4,
  address: "تهران، خیابان ولیعصر، نرسیده به میدان منیریه",
  building: "پاساژ چارسو",
  floor: -1,
  unit: "18",
  phone: "09370317595",
  opening: { state: "open", closes_at: "20:30", minutes_to_close: 35 },
  payments: [{ provider: "ترب پی", channel: "in_person" }],
  price: { min: 61_000_000, max: 61_000_000, freshness: AGO(240) },
};

export const CALL_PRODUCT = "آیفون ۱۵ پرو مکس ۲۵۶ گیگ";

/** The same kind of store at each level of price trust, for the tier switcher. */
export const TIER_STORES = {
  fresh: NIKIN,
  recent: { ...ROYCE, id: "t-recent" },
  old: { ...FRISA, id: "t-old" },
  stale: { ...ARIA, id: "t-stale" },
} satisfies Record<string, StoreCardData>;

export const COMPARED_STORES: StoreCardData[] = [
  { ...ROYCE, id: "c1", phone: null, warranties: ["شرکتی (18 ماه)"], badges: { cheapest: true, same_mall_as_others: true } },
  { ...NIKIN, id: "c2", phone: null, warranties: ["آواژنگ (18 ماه)"], badges: { nearest: true, open_now: true, same_mall_as_others: true } },
];

export const REPLAY_STORE: StoreCardData = { ...NIKIN, id: "replay" };

// ─── tool steps ───────────────────────────────────────────────────────

const STEP_STORES = [
  { id: "s1", name: "نیورا نیکین", building: "پاساژ علاالدین ۲", floor: 4, distance_km: 1.2, opening: { state: "open" }, badges: { nearest: true, cheapest: false } },
  { id: "s2", name: "فرورا رویس", building: "پاساژ علاالدین ۲", floor: 6, distance_km: 1.3, opening: { state: "open" }, badges: { nearest: false, cheapest: true } },
  { id: "s3", name: "روین فریسا", building: "پاساژ میخک", floor: 1, distance_km: 3.8, opening: { state: "closed" }, badges: { nearest: false, cheapest: false } },
];

export const SEARCH_RUNNING: StepView = {
  id: "t1",
  tool: "search_products",
  status: "running",
  args: { query: "آیفون ۱۵ پرو مکس", max_price: 90_000_000 },
  ui: null,
};

export const SEARCH_DONE: StepView = {
  ...SEARCH_RUNNING,
  status: "done",
  ui: { type: "product_list", query: "آیفون ۱۵ پرو مکس", total: 24, products: PRODUCTS },
};

export const STORES_RUNNING: StepView = {
  id: "t2",
  tool: "find_stores",
  status: "running",
  args: { product_id: "p1", open_now: true, installment: true },
  ui: null,
};

export const STORES_DONE: StepView = {
  ...STORES_RUNNING,
  status: "done",
  ui: { type: "store_list", product_id: "p1", total: 3, stores: STEP_STORES },
};

export const COMPARE_DONE: StepView = {
  id: "t3",
  tool: "compare_stores",
  status: "done",
  args: { product_id: "p1", shop_ids: ["s1", "s2", "s3"] },
  ui: { type: "store_comparison", product_id: "p1", stores: STEP_STORES },
};

export const DETAILS_FAILED: StepView = {
  id: "t6",
  tool: "get_store_details",
  status: "failed",
  args: { shop_id: "s1" },
  ui: null,
};

// ─── the replayed conversation ────────────────────────────────────────

export const REPLAY_QUESTION = "آیفون ۱۵ پرو مکس می‌خوام، نزدیک خودم و قسطی";

export const REPLAY_BEFORE =
  "پیداش کردم! نزدیک‌ترین فروشگاهی که این گوشی رو **قسطی** میده «نیورا نیکین»ه؛ فقط ۱٫۲ کیلومتر باهات فاصله داره و الان هم بازه:";

export const REPLAY_AFTER =
  "قیمتش ۳ روز پیش به‌روز شده، پس می‌تونی با خیال راحت بری. اگه بخوای، با بقیه‌ی فروشگاه‌های اطراف هم مقایسه‌ش می‌کنم.";
