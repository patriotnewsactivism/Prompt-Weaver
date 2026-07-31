---
name: Gemini integration @google/genai in api-server
description: @google/genai must be a direct dependency of artifacts/api-server, not just a transitive dep via integrations-gemini-ai.
---

## The Rule
Add `"@google/genai": "^1.44.0"` directly to `artifacts/api-server/package.json` dependencies when using `@workspace/integrations-gemini-ai`.

**Why:** The esbuild config in `artifacts/api-server/build.mjs` externalizes all `@google/*` packages (line 67: `"@google/*"`). This means `@google/genai` is not bundled into `dist/index.mjs`. At runtime Node resolves it from `node_modules`, but since it's only a dep of `lib/integrations-gemini-ai` (not api-server directly), Node cannot find it and throws `ERR_MODULE_NOT_FOUND`.

**How to apply:** Any time you wire `@workspace/integrations-gemini-ai` into `artifacts/api-server`, also add `@google/genai` to api-server's direct dependencies and run `pnpm install --no-frozen-lockfile`.
