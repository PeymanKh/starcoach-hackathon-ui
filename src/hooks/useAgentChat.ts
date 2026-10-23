import { useCallback, useEffect, useRef, useState } from "react";
import { getChat, startRun, streamRun, type AgentEvent, type HistoryMessage } from "@/lib/agent-api";
import type { Location } from "@/lib/location";

export type ToolStep = {
  id: string;
  tool: string;
  status: "running" | "done" | "failed";
  /** The tool's result, for cards. */
  ui: Record<string, unknown> | null;
};

export type UserMessage = { id: string; role: "user"; text: string };

export type AssistantMessage = {
  id: string;
  role: "assistant";
  text: string;
  steps: ToolStep[];
  thinking: boolean;
  /**
   * The model called tools since its last text. Whatever it said before ("let me search…")
   * is replaced as soon as the next text starts, so the answer never mixes with it.
   */
  replaceText: boolean;
  status: "streaming" | "done" | "error";
  error?: string;
};

export type ChatMessage = UserMessage | AssistantMessage;

type SendOptions = { model: string; thinking: string; location?: Location | null };

/** One conversation with the agent: messages, streaming state, and the backend thread. */
export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const threadIdRef = useRef<string | null>(null); // the latest thread, for send()
  const loadRequest = useRef(0); // only the latest load() may set messages
  const stopStream = useRef<(() => void) | null>(null);

  const updateAssistant = useCallback(
    (id: string, update: (message: AssistantMessage) => AssistantMessage) =>
      setMessages((all) =>
        all.map((m) => (m.id === id && m.role === "assistant" ? update(m) : m)),
      ),
    [],
  );

  const applyEvent = useCallback(
    (id: string, event: AgentEvent) => {
      updateAssistant(id, (m) => {
        switch (event.event) {
          case "thinking":
            return { ...m, thinking: true };
          case "token":
            return {
              ...m,
              thinking: false,
              replaceText: false,
              text: m.replaceText ? event.text : m.text + event.text,
            };
          case "tool_start":
            return {
              ...m,
              thinking: false,
              replaceText: true,
              steps: [...m.steps, { id: event.id, tool: event.tool, status: "running", ui: null }],
            };
          case "tool_end":
            return {
              ...m,
              steps: m.steps.map((s) =>
                s.id === event.id ? { ...s, status: event.ok ? "done" : "failed", ui: event.ui } : s,
              ),
            };
          case "done":
            return { ...m, thinking: false, status: "done" };
          case "error":
            return { ...m, thinking: false, status: "error", error: event.message };
        }
      });
      if (event.event === "done" || event.event === "error") setBusy(false);
    },
    [updateAssistant],
  );

  const send = useCallback(
    async (text: string, { model, thinking, location }: SendOptions) => {
      if (busy) return;
      const assistantId = crypto.randomUUID();
      setMessages((all) => [
        ...all,
        { id: crypto.randomUUID(), role: "user", text },
        {
          id: assistantId,
          role: "assistant",
          text: "",
          steps: [],
          thinking: false,
          replaceText: false,
          status: "streaming",
        },
      ]);
      setBusy(true);

      try {
        const run = await startRun({
          message: text,
          model,
          thinking,
          thread_id: threadIdRef.current ?? undefined,
          ...(location ?? {}),
        });
        threadIdRef.current = run.thread_id;
        setThreadId(run.thread_id);
        stopStream.current = streamRun(run.stream_url, (event) => applyEvent(assistantId, event));
      } catch (error) {
        const message = error instanceof Error ? error.message : "مشکلی پیش آمد.";
        updateAssistant(assistantId, (m) => ({ ...m, status: "error", error: message }));
        setBusy(false);
      }
    },
    [busy, applyEvent, updateAssistant],
  );

  /** Start a new conversation. */
  const reset = useCallback(() => {
    stopStream.current?.();
    loadRequest.current += 1;
    threadIdRef.current = null;
    setThreadId(null);
    setMessages([]);
    setBusy(false);
    setLoading(false);
  }, []);

  /** Open an existing chat with its history. Resolves to false if it doesn't exist. */
  const load = useCallback(async (id: string) => {
    stopStream.current?.();
    const request = ++loadRequest.current;
    threadIdRef.current = id;
    setThreadId(id);
    setMessages([]);
    setBusy(false);
    setLoading(true);
    try {
      const chat = await getChat(id);
      if (request !== loadRequest.current) return true; // another chat was opened meanwhile
      setMessages(chat ? chat.messages.map(fromHistory) : []);
      return chat !== null;
    } catch {
      return request !== loadRequest.current; // a failed load of an outdated request is fine
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => () => stopStream.current?.(), []);

  return { messages, busy, loading, threadId, send, reset, load };
}

/** A message from the backend's history, in the same shape as a live one. */
function fromHistory(message: HistoryMessage): ChatMessage {
  const id = crypto.randomUUID();
  if (message.role === "user") return { id, role: "user", text: message.text };
  return {
    id,
    role: "assistant",
    text: message.text,
    steps: message.steps,
    thinking: false,
    replaceText: false,
    status: "done",
  };
}
