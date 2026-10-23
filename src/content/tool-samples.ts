/**
 * One sample call per agent tool: the arguments the model sends and the JSON the tool returns.
 * Shapes match apps/agents/tools in the backend exactly; lists are cut to two items to stay short.
 */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type ToolSample = { args: Record<string, Json>; result: Json };

const IPHONE = {
  id: "8f2c41d09a7e",
  persian_title: "گوشی اپل iPhone 15 Pro Max (Active) | حافظه 256 گیگابایت",
  brand_name: "اپل",
  category_name: "گوشی موبایل",
  main_image: "https://image.torob.com/base/images/NN/3M/NN3MS8qa1mBg8n1U.webp",
  lowest_price: 84500000,
  highest_price: 92000000,
  seller_count: 12,
};

const IPHONE_PRO = {
  id: "3b9e07c15f2d",
  persian_title: "گوشی اپل دو سیم iPhone 15 Pro (Active) | حافظه 256 گیگابایت",
  brand_name: "اپل",
  category_name: "گوشی موبایل",
  main_image: "https://image.torob.com/base/images/u2/La/u2LaGEmnJNqzz-jy.webp",
  lowest_price: 76900000,
  highest_price: 81500000,
  seller_count: 7,
};

const STORE = {
  id: "a71d93e0c4b8",
  name: "نیورا نیکین",
  shop_type: "has_products",
  lat: 35.6889,
  lon: 51.4174,
  distance_km: 1.2,
  address: "تهران، خیابان جمهوری، نرسیده به چهارراه شیخ هادی",
  building: "پاساژ علاالدین 2",
  floor: 4,
  unit: "426",
  opening: { state: "open", closes_at: "21:00", minutes_to_close: 250 },
  payments: [{ provider: "ترب پی", channel: "in_person" }],
  fast_delivery: true,
  phone: "02126467180",
};

const STORE_2 = {
  id: "5c08f2a6d1e9",
  name: "فرورا رویس",
  shop_type: "has_products",
  lat: 35.689,
  lon: 51.4172,
  distance_km: 1.3,
  address: "تهران، خیابان جمهوری، پاساژ علاالدین",
  building: "پاساژ علاالدین 2",
  floor: 6,
  unit: "622",
  opening: { state: "closed", opens_day: "sat", opens_at: "16:00", opens_today: true },
  payments: [],
  fast_delivery: false,
  phone: "02176557624",
};

const PRODUCT_SUMMARY = { id: IPHONE.id, persian_title: IPHONE.persian_title, main_image: IPHONE.main_image };

export const TOOL_SAMPLES: Record<string, ToolSample> = {
  explore_category: {
    args: { category: "لپ تاپ", max_price: 60000000 },
    result: {
      type: "category_overview",
      query: "لپ تاپ",
      categories: [
        { category_name: "لپ تاپ و نوت بوک", products: 1840 },
        { category_name: "لپ تاپ استوک", products: 212 },
      ],
      product_count: 1468,
      price_bands: {
        budget: [18900000, 27500000],
        mid: [27500000, 41000000],
        premium: [41000000, 56800000],
      },
      top_brands: ["ایسوس", "لنوو", "اچ پی", "ایسر", "اپل"],
      important_specs: ["پردازنده", "حافظه RAM", "حافظه داخلی", "اندازه صفحه نمایش", "کارت گرافیک"],
    },
  },

  search_products: {
    args: { query: "آیفون ۱۵ پرو", max_price: 90000000 },
    result: {
      type: "product_list",
      query: "آیفون ۱۵ پرو",
      categories: [
        { category_name: "گوشی موبایل", products: 24 },
        { category_name: "قاب و کاور گوشی", products: 61 },
      ],
      total: 24,
      page: 1,
      page_size: 10,
      has_more: true,
      products: [IPHONE, IPHONE_PRO],
    },
  },

  get_product_details: {
    args: { product_id: IPHONE.id },
    result: {
      type: "product_details",
      ...IPHONE,
      model: "iPhone 15 Pro Max",
      image_urls: [IPHONE.main_image],
      specs: {
        "اندازه صفحه نمایش": "6.7 اینچ",
        "حافظه داخلی": "256 گیگابایت",
        "دوربین اصلی": "48 مگاپیکسل",
        "زوم اپتیکال": "5x",
      },
    },
  },

  compare_products: {
    args: { product_ids: [IPHONE.id, IPHONE_PRO.id] },
    result: {
      type: "product_comparison",
      products: [IPHONE, IPHONE_PRO],
      specs: [
        { key: "اندازه صفحه نمایش", values: ["6.7 اینچ", "6.1 اینچ"] },
        { key: "زوم اپتیکال", values: ["5x", "3x"] },
      ],
    },
  },

  find_alternatives: {
    args: { product_id: IPHONE.id, max_price: 80000000 },
    result: {
      type: "alternatives",
      original: IPHONE,
      alternatives: [IPHONE_PRO],
    },
  },

  find_stores: {
    args: { product_id: IPHONE.id, open_now: true, installment: true },
    result: {
      type: "store_list",
      product_id: IPHONE.id,
      product: PRODUCT_SUMMARY,
      total: 3,
      page: 1,
      page_size: 10,
      has_more: false,
      stores: [
        {
          ...STORE,
          price: {
            min: 84500000,
            max: 84500000,
            variant_count: 1,
            freshness: { label: "fresh", days_ago: 3, changed_at: "2026-10-20" },
          },
        },
      ],
    },
  },

  find_stores_by_category: {
    args: { category: "گوشی موبایل", open_now: true },
    result: {
      type: "store_list",
      category: "گوشی موبایل",
      total: 38,
      page: 1,
      page_size: 10,
      has_more: true,
      stores: [{ ...STORE, product_list_known: true }],
    },
  },

  get_store_details: {
    args: { shop_id: STORE.id },
    result: {
      type: "store_details",
      ...STORE,
      plaque: "426",
      location_label: "پاساژ علاالدین ۲، طبقه چهارم",
      website_url: null,
      instagram_url: null,
      weekly_hours: [
        { day: "sat", status: "declared", shifts: ["10:00-14:00", "16:00-21:00"] },
        { day: "fri", status: "closed", shifts: [] },
      ],
      categories: ["گوشی موبایل", "لوازم جانبی موبایل"],
      product_count: 312,
      stores_in_same_building: 148,
    },
  },

  compare_stores: {
    args: { product_id: IPHONE.id, shop_ids: [STORE.id, STORE_2.id] },
    result: {
      type: "store_comparison",
      product_id: IPHONE.id,
      product: PRODUCT_SUMMARY,
      stores: [
        {
          ...STORE,
          price: {
            min: 84500000,
            max: 84500000,
            variant_count: 1,
            freshness: { label: "fresh", days_ago: 3, changed_at: "2026-10-20" },
          },
          warranties: ["آواژنگ (18 ماه)"],
          badges: { cheapest: false, nearest: true, open_now: true, same_mall_as_others: true },
        },
        {
          ...STORE_2,
          price: {
            min: 82900000,
            max: 86000000,
            variant_count: 2,
            freshness: { label: "recent", days_ago: 19, changed_at: "2026-10-04" },
          },
          warranties: ["شرکتی (18 ماه)"],
          badges: { cheapest: true, nearest: false, open_now: false, same_mall_as_others: true },
        },
      ],
      not_listing_this_product: [],
    },
  },
};
