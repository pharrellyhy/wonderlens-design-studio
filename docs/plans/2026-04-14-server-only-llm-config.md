# Server-Only LLM Provider + API Key

## Context

Today the UI exposes `llmProvider` and `apiKey` in the gallery settings bar.
The client sends both to every `/api/*` route, and the server uses the
client key if non-empty, otherwise falls back to `process.env[*_API_KEY]`
via `resolveApiKey()`.

Two problems:

1. **Stale 401.** The user keeps hitting `401 Incorrect API key provided`
   from the `openai-compatible` backend (Aliyun/DashScope). The Zustand
   store's `apiKeys` map holds whatever the user typed in the current
   session; even though `partialize` drops it from localStorage on refresh,
   a reload + a re-entered or auto-filled key can still be wrong or stale,
   and the server happily uses whatever the client sends.
2. **Leaky surface.** The provider name and the API key field are visible
   in the gallery header. Even with `type="password"` on the input, the
   user wants them off the UI entirely: LLM config should be a server-side
   operational concern, not a per-session user choice.

## Goal

Make LLM provider + API key strictly server-side. The client knows
nothing about either; the server reads both from environment variables
on every request. No round-trip of credentials.

## Design

### Env vars (server-only)

Add `LLM_PROVIDER` (one of `openai` | `anthropic` | `openai-compatible`;
default `openai-compatible`). The existing per-provider env keys stay:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_COMPATIBLE_API_KEY` (+ `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_MODEL`)

### `src/lib/llm/provider.ts`

Add a new helper:

```ts
export function getServerLLMProvider(): LLMProvider {
  const type = (process.env.LLM_PROVIDER ?? "anthropic") as LLMProviderType;
  if (!(type in PROVIDER_CONSTRUCTORS)) {
    throw new Error(
      `Invalid LLM_PROVIDER "${type}" — expected one of: ${Object.keys(PROVIDER_CONSTRUCTORS).join(", ")}`,
    );
  }
  const apiKey = process.env[ENV_KEY_BY_PROVIDER[type]];
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      `${ENV_KEY_BY_PROVIDER[type]} is not set — configure it in the server environment`,
    );
  }
  return createLLMProvider(type, apiKey);
}
```

Retire `resolveApiKey()` (only consumer was the routes; simpler to nuke
it along with the client-side key plumbing). Keep `createLLMProvider` and
`LLMProviderType` — they're still used internally.

### API routes — drop client-side provider/key

Four routes accept `llmProvider` + `apiKey` in their request body:

- `src/app/api/generate/route.ts`
- `src/app/api/generate/opposite/route.ts`
- `src/app/api/evaluate/route.ts`
- `src/app/api/regenerate/route.ts`

Each route:

1. Remove `llmProvider` and `apiKey` from the Zod request schema / body
   destructuring
2. Remove the `resolveApiKey` call and the 400 response for "no API key"
3. Replace `createLLMProvider(llmProvider, resolvedKey)` with
   `getServerLLMProvider()`
4. Wrap the call in a try/catch so a missing `LLM_PROVIDER`/key becomes a
   clean 500 with a "Server LLM provider not configured" message instead
   of an uncaught throw

The 400 "missing llmProvider" checks also go.

### `src/lib/api-client.ts`

Strip `llmProvider` and `apiKey` fields from `GenerateParams`,
`GenerateOppositeParams`, `EvaluateParams`, `RegenerateParams`. The
typed interfaces shrink; callers in the UI that used to pass those
fields also drop them.

### `src/store/design-store.ts`

Remove from the store:

- `llmProvider` state + `setLlmProvider`
- `apiKeys` state + `setApiKey`
- `LLMProviderType` import

Simplify `partialize` to persist nothing from this slice (or drop the
`persist` wrapper entirely if no other field is persisted — check
first). Drop the version-3 migration since nothing persisted remains;
we can safely leave the existing `version: 3` and let it no-op.

Actually: keep the `persist` wrapper — we may want to persist other
session state later. Just drop `llmProvider` from `partialize`. The
`migrate` function returns an empty object for v3+.

### UI removals

**`src/app/gallery/[entityId]/page.tsx`**

- Remove the `<label>` blocks for "Provider" and "API Key" from the LLM
  settings bar (lines 306–332 area)
- Drop the store selectors and handlers: `llmProvider`, `apiKey`,
  `setLlmProvider`, `setApiKey`
- Drop the `llmProvider` / `apiKey` fields from `startGeneration()` and
  `generateOppositeVariant()` calls
- The "Mode" dropdown stays in the settings bar (it's still a user
  choice)
- If the settings bar now only contains the Mode dropdown, consider
  collapsing the bar. Alternatively, move the Mode dropdown into the
  header alongside other controls. **Decision:** leave the bar in place
  with just Mode — minimal diff, easy to add other server-side display
  info later

**`src/app/editor/[designId]/page.tsx`**

- Drop `llmProvider`, `apiKey` store selectors
- Drop them from `evaluateDesign()` and `regenerateField()` calls
- Remove the "if (!apiKey) early return" guards on the rerun-rubric and
  regenerate-with-feedback handlers (no client-side key to check — the
  server errors propagate up through `apiFetch`)

### Error surfacing

When `getServerLLMProvider()` throws inside a route, the try/catch
returns a 500 with the error message. The client's `apiFetch()` picks
up `body.error` and throws it as a JS `Error`, which the UI already
displays via `setGenerationError(err.message)`. No new UI plumbing
needed.

## Files touched

| Path | Change |
|---|---|
| `src/lib/llm/provider.ts` | Add `getServerLLMProvider`, retire `resolveApiKey` |
| `src/app/api/generate/route.ts` | Drop client-side llmProvider/apiKey |
| `src/app/api/generate/opposite/route.ts` | Same |
| `src/app/api/evaluate/route.ts` | Same |
| `src/app/api/regenerate/route.ts` | Same |
| `src/lib/api-client.ts` | Shrink params interfaces |
| `src/store/design-store.ts` | Remove `llmProvider` + `apiKeys` from store, simplify `partialize` |
| `src/app/gallery/[entityId]/page.tsx` | Remove Provider + API Key UI, drop store selectors + call-site args |
| `src/app/editor/[designId]/page.tsx` | Drop store selectors + call-site args + apiKey guards |

Plus a short note in `.env` (or `.env.example` if we add one) documenting
`LLM_PROVIDER`.

## Do NOT

- Do NOT change the `openai-compatible` provider internals
- Do NOT add any kind of "admin settings" UI — the point is that config
  lives in env
- Do NOT touch the `generationMode` toggle or the mode comparison cards
- Do NOT introduce any new env-var-reading code in routes beyond
  `getServerLLMProvider()` — single choke point

## Verification

- `npx tsc --noEmit` clean
- `npm run lint` clean
- `npm run build` clean
- Start dev server, set `LLM_PROVIDER=anthropic` + valid `ANTHROPIC_API_KEY`
  in `.env`, upload a YAML, generate → all 4 variants succeed
- Clear `ANTHROPIC_API_KEY` temporarily → 500 with "ANTHROPIC_API_KEY is
  not set" surfaced in the gallery error banner
- Set `LLM_PROVIDER=nonsense` → 500 with "Invalid LLM_PROVIDER" surfaced
  in the banner
- Confirm the gallery header no longer shows provider dropdown or API
  key field
- Confirm the Zustand store devtools snapshot has no `llmProvider` or
  `apiKeys` fields

## Migration note

Any user who had typed a key into the UI will lose it on the next
session. That's intentional — there's no UI to recover it. Document
the `LLM_PROVIDER` env var requirement in `.env` so whoever runs the
dev server knows to set it.
