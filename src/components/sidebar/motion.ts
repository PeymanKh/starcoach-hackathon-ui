/**
 * Shared sidebar motion tokens (same physics as beui's animated-sidebar).
 * Everything collapses by animating ONE thing — the width — while rows keep
 * their padding and icon offset. Labels only fade/slide, so nothing jumps.
 */

export const SIDEBAR_WIDTH = 288;
export const SIDEBAR_WIDTH_COLLAPSED = 68;
/** Gutter around the floating card */
export const SIDEBAR_GUTTER = 12;

/** Critically damped: settles on the rail width without overshoot or bounce */
export const SIDEBAR_MORPH = {
  type: "spring",
  stiffness: 380,
  damping: 35,
  mass: 0.75,
} as const;

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const LABEL_ENTER = { duration: 0.2, delay: 0.08, ease: EASE_OUT } as const;
export const LABEL_EXIT = { duration: 0.12, ease: EASE_OUT } as const;

/** Props for a label that fades + nudges toward its icon while collapsing */
export function labelMotion(collapsed: boolean) {
  return {
    initial: false as const,
    animate: { opacity: collapsed ? 0 : 1, x: collapsed ? 6 : 0 },
    transition: collapsed ? LABEL_EXIT : LABEL_ENTER,
  };
}
