import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Typewriter placeholder: types a phrase, holds, deletes it fast, types the next.
 * Rendered as an overlay on top of an empty textarea (purely decorative).
 * With `prefers-reduced-motion` it crossfades whole phrases instead.
 */

const TYPE_MS = 38;
const TYPE_JITTER_MS = 24;
const DELETE_MS = 14;
const HOLD_MS = 2400;
const GAP_MS = 350;
const REDUCED_HOLD_MS = 4000;
const FADE_MS = 300;

type Phase = "typing" | "holding" | "deleting" | "gap";

type RotatingPlaceholderProps = {
  phrases: string[];
  /** Animate + show only while the input is empty */
  active: boolean;
  /** Hide the fake caret when the real one is visible (input focused) */
  caret?: boolean;
  className?: string;
};

export function RotatingPlaceholder({
  phrases,
  active,
  caret = true,
  className,
}: RotatingPlaceholderProps) {
  const reduced = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [visible, setVisible] = useState(true); // reduced-motion crossfade

  const phrase = phrases[index % Math.max(phrases.length, 1)] ?? "";
  // Array.from keeps multi-unit characters intact while slicing
  const chars = useMemo(() => Array.from(phrase), [phrase]);
  const shown = chars.slice(0, count).join("");

  // Start the current phrase fresh whenever the overlay becomes active again
  useEffect(() => {
    if (!active) return;
    setCount(0);
    setPhase("typing");
    setVisible(true);
  }, [active]);

  useEffect(() => {
    if (!active || phrases.length === 0) return;
    let timer: number | undefined;

    if (reduced) {
      if (phrases.length <= 1) return;
      timer = visible
        ? window.setTimeout(() => setVisible(false), REDUCED_HOLD_MS)
        : window.setTimeout(() => {
            setIndex((i) => (i + 1) % phrases.length);
            setVisible(true);
          }, FADE_MS);
      return () => window.clearTimeout(timer);
    }

    switch (phase) {
      case "typing":
        if (count >= chars.length) {
          setPhase("holding");
          break;
        }
        timer = window.setTimeout(
          () => setCount((c) => c + 1),
          TYPE_MS + Math.random() * TYPE_JITTER_MS,
        );
        break;
      case "holding":
        if (phrases.length <= 1) break; // nothing to rotate to
        timer = window.setTimeout(() => setPhase("deleting"), HOLD_MS);
        break;
      case "deleting":
        if (count <= 0) {
          setPhase("gap");
          break;
        }
        timer = window.setTimeout(() => setCount((c) => c - 1), DELETE_MS);
        break;
      case "gap":
        timer = window.setTimeout(() => {
          setIndex((i) => (i + 1) % phrases.length);
          setPhase("typing");
        }, GAP_MS);
        break;
    }
    return () => window.clearTimeout(timer);
  }, [active, reduced, phase, count, chars.length, phrases.length, visible]);

  const opacity = !active ? 0 : reduced ? (visible ? 1 : 0) : 1;
  const blinking = phase === "holding" || phase === "gap";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 select-none text-faint",
        className,
      )}
      style={{ opacity, transition: `opacity ${reduced ? FADE_MS : 200}ms ease` }}
    >
      <span>{reduced ? phrase : shown}</span>
      {!reduced && caret && (
        <span
          className={cn(
            "ms-0.5 inline-block h-[1.05em] w-0.5 translate-y-[0.2em] rounded-full bg-brand",
            blinking && "animate-caret-blink",
          )}
        />
      )}
    </div>
  );
}
