import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Small building blocks for long-form popup content (see content/hackathon.tsx).
 * Plain <p>, <ul>, <ol>, <strong>, <a> inside the modal are styled by `.modal-prose`
 * in index.css — these components only cover what plain HTML can't.
 */

/** A numbered section: brand number badge + heading + body. */
export function Section({
  n,
  title,
  id,
  children,
}: {
  /** Shown in the badge, e.g. "۱" */
  n: string;
  title: string;
  /** For linking to it: <a href="#id"> */
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="prose-section">
      <h3>
        <span aria-hidden className="prose-num">
          {n}
        </span>
        <span className="sr-only">{n}. </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Brand-colored key term, like the highlighted product names in the reference. */
export function Term({ children }: { children: ReactNode }) {
  return <mark className="prose-term">{children}</mark>;
}

/** A paragraph that opens with a bold lead-in ("قیمت‌ها: …"). */
export function Point({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <strong>{label}:</strong> {children}
    </p>
  );
}

/** Darker inset box for a rule, a tip or a takeaway. */
export function Callout({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("prose-callout", className)}>
      {label && <p className="prose-callout-label">{label}</p>}
      <div>{children}</div>
    </aside>
  );
}
