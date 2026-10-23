/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL. Empty locally (Vite proxies /api), the API's URL on Vercel. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
