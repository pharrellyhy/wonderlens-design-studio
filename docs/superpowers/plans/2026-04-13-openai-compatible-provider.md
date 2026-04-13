# OpenAI-Compatible Provider + Server-Side Env Key Resolution

## Context

Phase 1 ships only `openai` and `anthropic` provider types, both requiring the API key to be entered through the gallery UI bar. Two problems:

1. The `.env` file already holds working API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ALI_API_KEY`, etc.), but the API routes ignore them — the user has to paste a key into the browser every session.
2. To use OpenAI-compatible third-party endpoints (Ali DashScope, OpenRouter, local vLLM), the previous workaround was overloading `OPENAI_BASE_URL` / `OPENAI_MODEL` env vars on the standard `openai` provider. That conflates "real OpenAI" with "anything that speaks OpenAI's protocol."

This change introduces a proper third provider type and lets all providers fall back to server-side env credentials.

## Design

### New provider type

Add `"openai-compatible"` to `LLMProviderType`. Implement `OpenAICompatibleProvider` in `src/lib/llm/openai-compatible.ts`:

- Reuses the OpenAI SDK client (DashScope, OpenRouter, vLLM all speak the OpenAI Chat Completions API).
- Reads `OPENAI_COMPATIBLE_API_KEY`, `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_MODEL` from `process.env` at construction. Constructor still takes an `apiKey` argument so client overrides work, but if it's empty, falls back to env.
- Throws a clear error if neither base URL nor model is configured (these have no sensible defaults).

Revert the `OPENAI_BASE_URL` / `OPENAI_MODEL` reading inside `OpenAIProvider` (commit `2b94187`) — that hack moves to the new provider where it belongs. Plain `openai` goes back to `gpt-4o` against the standard OpenAI endpoint.

### Server-side env key resolution

Add a small helper in `src/lib/llm/provider.ts`:

```ts
export function resolveApiKey(provider: LLMProviderType, clientKey: string): string {
  if (clientKey) return clientKey;
  switch (provider) {
    case "openai": return process.env.OPENAI_API_KEY ?? "";
    case "anthropic": return process.env.ANTHROPIC_API_KEY ?? "";
    case "openai-compatible": return process.env.OPENAI_COMPATIBLE_API_KEY ?? "";
  }
}
```

Update three API routes to use this resolver before calling `createLLMProvider`:

- `src/app/api/generate/route.ts`
- `src/app/api/regenerate/route.ts`
- `src/app/api/evaluate/route.ts`

The "missing apiKey" 400 check moves: it should fail only when both client and env are empty.

### UI changes

`src/app/gallery/[entityId]/page.tsx`:

- Add `"openai-compatible"` as a third option in the provider dropdown (label: "OpenAI-Compatible").
- Make the API key textbox optional. Placeholder text: `"Leave blank to use server env key"`.
- Don't block the Generate button when the key is empty — let the server decide.

`src/store/design-store.ts`:

- Update `LLMProviderType` import (already comes from `@/lib/llm/provider`, no change needed if we re-export).

### .env documentation

Add a comment block to the existing `.env` (or create `.env.example` if missing) showing the new vars. **Do not** commit the actual key — `.env` is gitignored.

## Files

**Modify:**
- `src/lib/llm/provider.ts` — extend `LLMProviderType`, register new constructor, add `resolveApiKey` helper
- `src/lib/llm/openai.ts` — revert env-var reads, restore `gpt-4o` default and standard endpoint
- `src/app/api/generate/route.ts` — use `resolveApiKey`, relax 400 validation
- `src/app/api/regenerate/route.ts` — same
- `src/app/api/evaluate/route.ts` — same (currently also takes apiKey from client)
- `src/app/gallery/[entityId]/page.tsx` — add third dropdown option, soften apiKey requirement

**Create:**
- `src/lib/llm/openai-compatible.ts` — new provider class

## Verification

1. `npm run build` and `npm run lint` clean.
2. Set in `.env`:
   ```
   OPENAI_COMPATIBLE_API_KEY="<ali key>"
   OPENAI_COMPATIBLE_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
   OPENAI_COMPATIBLE_MODEL="qwen-plus"
   ```
3. Run dev server (no env-var hacks in the command line).
4. Browser walkthrough: select "OpenAI-Compatible" in gallery, leave API key blank, click Generate. Variants should generate exactly as before.
5. Sanity check: select "OpenAI", leave API key blank — should use `OPENAI_API_KEY` from `.env` and call real OpenAI. (Don't fully run; just verify no 400 from the route.)
6. Direct `curl` test of `/api/generate` with `apiKey: ""` — should not 400.

## Out of scope

- Per-request model override from the UI.
- Storing/displaying which env keys are configured (a "key status" indicator).
- Provider-specific cost estimates.
- Anthropic base URL override (Anthropic SDK supports it, but no current need).
