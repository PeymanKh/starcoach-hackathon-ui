import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Bars that follow the microphone while `active`.
 * Each bar is a log-spaced band inside the human-voice range (80 Hz → 4 kHz),
 * so every bar moves when someone talks. Heights are written straight to the
 * DOM (no React state per frame).
 * If mic access fails the bars just stay idle — speech recognition reports
 * permission errors on its own.
 */

const VOICE_LOW_HZ = 80;
const VOICE_HIGH_HZ = 4000;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 24;

export function MicVisualizer({
  active,
  bars = 5,
  className,
}: {
  active: boolean;
  bars?: number;
  className?: string;
}) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reset = () =>
      barRefs.current.forEach((el) => {
        if (el) el.style.height = `${MIN_HEIGHT}px`;
      });
    if (!active) {
      reset();
      return;
    }

    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512; // 256 bins ≈ 94 Hz each at 48 kHz
        analyser.smoothingTimeConstant = 0.7;
        analyser.minDecibels = -85; // speech sits roughly in -70…-25 dB
        analyser.maxDecibels = -20;
        ctx.createMediaStreamSource(stream).connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const binHz = ctx.sampleRate / analyser.fftSize;

        // Log-spaced band edges across the voice range → [startBin, endBin) per bar
        const ratio = VOICE_HIGH_HZ / VOICE_LOW_HZ;
        const bands = Array.from({ length: bars }, (_, i) => {
          const lo = VOICE_LOW_HZ * Math.pow(ratio, i / bars);
          const hi = VOICE_LOW_HZ * Math.pow(ratio, (i + 1) / bars);
          const start = Math.max(0, Math.floor(lo / binHz));
          const end = Math.min(data.length, Math.max(start + 1, Math.ceil(hi / binHz)));
          return [start, end] as const;
        });

        const tick = () => {
          analyser.getByteFrequencyData(data);
          bands.forEach(([start, end], i) => {
            let sum = 0;
            for (let b = start; b < end; b++) sum += data[b] ?? 0;
            const level = sum / (end - start) / 255; // 0..1
            const eased = Math.pow(level, 0.85); // lift quiet speech a little
            const el = barRefs.current[i];
            if (el) el.style.height = `${MIN_HEIGHT + eased * (MAX_HEIGHT - MIN_HEIGHT)}px`;
          });
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* no visualizer; recognition will surface the permission error */
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      reset();
    };
  }, [active, bars]);

  return (
    <span
      aria-hidden
      className={cn("flex h-8 items-center gap-[3px]", className)}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="w-1 rounded-full bg-brand transition-[height] duration-75 ease-out"
          style={{ height: MIN_HEIGHT }}
        />
      ))}
    </span>
  );
}
