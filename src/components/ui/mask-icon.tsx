import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type IconComponent = (props: { className?: string }) => React.ReactElement;

/**
 * Turns a transparent-background PNG/SVG into a tintable icon component.
 * The image is used as a CSS mask and filled with `currentColor`, so it
 * behaves exactly like a Lucide icon: size it with `size-*`, color it with
 * `text-*`, and hover tints just work.
 */
export function maskIcon(src: string): IconComponent {
  const style: CSSProperties = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
  return function MaskIcon({ className }: { className?: string }) {
    return (
      <span
        aria-hidden
        className={cn("inline-block shrink-0 bg-current", className)}
        style={style}
      />
    );
  };
}
