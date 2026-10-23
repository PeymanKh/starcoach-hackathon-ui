export type Location = { lat: number; lon: number };

/** Where the map opens the first time: Jomhouri St., central Tehran, full of stores. */
export const DEFAULT_LOCATION: Location = { lat: 35.7006, lon: 51.4113 };

const STORAGE_KEY = "starcoach:location";

export const isLatitude = (n: number) => Number.isFinite(n) && n >= -90 && n <= 90;
export const isLongitude = (n: number) => Number.isFinite(n) && n >= -180 && n <= 180;

/** 6 decimals ≈ 10 cm: plenty, and keeps the numbers readable. */
export const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** The location the user saved in this browser, or null if they never picked one. */
export function readSavedLocation(): Location | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && isLatitude(saved.lat) && isLongitude(saved.lon)) return { lat: saved.lat, lon: saved.lon };
  } catch {
    /* nothing saved, private mode, or broken JSON */
  }
  return null;
}

export function saveLocation(location: Location) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    /* private mode: it still works for this visit */
  }
}
