/**
 * Talks to the Django agent API:
 *   POST /api/agent/runs/            → queue the agent for one message
 *   GET  /api/agent/runs/<id>/stream/ → its events, as Server-Sent Events
 */

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export type AgentEvent =
  | { event: "thinking" }
  | { event: "token"; text: string }
  | { event: "tool_start"; id: string; tool: string; args: Record<string, unknown> }
  | { event: "tool_end"; id: string; tool: string; ok: boolean; ui: Record<string, unknown> | null }
  | { event: "done"; thread_id: string }
  | { event: "error"; message: string };

export type StartRunBody = {
  message: string;
  model: string;
  thinking: string;
  thread_id?: string;
  lat?: number;
  lon?: number;
};

export type StartRunResponse = {
  run_id: string;
  thread_id: string;
  stream_url: string;
};

export async function startRun(body: StartRunBody): Promise<StartRunResponse> {
  const response = await fetch(`${API_URL}/api/agent/runs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 429) {
    throw new Error("تعداد درخواست‌ها زیاد شد. کمی صبر کن و دوباره امتحان کن.");
  }
  if (!response.ok) {
    throw new Error("ارسال پیام ناموفق بود. دوباره تلاش کن.");
  }
  return response.json();
}

/**
 * Listen to a run's events until "done" or "error". Returns a function that stops listening.
 * `onConnection(false)` while a dropped connection is being retried, `true` once it's back.
 */
export function streamRun(
  streamUrl: string,
  onEvent: (event: AgentEvent) => void,
  onConnection?: (connected: boolean) => void,
): () => void {
  const source = new EventSource(`${API_URL}${streamUrl}`);
  source.onmessage = (message) => {
    const event = JSON.parse(message.data) as AgentEvent;
    onEvent(event);
    // Close ourselves: otherwise EventSource treats the end of the stream as a drop and reconnects.
    if (event.event === "done" || event.event === "error") source.close();
  };
  // On a dropped connection EventSource reconnects by itself and the server resumes after the
  // last event it sent (Last-Event-ID). We only tell the UI, and give up if the browser does.
  source.onopen = () => onConnection?.(true);
  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) {
      onEvent({ event: "error", message: "ارتباط با سرور قطع شد. دوباره تلاش کن." });
    } else {
      onConnection?.(false);
    }
  };
  return () => source.close();
}

// ── Chats ───────────────────────────────────────────────────────────────

export type HistoryStep = {
  id: string;
  tool: string;
  args?: Record<string, unknown>;
  status: "running" | "done" | "failed";
  ui: Record<string, unknown> | null;
};

export type HistoryMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; steps: HistoryStep[]; status: "done" };

export type ChatSummary = {
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatDetail = ChatSummary & { messages: HistoryMessage[] };

/** All chats, most recently active first. */
export async function listChats(): Promise<ChatSummary[]> {
  const response = await fetch(`${API_URL}/api/agent/threads/`);
  if (!response.ok) throw new Error("دریافت گفتگوها ناموفق بود.");
  return response.json();
}

/** One chat with its messages, or null if it doesn't exist. */
export async function getChat(threadId: string): Promise<ChatDetail | null> {
  const response = await fetch(`${API_URL}/api/agent/threads/${encodeURIComponent(threadId)}/`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("دریافت گفتگو ناموفق بود.");
  return response.json();
}

// ── Speech to text ──────────────────────────────────────────────────────

/** The text spoken in a WAV recording (Whisper on the backend). */
export async function transcribeAudio(wav: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", wav, "speech.wav");
  const response = await fetch(`${API_URL}/api/agent/transcribe/`, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Transcription failed (${response.status})`);
  const data: { text?: string } = await response.json();
  return data.text ?? "";
}
