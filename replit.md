# Prompt Reasoning Engine

An AI-powered tool that generates optimized prompts for any situation, then iteratively improves them through AI reasoning — showing the logic behind each improvement.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/prompt-engine run dev` — run the frontend (port 22503)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY` — Replit Gemini integration (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, Wouter, shadcn/ui, Tailwind
- API: Express 5
- AI: Gemini via Replit AI Integrations (`@workspace/integrations-gemini-ai`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/sessions.ts` — sessions table
- `lib/db/src/schema/iterations.ts` — iterations table
- `lib/db/src/schema/app_settings.ts` — settings table (model selection)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/routes/iterations.ts` — Gemini SSE streaming logic
- `artifacts/prompt-engine/src/` — React frontend

## Architecture decisions

- Gemini integration uses Replit AI Integrations (no user API key required)
- SSE streaming for prompt generation: backend sends `{ content, phase }` events with `phase: "reasoning" | "prompt"`, then `{ done: true }`
- The AI output format uses `REASONING:` / `IMPROVED PROMPT:` markers to split reasoning from the final prompt in the stream
- Settings are stored in a single-row `app_settings` table (always upsert id=1)
- OpenAPI spec uses `type: number` (not `type: integer`) to avoid Orval/Zod v3 incompatibility (`zod.int()` only exists in Zod v4)

## Product

Users describe a situation or goal → the engine generates the best possible prompt for it using Gemini → each subsequent iteration shows AI reasoning about how to improve the prompt, producing a progressively better version. Optional: users can give feedback or focus on a specific improvement area (clarity, tone, specificity, etc.).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `@google/genai` must be a direct dependency of `artifacts/api-server` because esbuild externalizes `@google/*` packages
- Run codegen after any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- The `generateIteration` endpoint is SSE — do NOT use the generated React Query hook for it; use raw fetch + ReadableStream

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
