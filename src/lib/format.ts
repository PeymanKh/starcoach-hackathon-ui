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

/** Latin digits to Persian: "16:00" → "۱۶:۰۰" */
export function faDigits(text: string) {
  return text.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

/** 0 → "امروز", 1 → "دیروز", 12 → "۱۲ روز پیش", 75 → "۲ ماه پیش" */
export function formatDaysAgo(days: number) {
  if (days <= 0) return "امروز";
  if (days === 1) return "دیروز";
  if (days < 30) return `${faNumber(days)} روز پیش`;
  if (days < 365) return `${faNumber(Math.floor(days / 30))} ماه پیش`;
  return `${faNumber(Math.floor(days / 365))} سال پیش`;
}

/** "02126467180" → "۰۲۱ ۲۶۴۶ ۷۱۸۰", "09396925523" → "۰۹۳۹ ۶۹۲ ۵۵۲۳": easy to read and dial. */
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("09")) {
    return faDigits(`${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return faDigits(`${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`);
  }
  return faDigits(phone);
}
