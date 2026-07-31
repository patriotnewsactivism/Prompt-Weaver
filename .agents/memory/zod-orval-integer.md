---
name: Zod v3 + Orval integer type fix
description: Orval generates zod.int() for OpenAPI integer types, but zod.int() only exists in Zod v4. Workspace uses Zod v3.
---

## The Rule
Use `type: number` (not `type: integer`) in `lib/api-spec/openapi.yaml` for all integer fields.

**Why:** Orval v8 generates `zod.int()` for `type: integer` fields. `zod.int()` does not exist in Zod v3 (`^3.x`). The codegen itself succeeds but `pnpm -w run typecheck:libs` fails with `Property 'int' does not exist on type 'typeof import(".../zod")'`.

**How to apply:** Any time you add a numeric field to the OpenAPI spec that would be an integer (IDs, counts, etc.), write `type: number` instead of `type: integer`. The loss of fractional validation is acceptable — integers come from the DB anyway.
