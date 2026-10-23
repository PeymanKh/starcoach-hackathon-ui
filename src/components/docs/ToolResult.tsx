import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Check, Copy, X } from "lucide-react";
import { TOOLS } from "@/components/chat/ToolSteps";
import { TOOL_SAMPLES } from "@/content/tool-samples";

/**
 * A tool's sample call: the arguments the model sends and the JSON it gets back, highlighted.
 * Opens over the docs popup (bottom sheet on phones); Escape and the backdrop close only this.
 */
export function ToolResultSheet({ tool, onClose }: { tool: string; onClose: () => void }) {
  const meta = TOOLS[tool];
  const sample = TOOL_SAMPLES[tool];
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(sample.result, null, 2);

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    // Capture runs before the popup's own Escape: close this, not the popup under it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const copy = () => {
    navigator.clipboard?.writeText(json).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }, () => {});
  };

  const Icon = meta.icon;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`خروجی ${meta.label}`}
        tabIndex={-1}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[88dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-3xl border border-white/[0.07] bg-ash shadow-2xl outline-none sm:max-h-[80dvh] sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-dust">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-6 text-bone">{meta.label}</h2>
            <p dir="ltr" className="text-end font-mono text-[11px] text-faint">
              {tool}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-dust transition-colors hover:bg-white/[0.06] hover:text-bone"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-5">
          <Block label="ورودی">
            <Code>
              <span className="text-bone">{tool}</span>
              <span className="text-faint">(</span>
              {highlight(JSON.stringify(sample.args, null, 2))}
              <span className="text-faint">)</span>
            </Code>
          </Block>

          <Block
            label="خروجی"
            action={
              <button
                type="button"
                onClick={copy}
                className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] text-faint transition-colors hover:bg-white/[0.06] hover:text-bone"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "کپی شد" : "کپی"}
              </button>
            }
          >
            <Code>{highlight(json)}</Code>
          </Block>

          <p className="text-[11.5px] leading-5 text-faint">
            نمونه با همون ساختار خروجی واقعی ابزار؛ لیست‌ها برای کوتاه شدن به یکی دو مورد محدود شدن.
          </p>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function Block({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[12px] font-semibold text-dust">{label}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <pre
      dir="ltr"
      className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-ink/80 p-4 text-left font-mono text-[12px] leading-[1.7] text-faint"
    >
      <code>{children}</code>
    </pre>
  );
}

const TOKEN = /"((?:\\.|[^"\\])*)"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?/g;

/** JSON text → colored spans: keys, strings, numbers, true/false/null. Persian strings are isolated
 * so their quotes stay in place inside the left-to-right code. */
function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of json.matchAll(TOKEN)) {
    const [text, inner, colon, literal] = match;
    if (match.index > last) out.push(json.slice(last, match.index));
    const key = out.length;
    if (inner !== undefined) {
      const tone = colon ? "text-bone" : "text-emerald-300";
      out.push(
        <Fragment key={key}>
          <span className={tone}>
            "<bdi>{inner}</bdi>"
          </span>
          {colon}
        </Fragment>,
      );
    } else if (literal) {
      out.push(
        <span key={key} className="text-brand-1">
          {literal}
        </span>,
      );
    } else {
      out.push(
        <span key={key} className="text-amber-300">
          {text}
        </span>,
      );
    }
    last = match.index + text.length;
  }
  out.push(json.slice(last));
  return out;
}
