import { useCallback, useState } from "react";
import { listChats } from "@/lib/agent-api";
import type { Chat } from "@/content/chats";

/** The sidebar's chat list, from the backend. */
export function useChatList() {
  const [chats, setChats] = useState<Chat[]>([]);

  const refresh = useCallback(() => {
    listChats()
      .then((items) => setChats(items.map((c) => ({ id: c.thread_id, title: c.title }))))
      .catch(() => {
        /* keep the current list; the next refresh tries again */
      });
  }, []);

  return { chats, refresh };
}
