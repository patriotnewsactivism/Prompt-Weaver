# AGENTS.md

Prompt Reasoning Engine — pnpm workspace (Node 24, TypeScript 5.9). Frontend:
`artifacts/prompt-engine` (React + Vite + wouter + TanStack Query). API:
`artifacts/api-server` (Express 5). Schema + DB access: `lib/db` (Drizzle ORM + Postgres).
AI calls go through `lib/integrations-gemini-ai` and `lib/integrations-openai-ai-server`.

## Running it here (Base44 sandbox)

```
docker compose -f docker-compose.base44.yml up -d --build
```

- Preview entry point: host port **3000** → Vite dev server (inside the container it
  listens on `22503` because `vite.config.ts` requires `PORT`/`BASE_PATH`).
- API: host port **8080** → Express (`tsx watch`).
- `deps` performs the single `pnpm install --frozen-lockfile` for the whole workspace.
  Both app services wait for it: pnpm keeps `node_modules` inside each package, so two
  concurrent installers would fight over the same directories.
- `migrate` runs `drizzle-kit push` once, before the API starts. After editing
  `lib/db/src/schema/*`, re-run it:
  `docker compose -f docker-compose.base44.yml run --rm migrate`
- Postgres data lives in the `pgdata` volume. Never delete it to refresh dependencies.
- **pnpm must be 10.x.** The repo relies on `onlyBuiltDependencies` in
  `pnpm-workspace.yaml`, which pnpm 11+ no longer honours — under a newer pnpm the
  esbuild postinstall is skipped and the API build fails. Pinned in `package.json`
  (`packageManager`) and `Dockerfile.base44`.

## Sandbox-only overrides (gated on `BASE44_PREVIEW_MODE === "1"`)

- `artifacts/prompt-engine/vite.config.ts` registers `server.proxy['/api']` pointing at
  `$API_PROXY_TARGET` (compose passes `http://api:8080`). Single-origin wiring: both the
  generated API client and the SSE `POST /api/sessions/:id/iterate` call use relative
  `/api/...` URLs, so the browser has to reach the API through port 3000. With the flag
  unset no proxy is registered and Replit's own application router keeps working.
- Vite already sets `host: '0.0.0.0'` and `allowedHosts: true`, so the proxied preview
  hostname is accepted without further changes.

## Environment variables

- `DATABASE_URL` — local Postgres, set inline in compose (not a secret).
- `AI_INTEGRATIONS_GEMINI_{BASE_URL,API_KEY}` and `AI_INTEGRATIONS_OPENAI_{BASE_URL,API_KEY}`
  — `artifacts/api-server` imports both integration clients at startup and each client
  module **throws when its variables are missing**, so all four must be present or the API
  never boots. The two endpoint URLs are public defaults in `.env.base44-defaults` (first
  `env_file:` entry); the API keys are app secrets delivered to `/run/base44/app.env`
  (last `env_file:`, so dashboard values always win).
- `lib/integrations-gemini-ai/src/client.ts` sets `httpOptions.apiVersion = ""` and
  `@google/genai` only appends a version segment when that value is non-empty, so a Gemini
  base URL must itself carry the API version (`https://generativelanguage.googleapis.com/v1beta`)
  when pointing at Google's public endpoint. Replit's AI-integration proxy is version-agnostic.

## Verification

- Whole-chain check: `curl -s localhost:3000/api/healthz` → `{"status":"ok"}`
  (preview port → Vite proxy → Express).
- `docker compose -f docker-compose.base44.yml ps` for health; `... logs -f web|api` for logs.
- Healthchecks use `node -e fetch(...)`: the Node base image has no curl/wget, and neither
  service reads any file on disk without querying the DB.
- Live reload: `web` uses Vite HMR, `api` uses `tsx watch`. `tsx` is a dev dependency of
  `@workspace/scripts`, which is why compose invokes it via
  `pnpm --filter @workspace/scripts exec tsx watch`; api-server's own `dev` script only
  builds once (`esbuild`) and then starts, with no watcher.
- Prompt generation needs a real Gemini (or OpenAI) credential — the development
  placeholders only satisfy the startup checks, they do not make the provider respond.
