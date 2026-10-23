import type { EffortOption, ModelOption } from "@/components/ui/ai-chat-input";

/**
 * ✏️  EDIT ME DURING THE HACKATHON
 * Models shown in the prompt box's picker. The first entry is the default.
 * `id` is what your backend receives: it must be a key of MODELS in apps/agents/llm.py.
 *
 * Icons: drop a PNG/SVG into `public/models/` and point `iconUrl` at it
 * (e.g. "/models/meta.png"). If the file is missing, a small brand spark
 * is shown instead, so nothing breaks. Three vendors currently use the
 * 21st.dev CDN; replace them with local files too if that CDN is blocked.
 */
export const models: ModelOption[] = [
  {
    id: "claude-sonnet-5.5",
    label: "Claude Sonnet 5.5",
    iconUrl:
      "https://cdn.21st.dev/assets/mirror/5d/5de1221c77cc91e748066fd642ad0eee1c1fa65328814f5178166f901e599709.svg",
  },
  {
    id: "gpt-6-luna",
    label: "GPT 6 Luna",
    iconUrl:
      "https://cdn.21st.dev/assets/mirror/b9/b93fa7942be639a1dae60194ff12141145d7d9fd59581582d6ff23335755f19c.svg",
    invert: true, // black logo → white on dark
  },
  {
    id: "muse-spark-1.3",
    label: "Muse Spark 1.3", // Meta
    iconUrl: "/models/meta.png",
    rounded: true,
  },
  {
    id: "mimo-v2.6",
    label: "MiMo V2.6", // Xiaomi
    iconUrl: "/models/xiaomi.png",
  },
  {
    id: "deepseek-v4.1",
    label: "DeepSeek V4.1",
    iconUrl: "/models/deepseek.png",
  },
];

/** Reasoning effort levels, cycled by the bars button. Order = low → high.
 *  The ids must match the backend's THINKING_LEVELS (apps/agents/llm.py). */
export const efforts: EffortOption[] = [
  { id: "low", label: "کم" },
  { id: "medium", label: "متوسط" },
  { id: "high", label: "زیاد" },
];
