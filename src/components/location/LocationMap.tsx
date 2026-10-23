import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { round6, type Location } from "@/lib/location";
import { cn } from "@/lib/cn";

// OpenStreetMap's free tiles: no API key. Darkened in index.css (.location-map) to match the app.
// Swap the URL to restyle the map later.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type LocationMapProps = {
  value: Location;
  onChange: (location: Location) => void;
  className?: string;
};

/**
 * A map with a fixed pin in the middle: the user moves the map, the pin marks the spot.
 * Moving the map calls onChange; a new `value` (typed coordinates) moves the map.
 */
export function LocationMap({ value, onChange, className }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the map once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { center: [value.lat, value.lon], zoom: 15 });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.on("move", () => {
      const center = map.getCenter();
      onChangeRef.current({ lat: round6(center.lat), lon: round6(center.lng) });
    });
    mapRef.current = map;

    // The popup animates in: let Leaflet re-measure once the box has its real size
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Typed coordinates → move the map (skipped when the change came from the map itself)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const moved = Math.abs(center.lat - value.lat) > 1e-6 || Math.abs(center.lng - value.lon) > 1e-6;
    if (moved) map.setView([value.lat, value.lon], map.getZoom(), { animate: false });
  }, [value.lat, value.lon]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/8", className)}>
      {/* Leaflet's controls assume left-to-right */}
      <div ref={containerRef} dir="ltr" className="location-map size-full bg-soot" />
      {/* The pin's tip sits exactly on the map's center */}
      <MapPin
        aria-hidden
        strokeWidth={2.25}
        className="pointer-events-none absolute left-1/2 top-1/2 z-[500] size-9 -translate-x-1/2 -translate-y-full fill-brand text-ink drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}
