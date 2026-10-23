/** Persian number formatting for prices, distances and counts. */

export function faNumber(n: number, digits = 0) {
  return n.toLocaleString("fa-IR", { maximumFractionDigits: digits });
}

/** 80_000_000 → "۸۰ میلیون تومان" */
export function formatToman(toman: number) {
  if (toman >= 1_000_000_000) return `${faNumber(toman / 1_000_000_000, 1)} میلیارد تومان`;
  if (toman >= 1_000_000) return `${faNumber(toman / 1_000_000, 1)} میلیون تومان`;
  return `${faNumber(toman)} تومان`;
}

/** 0.4 → "۴۰۰ متر", 3.25 → "۳٫۳ کیلومتر" */
export function formatDistance(km: number) {
  if (km < 1) return `${faNumber(Math.round((km * 1000) / 50) * 50)} متر`;
  return `${faNumber(km, 1)} کیلومتر`;
}
