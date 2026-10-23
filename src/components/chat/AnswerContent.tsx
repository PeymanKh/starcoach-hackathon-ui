import { useMemo } from "react";
import { Markdown } from "@/components/chat/Markdown";
import { ProductCard, ProductCarousel, type ProductCardData } from "@/components/chat/ProductCard";
import { StoreList, type StoreCardData, type VerifiedPrice } from "@/components/chat/StoreCard";

/** The tool results a message carries (its steps' `ui`). */
type Result = { ui: Record<string, unknown> | null };

/** Products and stores from the tool results, by id, for the markers to point at. */
type CardIndex = {
  products: Map<string, ProductCardData>;
  stores: Map<string, StoreCardData>;
  /** The product each store result was about, for the call ("is X in stock?") */
  storeProduct: Map<string, string>;
};

/**
 * An answer as the agent wrote it: text, with [[product:ID]] / [[store:ID]] markers turned
 * into cards from this message's tool results. One product marker is a full card, several in
 * a row a swipeable carousel; stores are a list. Markers whose data is missing are dropped.
 */
export function AnswerContent({
  text,
  results,
  verified,
  onAsk,
  onCall,
}: {
  text: string;
  results: Result[];
  verified: Record<string, VerifiedPrice>;
  onAsk: (text: string) => void;
  onCall: (store: StoreCardData, productName: string) => void;
}) {
  const index = useMemo(() => indexCards(results), [results]);
  const blocks = parseAnswer(text);

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.kind === "text") return <Markdown key={i} text={block.text} />;

        if (block.kind === "products") {
          const products = block.ids.flatMap((id) => index.products.get(id) ?? []);
          if (products.length === 0) return null;
          return products.length === 1 ? (
            <ProductCard key={i} product={products[0]} onAsk={onAsk} />
          ) : (
            <ProductCarousel key={i} products={products} onAsk={onAsk} />
          );
        }

        const stores = block.ids.flatMap((id) => index.stores.get(id) ?? []);
        if (stores.length === 0) return null;
        return (
          <StoreList
            key={i}
            stores={stores}
            verified={verified}
            onCall={(store) => onCall(store, index.storeProduct.get(store.id) ?? "این محصول")}
          />
        );
      })}
    </div>
  );
}

// ─── markers ──────────────────────────────────────────────────────────

type Block =
  | { kind: "text"; text: string }
  | { kind: "products"; ids: string[] }
  | { kind: "stores"; ids: string[] };

const MARKER = /\[\[(product|store):([^\]\s]+)\]\]/g;

/** Text and card groups, in order. Markers with only whitespace between them form one group. */
export function parseAnswer(raw: string): Block[] {
  const text = raw.replace(/\[\[[^\]]*\]?$/, ""); // a marker still being typed
  const blocks: Block[] = [];
  let last = 0;

  for (const match of text.matchAll(MARKER)) {
    const before = text.slice(last, match.index);
    const kind = match[1] === "product" ? "products" : "stores";
    const previous = blocks.at(-1);
    if (before.trim()) {
      blocks.push({ kind: "text", text: before });
      blocks.push({ kind, ids: [match[2]] });
    } else if (previous && previous.kind === kind) {
      if (!previous.ids.includes(match[2])) previous.ids.push(match[2]);
    } else {
      blocks.push({ kind, ids: [match[2]] });
    }
    last = match.index + match[0].length;
  }

  const rest = text.slice(last);
  if (rest.trim()) blocks.push({ kind: "text", text: rest });
  return blocks;
}

/** "گوشی اپل iPhone 15 Pro | حافظه 256 گیگابایت" → "گوشی اپل iPhone 15 Pro" */
const shortTitle = (title: string) => title.split(" | ")[0];

function indexCards(results: Result[]): CardIndex {
  const index: CardIndex = { products: new Map(), stores: new Map(), storeProduct: new Map() };
  const rows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

  const addProduct = (row: Record<string, unknown> | null | undefined) => {
    if (typeof row?.id !== "string") return;
    // Later results may know more (details after a search): merge instead of replacing.
    index.products.set(row.id, { ...index.products.get(row.id), ...(row as ProductCardData) });
  };

  for (const { ui } of results) {
    if (!ui) continue;
    switch (ui.type) {
      case "product_list":
      case "product_comparison":
        rows(ui.products).forEach(addProduct);
        break;
      case "alternatives":
        addProduct(ui.original as Record<string, unknown>);
        rows(ui.alternatives).forEach(addProduct);
        break;
      case "product_details":
        addProduct(ui);
        break;
      case "store_list":
      case "store_comparison":
      case "store_details": {
        const product = ui.product as { persian_title?: string | null } | null | undefined;
        const stores = ui.type === "store_details" ? [ui] : rows(ui.stores);
        for (const store of stores) {
          if (typeof store.id !== "string") continue;
          index.stores.set(store.id, { ...index.stores.get(store.id), ...(store as StoreCardData) });
          if (product?.persian_title) index.storeProduct.set(store.id, shortTitle(product.persian_title));
        }
        break;
      }
    }
  }
  return index;
}
