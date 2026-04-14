# Cross-Model Evaluation

## Context

Currently `getServerLLMProvider()` reads `LLM_PROVIDER` once and returns
a single provider instance that handles **generate**, **evaluate**, and
**fix** calls in `pipeline.ts`. The same model that produced a design
also grades it against the 10D rubric. This is the textbook setup for
self-grading inflation: the LLM "knows" the intent of its own output and
fills gaps charitably, which is why every variant comes back 10/10 even
on first runs.

The user has already noticed this and wants to move evaluation to a
**different model** so the judge is independent of the author. The pipeline
already cleanly separates the three call types into distinct prompts and
LLM call sites, so the change is small and surgical.

## Goal

Allow the evaluator to be a different `LLMProvider` than the generator,
configured via a separate environment variable. Generation, fix, and
regenerate continue to use `LLM_PROVIDER`; only the evaluate-pass
(including the re-evaluate inside the fix loop) switches to the
`LLM_EVALUATE_PROVIDER`. Default behavior is unchanged when
`LLM_EVALUATE_PROVIDER` is unset — same provider does everything, no
breakage for current setups.

## Design

### Env vars

Add `LLM_EVALUATE_PROVIDER` (one of `openai` | `anthropic` |
`openai-compatible`). When unset or empty, fall back to `LLM_PROVIDER`.
Each provider's `*_API_KEY` env var is reused — no new key vars.

Document recommended pairing in a `.env.example` (or inline in `.env`):
generator on `openai-compatible` (Ali), evaluator on `anthropic` (Claude).
The plan does NOT enforce a specific pairing — any combination works as
long as both keys are present.

### `src/lib/llm/provider.ts`

Add a sibling helper:

```ts
export function getServerEvaluateProvider(): LLMProvider {
  const rawType = process.env.LLM_EVALUATE_PROVIDER ?? "";
  if (rawType.trim() === "") return getServerLLMProvider();
  if (!(rawType in PROVIDER_CONSTRUCTORS)) {
    throw new Error(
      `Invalid LLM_EVALUATE_PROVIDER "${rawType}" — expected one of: ${Object.keys(PROVIDER_CONSTRUCTORS).join(", ")}`,
    );
  }
  const type = rawType as LLMProviderType;
  const apiKey = process.env[ENV_KEY_BY_PROVIDER[type]];
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      `${ENV_KEY_BY_PROVIDER[type]} is not set — required by LLM_EVALUATE_PROVIDER=${type}`,
    );
  }
  return createLLMProvider(type, apiKey);
}
```

When unset, the helper returns the same instance as `getServerLLMProvider()`,
so callers don't have to special-case the "single-model" path. The error
messages are explicit so a misconfigured eval provider doesn't get silently
masked by the fallback.

### `src/lib/pipeline.ts`

`generateVariant` currently takes a single `provider: LLMProvider`. Change
its signature to accept two:

```ts
export async function generateVariant(
  entity: ParsedEntity,
  category: Category,
  gameStyle: string,
  generationMode: GenerationMode,
  providers: { generator: LLMProvider; evaluator: LLMProvider },
  options?: { parentDesignId?: string; designId?: string },
): Promise<VariantResult>
```

Internally:
- **Pass 1 (Generate)** uses `providers.generator`
- **Pass 2 (Evaluate)** uses `providers.evaluator`
- **Pass 3 (Fix)** uses `providers.generator` — fix is a creative task; the
  generator owns content quality. Keeping fix on the generator side also
  preserves the chain-of-thought continuity (the model that wrote the design
  is in the best position to repair it).
- **Pass 4 (Re-evaluate)** uses `providers.evaluator`

Update the same way:
- `runGenerationJob(...)` — propagate a `providers` object instead of a
  single provider
- `enqueueSingleVariantJob(...)` — same

The `applyD4Override` deterministic check is provider-free (pure function
over a `GameDesign`), so it doesn't change.

### API routes

Four routes touch a provider today:

- `src/app/api/generate/route.ts` — needs both
- `src/app/api/generate/opposite/route.ts` — needs both
- `src/app/api/evaluate/route.ts` — needs only evaluator
- `src/app/api/regenerate/route.ts` — needs only generator (regenerate is
  a creative call, not an evaluation)

Each route calls `getServerLLMProvider()` and/or `getServerEvaluateProvider()`
in a try/catch and returns a 500 with a clear message on failure. The
`generate` and `generate/opposite` routes resolve both, then pass the
`{ generator, evaluator }` object into `runGenerationJob`/`enqueueSingleVariantJob`.

### Telemetry / logging

Right now the pipeline silently uses one provider. With two providers
in play, debug logs become harder to trace. Add provider name to the
existing failure log line in `runGenerationJob`:

```ts
console.error(
  `[pipeline] variant ${index + 1}/${...} failed (gen=${providers.generator.name}, eval=${providers.evaluator.name}, ${config.category}/${config.gameStyle}):`,
  error,
);
```

This is a one-line change but makes 401-style errors trivially
attributable to the right model.

### Run record

`RunRecord` in `src/lib/runs-repository.ts` does not currently carry
provider info. **Out of scope for this plan.** A future enhancement
could add `generatorProvider` + `evaluatorProvider` fields to the record
so the library can show per-run model attribution, but it's not required
for cross-model evaluation to work.

## Files to change

| Path | Change |
|---|---|
| `src/lib/llm/provider.ts` | Add `getServerEvaluateProvider()` |
| `src/lib/pipeline.ts` | Thread `{ generator, evaluator }` through `generateVariant`, `runGenerationJob`, `enqueueSingleVariantJob`; update logging |
| `src/app/api/generate/route.ts` | Resolve both providers, pass to `runGenerationJob` |
| `src/app/api/generate/opposite/route.ts` | Resolve both providers, pass to `enqueueSingleVariantJob` |
| `src/app/api/evaluate/route.ts` | Switch from `getServerLLMProvider()` to `getServerEvaluateProvider()` |
| `src/app/api/regenerate/route.ts` | Stays on `getServerLLMProvider()` (no change needed beyond confirming it's the generator path) |
| `.env` (or `.env.example`) | Document `LLM_EVALUATE_PROVIDER` with a recommended pairing |

## Do NOT

- Do NOT add a UI control for picking the evaluator. Same principle as
  the prior plan: LLM config is operational, not user-facing.
- Do NOT introduce a third provider for fix. Fix is part of the
  generation chain; splitting it across three providers is over-engineering
  with no clear win.
- Do NOT touch `RunRecord` schema. Persistence-side provider attribution
  is a separate plan.
- Do NOT change rubric criteria or prompt content. The whole point is to
  isolate the *judge identity* variable; mixing rubric edits in muddies
  the signal.
- Do NOT add provider switching at request time (e.g., a `?evaluator=`
  query parameter). Server config is the single source of truth.

## Trade-offs and risks

1. **Doubled API budget per generation.** Today a 4-variant run hits the
   LLM ~4 × 4 = 16 times (gen + eval + up to 1 fix iter + re-eval per
   variant) on one provider. With cross-model, the same 16 calls split
   across two providers' budgets. This is a billing change, not a
   technical one — flag it in the env doc.

2. **Two failure surfaces.** A 401 on the generator and a 401 on the
   evaluator now look different in the gallery error banner. The
   pipeline log line update above gives you the attribution.

3. **Anthropic + Ali is a sensible default but not enforced.** If the
   user picks two providers that both grade leniently, scores stay
   inflated. The win comes from *different model families*, not just
   different providers — `LLM_EVALUATE_PROVIDER=openai-compatible` with
   the same Ali model as the generator gives zero benefit.

4. **Eval-only provider needing its own base URL/model env vars.** For
   `openai-compatible`, the `BASE_URL` and `MODEL` env vars are shared
   across both generator and evaluator (since the existing
   `OpenAICompatibleProvider` reads them from process.env at construct
   time). If the user wants a different Ali model for eval, the
   constructor would need separate `OPENAI_COMPATIBLE_EVAL_BASE_URL`
   and `OPENAI_COMPATIBLE_EVAL_MODEL` vars. **Out of scope for this
   plan** — flag as a follow-up if the user picks two openai-compatible
   providers and wants distinct models. Most cross-model setups will
   use *different provider types* (Anthropic vs Ali), which sidesteps
   the issue entirely.

5. **Fix loop cost.** Higher rubric strictness (the whole point) means
   fewer 10/10 first-pass results, which means the fix loop kicks in
   more often. Each fix iteration is ~2 LLM calls (fix + re-eval). The
   `MAX_FIX_ITERATIONS = 3` cap still applies, so a worst-case variant
   now costs ~1 + 1 + 3·(1+1) = 8 calls instead of the optimistic ~3.
   Acceptable for dev; flag in the env doc.

## Verification (manual)

After implementation lands:

- **Single-provider regression**: leave `LLM_EVALUATE_PROVIDER` unset.
  Behavior should be identical to today (same provider does everything,
  same scores).

- **Cross-model happy path**: set `LLM_PROVIDER=openai-compatible` +
  `LLM_EVALUATE_PROVIDER=anthropic` with both keys. Generate 4 variants.
  Expect:
  - Mixed pass/fail rubric scores (NOT all 10/10)
  - Fix loop kicks in on at least some variants
  - Pipeline log shows `gen=openai-compatible, eval=anthropic` on
    failures
  - Gallery renders correctly with non-perfect scores

- **Misconfigured evaluator**: set `LLM_EVALUATE_PROVIDER=anthropic`
  but leave `ANTHROPIC_API_KEY` unset. First generation request returns
  a 500 with `"ANTHROPIC_API_KEY is not set — required by
  LLM_EVALUATE_PROVIDER=anthropic"` surfaced in the gallery error banner.

- **Invalid evaluator name**: set `LLM_EVALUATE_PROVIDER=nonsense`.
  500 with `"Invalid LLM_EVALUATE_PROVIDER"`.

- **Score distribution sanity check**: run the same entity 3-5 times
  with cross-model on. The pass-rate per dimension should vary across
  runs and across dimensions. If every run still produces 10/10, the
  evaluator model is also too lenient and the next lever is rubric
  prompt sharpening (separate plan).

## Success criteria

- `npm run build` + `npm run lint` clean
- Default behavior (no env var change) produces identical output
- Setting `LLM_EVALUATE_PROVIDER` to a different provider type yields
  visibly different rubric scores on the same entity, with at least
  some non-passing dimensions on first-pass evaluation
- Pipeline log line attributes failures to the correct provider
- No client-side config surface added; all routing decisions remain
  server-side
