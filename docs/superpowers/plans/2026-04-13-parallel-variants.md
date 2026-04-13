# Parallel Variant Generation + Skeleton-First Rendering

## Context

Variant generation today is sequential: `runGenerationJob` awaits each
`generateVariant` call inside a `for` loop, so a 4-variant run takes
~3-4 minutes wall-time even though each variant is independent. The user also
sees the gallery fill in one card at a time, with no indication of how many
are still coming until each one drops.

This change does two things at once because they pair naturally:

1. **Skeleton-first rendering.** Push placeholder `VariantResult`s into the
   job at the very start, one per planned config, with `status: "pending"`.
   The gallery renders all of them immediately as skeleton cards labelled with
   their `category/gameStyle`. As each variant finishes, the placeholder is
   replaced in place.
2. **Parallel generation with a concurrency cap.** Replace the sequential
   `for await` with a small worker-pool helper that runs N variants in flight
   simultaneously (default 3). For a 4-variant batch this collapses wall-time
   from `sum(variants)` to `max(variants)` — roughly 3-4× faster — without
   slamming the LLM provider with all 4 concurrent streams at once.

## Design

### Schema changes (`src/lib/design-schema.ts`)

- `variantResultSchema.status` gains a `"pending"` enum value.
- `rubricScores` and `issues` become **optional** on `variantResultSchema`,
  because pending variants don't have either yet.

### Pipeline (`src/lib/pipeline.ts`)

- Add a tiny `runWithConcurrency(items, limit, worker)` helper inside the
  file (no new dependency).
- `runGenerationJob`:
  1. For each config, push a placeholder `VariantResult`:
     ```ts
     {
       id: crypto.randomUUID(),
       category, gameStyle,
       status: "pending",
       // design/rubricScores/issues all undefined
     }
     ```
  2. Run the configs through `runWithConcurrency(configs, 3, async (cfg, i) => {
       // existing generateVariant logic, but mutate the existing
       // placeholder in-place by index instead of pushing a new entry
     })`.
  3. After the pool resolves, set `job.status` based on success counts (the
     existing all-failed → `"failed"` logic).
- Drop the `job.currentVariant` field (or keep it as "completed-so-far" for
  backwards compat). I'll keep it as "completed-so-far" since the status
  route already returns it.

### Store (`src/store/design-store.ts`)

- Loosen `DesignVariant` so pending variants can live there too:
  ```ts
  interface DesignVariant {
    id: string;
    category: string;
    gameStyle: string;
    status: "pending" | "complete" | "failed";
    design?: GameDesign;
    rubricScores?: RubricScores;
    error?: string;
  }
  ```
- `addVariant` and `updateVariant` already exist; they're enough.

### Poller (`src/lib/generation-poller.ts`)

- On each tick, walk `job.variants`. For each one:
  - If not seen → `addVariant` (with whatever status the server says, including
    `"pending"`).
  - If seen → `updateVariant(id, { status, design, rubricScores, error })` so
    the placeholder transitions in-place to complete/failed.
- Drop the existing "skip failed" branch — the gallery will render failures
  with the new error card state.
- Failure surfacing logic stays.

### Gallery (`src/app/gallery/[entityId]/page.tsx`)

- Always render variants from the store, regardless of count vs. pending state.
  No more "No variants yet" empty state once a job is in flight — the
  placeholders ARE the loading UI.
- The "More on the way…" extra placeholder card I added recently can be
  removed; placeholders cover that case.
- The big centered spinner empty-state stays for the pre-generate idle state.

### VariantCard (`src/components/gallery/VariantCard.tsx`)

The component already accepts `isGenerating` and `error` and renders skeletons
or error cards. I'll switch it to use `status` directly so it can render:

- `pending` → skeleton with `category` chip and `gameStyle` chip visible at
  the top, a small spinning ring centred, and "Generating…" text. This is
  the new state.
- `complete` → existing full card.
- `failed` → existing error card, but with the same `category`/`gameStyle`
  chips at top so you know which slot died.

## Files

**Modify:**
- `src/lib/design-schema.ts` — add `"pending"` status, loosen optional fields
- `src/lib/pipeline.ts` — add concurrency helper, rewrite `runGenerationJob`
- `src/store/design-store.ts` — broaden `DesignVariant` shape
- `src/lib/generation-poller.ts` — switch to add-or-update logic
- `src/app/gallery/[entityId]/page.tsx` — render placeholders, drop empty state
- `src/components/gallery/VariantCard.tsx` — pending state with chips
- `src/app/editor/[designId]/page.tsx` — guard against opening a pending variant
  (button disabled OR onClick no-op)

## Verification

1. `npm run build` and `npm run lint` clean.
2. Browser walkthrough on Goldfish (or apples):
   - Click Generate → all 4 placeholder cards appear immediately, each
     showing its `category/gameStyle` and a small spinner.
   - Within ~60s, multiple cards transition to the full design view at once
     (because parallel). Watch the network tab — should see ~3 concurrent
     LLM round-trips, not 1.
   - Total wall time should be roughly the time of a single variant
     (~50-90s for qwen-plus), not 3-4 minutes.
   - Click a still-pending card → it should be inert (no navigation).

## Out of scope

- Per-variant progress within the 4-pass pipeline (Pass 1/4, Pass 2/4 …).
- Server-side cancel of an in-flight pending variant.
- Rate-limit-aware adaptive concurrency.
- Streaming Pass 1 token-by-token to the UI.
