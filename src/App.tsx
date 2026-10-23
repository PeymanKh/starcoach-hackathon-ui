import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { Modal } from "@/components/ui/Modal";
import { hackathonCards } from "@/content/hackathon";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useChatList } from "@/hooks/useChatList";
import { useChatRoute } from "@/hooks/useChatRoute";
import { useUserLocation } from "@/hooks/useUserLocation";
import { LocationPicker } from "@/components/location/LocationPicker";
import { DEFAULT_LOCATION } from "@/lib/location";

const COLLAPSED_KEY = "starcoach:sidebar-collapsed";
/** The browser tab's title on the home page; a chat page uses the chat's title. */
const HOME_TITLE = "دستیار خرید حضوری ترب";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const chat = useAgentChat();
  const chatList = useChatList();
  const route = useChatRoute();
  const userLocation = useUserLocation();

  // The URL decides which chat is open: /c/<id> loads it, / is a fresh chat.
  // Also runs on first load, so a refresh or a shared link reopens the chat.
  useEffect(() => {
    if (route.chatId && route.chatId !== chat.threadId) {
      void chat.load(route.chatId).then((found) => {
        if (!found) route.navigate(null);
      });
    } else if (!route.chatId && chat.threadId) {
      chat.reset();
    }
    // Only URL changes drive this; chat.threadId is read, not watched.
  }, [route.chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // A new chat got its id from the server: give it its own URL and show it in the list.
  useEffect(() => {
    if (chat.threadId && chat.threadId !== route.chatId) route.navigate(chat.threadId);
    if (chat.threadId) chatList.refresh();
  }, [chat.threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh the list on start and whenever an answer finishes (that chat moves to the top).
  useEffect(() => {
    if (!chat.busy) chatList.refresh();
  }, [chat.busy, chatList.refresh]);

  // The tab's title: the chat's title (or its first message, before the list knows it).
  const chatTitle = route.chatId
    ? (chatList.chats.find((c) => c.id === route.chatId)?.title ??
      chat.messages.find((m) => m.role === "user")?.text)
    : null;
  useEffect(() => {
    document.title = chatTitle?.trim() || HOME_TITLE;
  }, [chatTitle]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* private mode, ignore */
    }
  }, [collapsed]);

  // Close the mobile drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  const closeCard = useCallback(() => setActiveCardId(null), []);

  const selectChat = (id: string) => {
    route.navigate(id);
    setDrawerOpen(false);
  };
  const newChat = () => {
    chat.reset();
    route.navigate(null);
    setDrawerOpen(false);
  };
  const openLocation = () => {
    userLocation.openPicker();
    setDrawerOpen(false);
  };
  const openCard = (id: string) => {
    setActiveCardId(id);
    setDrawerOpen(false);
  };

  const activeCard = hackathonCards.find((c) => c.id === activeCardId) ?? null;

  return (
    <div className="flex h-dvh overflow-hidden bg-ink">
      {/* Desktop sidebar — first child in RTL = right edge */}
      <Sidebar
        className="hidden md:block"
        collapsed={collapsed}
        onToggle={toggle}
        chats={chatList.chats}
        activeChatId={route.chatId}
        onSelectChat={selectChat}
        onNewChat={newChat}
        onOpenCard={openCard}
        onOpenLocation={openLocation}
      />

      {/* Mobile: no header, just a floating hamburger on the start side */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="باز کردن منو"
        className="fixed top-3 start-3 z-30 grid size-11 cursor-pointer place-items-center rounded-full glass text-dust backdrop-blur-md transition-colors duration-200 hover:text-bone md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatArea
          messages={chat.messages}
          busy={chat.busy}
          loading={chat.loading}
          onSubmit={(text, meta) =>
            chat.send(text, {
              model: meta.model.id,
              thinking: meta.effort.id,
              location: userLocation.location,
            })
          }
          shareUrl={chat.threadId ? `${window.location.origin}/c/${chat.threadId}` : null}
        />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 right-0"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
            >
              <Sidebar
                drawer
                collapsed={false}
                onToggle={toggle}
                onClose={() => setDrawerOpen(false)}
                chats={chatList.chats}
                activeChatId={route.chatId}
                onSelectChat={selectChat}
                onNewChat={newChat}
                onOpenCard={openCard}
                onOpenLocation={openLocation}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* "Where are you?" map: opens by itself on the first visit, later from the sidebar */}
      <LocationPicker
        open={userLocation.pickerOpen}
        initial={userLocation.location ?? DEFAULT_LOCATION}
        onClose={userLocation.closePicker}
        onSave={userLocation.save}
      />

      {/* Hackathon explanation popup */}
      <Modal
        open={activeCard !== null}
        onClose={closeCard}
        eyebrow={activeCard?.eyebrow}
        title={activeCard?.title ?? ""}
        size={activeCard?.size}
      >
        {activeCard?.body}
      </Modal>
    </div>
  );
}
