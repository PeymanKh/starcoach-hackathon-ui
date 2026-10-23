import { useState, type ReactNode } from "react";
import { Braces } from "lucide-react";
import { TOOLS } from "@/components/chat/ToolSteps";
import { ToolResultSheet } from "@/components/docs/ToolResult";
import { cn } from "@/lib/cn";

/**
 * Building blocks for the product docs popup that plain prose can't do: the agent's tools and
 * group labels. They sit outside the prose styles (not-prose).
 */

const TOOL_GROUPS: { title: string; tools: { name: string; text: string }[] }[] = [
  {
    title: "محصولات",
    tools: [
      { name: "explore_category", text: "وقتی کاربر دقیق نمی‌دونه چی می‌خواد؛ بازه‌ی قیمت و برندهای یک دسته." },
      { name: "search_products", text: "جستجوی فارسی و انگلیسی، حتی با غلط تایپی، با فیلتر قیمت و برند." },
      { name: "get_product_details", text: "مشخصات فنی و بازه‌ی قیمت یک محصول در همه‌ی فروشگاه‌ها." },
      { name: "compare_products", text: "مقایسه‌ی ۲ تا ۴ محصول کنار هم، بر اساس نیاز کاربر." },
      { name: "find_alternatives", text: "گزینه‌ی مشابه یا ارزان‌تر، وقتی محصول گرونه یا فروشنده نداره." },
    ],
  },
  {
    title: "فروشگاه‌ها",
    tools: [
      { name: "find_stores", text: "فروشگاه‌های حضوری نزدیک کاربر، با فیلتر باز بودن و خرید قسطی." },
      { name: "find_stores_by_category", text: "فروشگاه‌های یک دسته‌ی کلی، وقتی محصول دقیق پیدا نمیشه." },
      { name: "get_store_details", text: "طبقه و واحد داخل پاساژ، ساعت کاری هفته، پرداخت و تماس." },
      { name: "compare_stores", text: "قیمت، فاصله، ساعت کاری و گارانتی؛ و اینکه کدوم برنده‌ست." },
    ],
  },
];

/** The agent's tools, grouped, each with the icon it has in the chat timeline.
 * Tapping one opens a sample call and the JSON it returns. */
export function ToolGrid() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="not-prose flex flex-col gap-5">
      {TOOL_GROUPS.map((group) => (
        <div key={group.title}>
          <GroupLabel>{group.title}</GroupLabel>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {group.tools.map((tool) => {
              const meta = TOOLS[tool.name];
              const Icon = meta.icon;
              return (
                <li key={tool.name} className="flex">
                  <button
                    type="button"
                    onClick={() => setOpen(tool.name)}
                    className="group flex w-full cursor-pointer gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-start transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-dust transition-colors group-hover:text-bone">
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span className="text-[13.5px] font-semibold leading-6 text-bone">{meta.label}</span>
                        <span dir="ltr" className="font-mono text-[10.5px] text-faint">
                          {tool.name}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-[1.7] text-faint">{tool.text}</span>
                      <span className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-faint transition-colors group-hover:text-brand-1">
                        <Braces className="size-3.5" />
                        نمونه‌ی خروجی
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {open && <ToolResultSheet tool={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** A small label with a hairline running to the end: names a group without a heading. */
export function GroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="shrink-0 text-[12px] font-semibold text-dust">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}
