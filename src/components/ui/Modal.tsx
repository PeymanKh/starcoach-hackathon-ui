import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  /** "wide" for long-form docs, "default" for short notes */
  size?: "default" | "wide";
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  size = "default",
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<Element | null>(null);

  // Escape to close, scroll lock, focus in / restore
  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the scrollable body so arrow keys / space scroll the text right away
    const raf = requestAnimationFrame(() => {
      const body = bodyRef.current;
      if (body) {
        body.scrollTop = 0;
        body.focus({ preventScroll: true });
      } else {
        panelRef.current?.focus();
      }
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Give focus back to what opened the popup, without flashing its focus ring
      // (closing with Esc would otherwise make the browser show it).
      const opener = lastActive.current;
      if (opener instanceof HTMLElement) {
        opener.dataset.quietFocus = "";
        opener.addEventListener("blur", () => delete opener.dataset.quietFocus, { once: true });
        opener.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
          {/* scrim — click-through while fading out so the next click isn't swallowed */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0, pointerEvents: "none" }}
            animate={{ opacity: 1, pointerEvents: "auto" }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              "relative flex max-h-[min(calc(100dvh_-_2rem),52rem)] w-full flex-col overflow-hidden rounded-3xl border border-white/8 bg-ash shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] outline-none",
              size === "wide" ? "max-w-2xl" : "max-w-lg",
              className,
            )}
            initial={{ opacity: 0, scale: 0.96, y: 14, pointerEvents: "none" }}
            animate={{ opacity: 1, scale: 1, y: 0, pointerEvents: "auto" }}
            exit={{ opacity: 0, scale: 0.98, y: 8, pointerEvents: "none" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 end-0 h-48 w-64 rounded-full bg-brand/15 blur-3xl"
            />

            {/* header — stays put while the body scrolls */}
            <header className="relative flex shrink-0 items-start justify-between gap-4 border-b border-white/6 px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
              <div className="min-w-0">
                {eyebrow && (
                  <p className="mb-1.5 text-xs font-semibold text-brand-1">
                    {eyebrow}
                  </p>
                )}
                <h2
                  id={titleId}
                  className="text-xl font-bold leading-snug text-bone sm:text-2xl"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="بستن"
                className="-me-2 -mt-1 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-dust transition-colors duration-200 hover:bg-white/6 hover:text-bone"
              >
                <X className="size-5" />
              </button>
            </header>

            {/* body — scrolls; the bottom padding sits under the fade so the last line is never dimmed */}
            <div
              ref={bodyRef}
              tabIndex={-1}
              className="modal-prose relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-9 outline-none [mask-image:linear-gradient(to_bottom,black_calc(100%_-_2rem),transparent)] sm:px-8"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
