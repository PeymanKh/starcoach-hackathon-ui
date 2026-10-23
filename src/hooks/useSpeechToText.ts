import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/agent-api";
import { durationSeconds, encodeWav, isSilent } from "@/lib/wav";

/**
 * Speech to text through our backend (Whisper on OpenRouter), so it works from anywhere,
 * Iran included, and in every modern browser.
 *
 * "Live captions": while recording, the whole clip so far is sent every INTERVAL_MS and the
 * text in the box updates as the user talks. On stop, one last request gives the final text.
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
  /** Kept for compatibility: the language is set on the backend (Persian). */
  lang?: string;
  /** Fires on every update: text that is final + text still being recognized */
  onUpdate: (committed: string, interim: string) => void;
  onEnd?: () => void;
  onError?: (code: SpeechErrorCode) => void;
};

const INTERVAL_MS = 1500; // how often the growing clip is sent while recording
const MIN_SECONDS = 0.8; // shorter clips are not worth a request
const MAX_SECONDS = 60; // recording stops by itself after this

type Recording = {
  stream: MediaStream;
  context: AudioContext;
  processor: ScriptProcessorNode;
  chunks: Float32Array[];
  timer: number;
  inFlight: boolean; // a live-caption request is running
  sent: number; // number of the last request sent
  shown: number; // number of the last answer shown (older answers are ignored)
  stopped: boolean;
};

function micSupported() {
  return (
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.AudioContext !== "undefined"
  );
}

function micError(error: unknown): SpeechErrorCode {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "not-allowed";
  if (name === "NotFoundError" || name === "NotReadableError") return "audio-capture";
  return "unknown";
}

export function useSpeechToText({ onUpdate, onEnd, onError }: UseSpeechToTextOptions) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recording = useRef<Recording | null>(null);

  // Keep the latest callbacks without restarting the recording
  const callbacks = useRef({ onUpdate, onEnd, onError });
  useEffect(() => {
    callbacks.current = { onUpdate, onEnd, onError };
  });

  const supported = micSupported();

  /** Release the microphone. Returns the recording, or null if there was none. */
  const release = useCallback(() => {
    const r = recording.current;
    if (!r || r.stopped) return null;
    r.stopped = true;
    recording.current = null;
    window.clearInterval(r.timer);
    r.processor.disconnect();
    r.stream.getTracks().forEach((track) => track.stop());
    void r.context.close();
    setListening(false);
    return r;
  }, []);

  /** Live captions: transcribe everything recorded so far. */
  const sendSoFar = useCallback(async (r: Recording) => {
    const seconds = durationSeconds(r.chunks, r.context.sampleRate);
    if (r.inFlight || r.stopped || seconds < MIN_SECONDS || isSilent(r.chunks)) return;
    r.inFlight = true;
    const number = ++r.sent;
    try {
      const text = await transcribeAudio(encodeWav(r.chunks, r.context.sampleRate));
      if (!r.stopped && number > r.shown) {
        r.shown = number;
        callbacks.current.onUpdate(text, "");
      }
    } catch {
      /* a missed live caption is fine; the final request reports errors */
    } finally {
      r.inFlight = false;
    }
  }, []);

  /** Stop recording and put the final text in the box. */
  const stop = useCallback(async () => {
    const r = release();
    if (!r) return;
    const usable = durationSeconds(r.chunks, r.context.sampleRate) >= MIN_SECONDS && !isSilent(r.chunks);
    if (usable) {
      setTranscribing(true);
      try {
        callbacks.current.onUpdate(await transcribeAudio(encodeWav(r.chunks, r.context.sampleRate)), "");
      } catch {
        callbacks.current.onError?.("network");
      } finally {
        setTranscribing(false);
      }
    }
    callbacks.current.onEnd?.();
  }, [release]);

  /** Stop recording and keep the text as it is (e.g. the message is being sent right now). */
  const cancel = useCallback(() => {
    if (release()) callbacks.current.onEnd?.();
  }, [release]);

  const start = useCallback(async () => {
    if (recording.current) return;
    if (!micSupported()) {
      callbacks.current.onError?.("unsupported");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch (error) {
      callbacks.current.onError?.(micError(error));
      return;
    }

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    // ScriptProcessorNode is old but works in every browser and needs no extra file.
    const processor = context.createScriptProcessor(4096, 1, 1);
    const r: Recording = {
      stream,
      context,
      processor,
      chunks: [],
      timer: 0,
      inFlight: false,
      sent: 0,
      shown: 0,
      stopped: false,
    };
    processor.onaudioprocess = (event) => {
      r.chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    processor.connect(context.destination); // required for the processor to run; it outputs silence

    r.timer = window.setInterval(() => {
      if (durationSeconds(r.chunks, context.sampleRate) >= MAX_SECONDS) void stop();
      else void sendSoFar(r);
    }, INTERVAL_MS);

    recording.current = r;
    setListening(true);
  }, [sendSoFar, stop]);

  // Release the microphone on unmount
  useEffect(() => () => void release(), [release]);

  return { supported, listening, transcribing, start, stop, cancel };
}
