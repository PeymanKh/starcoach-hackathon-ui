import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live speech-to-text via the browser's Web Speech API (Chrome / Edge).
 * No backend needed. Persian: lang = "fa-IR".
 *
 * ⚠️ Audio is sent to Google's speech servers by the browser, so it needs
 * internet (and, from inside Iran, usually a VPN). Safari/Firefox support is poor.
 *
 * 🔁 To move transcription to your own backend later, keep this hook's shape
 * ({ supported, listening, start, stop }) and re-implement start/stop with
 * MediaRecorder + a WebSocket to your STT service, calling `onUpdate` as
 * partial text arrives.
 */

export type SpeechErrorCode =
  | "unsupported"
  | "not-allowed"
  | "network"
  | "audio-capture"
  | "no-speech"
  | "aborted"
  | "unknown";

type UseSpeechToTextOptions = {
  lang?: string;
  /** Fires on every update: text that is final + text still being recognized */
  onUpdate: (committed: string, interim: string) => void;
  onEnd?: () => void;
  onError?: (code: SpeechErrorCode) => void;
};

// Minimal local typings (the global SpeechRecognition types vary by TS lib version)
type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; 0: RecognitionAlternative };
type RecognitionResultList = { length: number; [index: number]: RecognitionResult };
interface RecognitionEvent extends Event {
  resultIndex: number;
  results: RecognitionResultList;
}
interface RecognitionErrorEvent extends Event {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapError(error: string): SpeechErrorCode {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "network":
      return "network";
    case "audio-capture":
      return "audio-capture";
    case "no-speech":
      return "no-speech";
    case "aborted":
      return "aborted";
    default:
      return "unknown";
  }
}

export function useSpeechToText({
  lang = "fa-IR",
  onUpdate,
  onEnd,
  onError,
}: UseSpeechToTextOptions) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);

  // Keep the latest callbacks without re-creating the recognizer
  const cbRef = useRef({ onUpdate, onEnd, onError });
  useEffect(() => {
    cbRef.current = { onUpdate, onEnd, onError };
  });

  const supported = getRecognitionCtor() !== null;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      cbRef.current.onError?.("unsupported");
      return;
    }
    if (recRef.current) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      // Rebuild from the full result list each time — simplest and robust
      const committed: string[] = [];
      const interim: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript.trim();
        if (!t) continue;
        (r.isFinal ? committed : interim).push(t);
      }
      cbRef.current.onUpdate(committed.join(" "), interim.join(" "));
    };

    rec.onerror = (e) => {
      const code = mapError(e.error);
      // Silence timeouts / manual aborts are not errors worth showing
      if (code !== "no-speech" && code !== "aborted") cbRef.current.onError?.(code);
    };

    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      cbRef.current.onEnd?.();
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recRef.current = null;
      cbRef.current.onError?.("unknown");
    }
  }, [lang]);

  // Abort on unmount
  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, start, stop };
}
