# استارکوچ — Hackathon UI

Persian, RTL, dark-mode chat UI. Sidebar on the right, chat area in the middle.

## Run

```bash
pnpm install
pnpm dev
```

Build check: `pnpm build`

## Stack

Vite 8 · React 19 · TypeScript · Tailwind v4 · `motion` (animations) · `lucide-react` (icons) · Vazirmatn (Google Fonts)

## Where to edit during the hackathon

| What | File |
|---|---|
| The 3 sidebar buttons + their popup text | `src/content/hackathon.tsx` |
| Chat history (mock, flat list) | `src/content/chats.ts` |
| Models in the picker + effort levels | `src/content/models.ts` |
| Rotating example questions in the empty box | `src/content/placeholders.ts` |
| Colors / fonts / ember gradient | `src/index.css` (`@theme` block) |
| Main area (title + prompt box) | `src/components/chat/ChatArea.tsx` |
| Prompt box component | `src/components/ui/ai-chat-input.tsx` |
| Sidebar layout | `src/components/sidebar/Sidebar.tsx` |
| Popup component | `src/components/ui/Modal.tsx` |

**Wiring the AI:** `App.tsx` passes `onSubmit={(text, meta) => …}` to `ChatArea`.
`meta.model.id` and `meta.effort.id` are the ids from `src/content/models.ts`.
Enter sends, Shift+Enter adds a newline.

**Voice input (mic button):** when the box is empty the send button is a mic.
It uses the browser's Web Speech API with `fa-IR` (`src/hooks/useSpeechToText.ts`):
no backend, live interim text, works in Chrome/Edge. Caveats: audio goes to Google's
speech servers, so it needs internet (from inside Iran usually a VPN), and Safari/Firefox
support is poor. To move to a backend later (Azure/Google STT, OpenAI realtime, or a
self-hosted Whisper), keep the hook's `{ supported, listening, start, stop }` shape and
re-implement `start`/`stop` with MediaRecorder + a WebSocket, calling `onUpdate` as
partial text arrives. Turn the feature off with `voice={false}` on `PromptInput`.

**Pasting more shadcn / 21st.dev components:** drop them in `src/components/ui/`.
`@/lib/utils` (`cn`), `tw-animate-css`, and the shadcn color tokens
(`bg-card`, `text-muted-foreground`, `border-border`, `ring-ring`, …) are already set up
and mapped to the ember palette.

## Design notes

- Deep, plum-tinted black surfaces (`ink` / `soot` / `ash` / `smoke`), never brown, never cold slate.
- One brand red, `#f31e3a` (`brand`), with a light tint `brand-1` and deep shade `brand-3` for the gradient marks (logo, active-chat bar, title smiley). Buttons are flat `bg-brand` with black text.
- Tokens live in `src/index.css`; shadcn aliases (`primary`, `ring`, `card`, …) map onto them.
- Persian typography: Vazirmatn, line-height 1.7, **no letter-spacing** (it breaks letter joins).
- RTL-safe spacing: use `ms-` / `me-` / `ps-` / `pe-` / `start-` / `end-` instead of left/right utilities.
- Sidebar collapses to an icon rail (state saved in `localStorage`); on `< md` it becomes a drawer.
- Animations respect `prefers-reduced-motion`.
