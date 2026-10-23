# Torob In-Person Shopping Assistant (UI)

The chat interface for an AI shopping assistant that helps you find products in physical stores in Tehran. It's Persian, right-to-left and built mobile-first.

- Live: https://chat.peymankh.dev
- Backend: https://github.com/PeymanKh/starcoach-hackathon

## Run locally

You need Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:5173.

The backend needs to be running too. In development, Vite forwards `/api` to `http://localhost:8000`. To point the UI at a different backend, set `VITE_API_URL` in `.env`, for example `https://api.peymankh.dev`.

## Build

```bash
pnpm build
```

## Stack

React 19, Vite, TypeScript, Tailwind CSS 4 and Motion. Deployed on Vercel.
