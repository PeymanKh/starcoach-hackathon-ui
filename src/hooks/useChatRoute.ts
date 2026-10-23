import { useCallback, useEffect, useState } from "react";

/** "/c/<thread_id>" → thread_id; anything else is the home page (a new chat). */
function chatIdFrom(pathname: string): string | null {
  const match = pathname.match(/^\/c\/([A-Za-z0-9_-]{1,64})\/?$/);
  return match ? match[1] : null;
}

/** The chat in the URL. Tiny router on the History API: back/forward and refresh just work. */
export function useChatRoute() {
  const [chatId, setChatId] = useState(() => chatIdFrom(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setChatId(chatIdFrom(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((id: string | null) => {
    const path = id ? `/c/${id}` : "/";
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
    setChatId(id);
  }, []);

  return { chatId, navigate };
}
