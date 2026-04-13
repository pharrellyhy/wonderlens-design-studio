# Game Design Schema + UX Changes — Bringing design-studio closer to autodesign

## Context

This change set closes four concrete gaps between `wonderlens-design-studio` (Next.js SaaS, current) and the original `wonderlens-activity-autodesign` (autonomous agent factory, source of truth). The gaps were identified by surveying both repos plus `wonderlens-activity-fullstack-demo` (the live player).

The four gaps:

1. **Mapping-informed vs freeform generation** — autodesign has two distinct generation contracts (Batch 1 freeform, Batch 2 mapping-informed with dual bridges); design-studio has neither as a first-class switch.
2. **`tomorrowHook` + `conceptReinforcement` on the closing step** — present in autodesign exemplars and `fullstack-demo`'s `VoiceScript`, absent from design-studio's `GameDesign` shape. The former is a cross-session retention line; the latter makes IB concept alignment auditable by the rubric rather than hidden inside prose.
3. **Opposite-category variant mode** — autodesign's Batch 3 took the same entity and produced the *other* category to create contrasting siblings. Design-studio has no notion of generating "the opposite."
4. **Batch / comparative view + results log** — autodesign writes every run to `results.tsv`; design-studio has no cross-design view and no persistence at all (job store is `globalThis`-pinned in-memory, jobs auto-cleaned after 30 min).

**Outcome we want:** Users can generate in freeform or mapping-informed mode, edit richer closings, lazily produce opposite-category siblings of favorite variants, and see every run they've produced in a persisted library view with leaderboard-style rubric visibility.

## Scope caveats

- **Dev-only persistence.** `data/runs/` is a transitional file-based store. It is NOT safe on Vercel serverless (ephemeral filesystem). All filesystem access is isolated in `src/lib/runs-repository.ts` so the module can be swapped when real deployment persistence is chosen (Postgres, KV, blob storage). Do not leak filesystem concerns into callers.
- **No test harness.** Design-studio has no `*.test.ts` files today. Verification in this plan is manual. Adding a real test harness is a separate future change.
- **No Prisma.** Despite `CLAUDE.md` mentioning PostgreSQL via Prisma, no `prisma/` directory exists yet. This plan does **not** introduce Prisma. That is a deliberate scope decision.
- **Editor closing step.** The `closing` step in `src/lib/design-schema.ts` gains two new required fields. Since there are no persisted designs in production yet, no migration is needed. If older run files appear during development, treat them as invalid and regenerate.

---

## Section 1 — Schema changes

**File:** `src/lib/design-schema.ts`

Additive changes to the Zod schema + TS types:

1. **`GameDesign.basicInfo.generationMode`** (new required field)
   - Type: `z.enum(["freeform", "mapping-informed"])`
   - Default when missing: reject via Zod (require explicit)
2. **Closing step (`steps[].type === "closing"`) gains two new required string fields**
   - `conceptReinforcement: z.string().min(1)` — one line that explicitly names at least one of the design's `coreKeyConcepts[]`
   - `tomorrowHook: z.string().min(1)` — one-line teaser for the next session

Rubric D5 (IB framework alignment) in the evaluator gains a deterministic pre-check: `conceptReinforcement` must contain a substring match (case-insensitive) of at least one `basicInfo.coreKeyConcepts[]` entry. If this check fails, D5 is marked `fail` without calling the LLM. If it passes, D5 proceeds to its existing LLM-based holistic check.

**Files touched:**
- `src/lib/design-schema.ts` — add the three fields to the Zod schema + TS types
- `src/lib/rubric.ts` (or wherever D5 evaluation lives — confirm at implementation time; likely `src/app/api/evaluate/route.ts` or a helper module) — add the deterministic pre-check

---

## Section 2 — Generation pipeline changes

**Files:** `src/lib/pipeline.ts`, `src/app/api/generate/route.ts`, new `src/app/api/generate/opposite/route.ts`

### Mode-aware prompt construction

The pipeline's Generate pass (Pass 1 in the multi-pass flow) now branches on `generationMode`:

**Freeform mode** (`generationMode: "freeform"`)
- System prompt reads entity YAML for `themes[]` and `keyConcepts[]` only.
- `tier_guidance` is injected as **soft guidance**: "Preferred language complexity and dimension profile. You may diverge when it serves the activity."
- Bridge step produces a single generic opener. `warmStart` is populated; `coldStart` is an empty string (`""`) by convention.
- `conversation_bridge.md` content is **not** injected into the system prompt.

**Mapping-informed mode** (`generationMode: "mapping-informed"`)
- System prompt reads entity YAML in full, including `tier_guidance.tier_X.dimensions`.
- `tier_guidance` is injected as **hard constraint**: "You must follow the tier-X language and dimension profile exactly."
- Bridge step produces **both** `warmStart` and `coldStart`, each grounded in a named dimension from the mapping. Prompt instructs: "Use dimension `<name>` as the topical anchor. The two bridges must reference different dimensions."
- `conversation_bridge.md` flavor patterns (Recall / Discovery / Curiosity / Challenge) are injected into the system prompt. The LLM picks the flavor that best fits the dimension.

Both modes write to the same `GameDesign` shape — only the content differs.

### New endpoint: opposite-category generation

**File:** `src/app/api/generate/opposite/route.ts` (new)

- `POST /api/generate/opposite` body: `{ sourceDesignId: string }`
- Handler pulls the source design from the job store (or rehydrates from `runs-repository` if not in memory), flips `basicInfo.category` (cat1 ↔ cat5), picks a default game style for the opposite category (first entry in `game_styles.md` for that category), and invokes `pipeline.generateOne(...)` with the new (entity, category, style, mode) tuple.
- The resulting run file has `isOpposite: true` and `parentRunId: <source>`. The source design's run file is **not** mutated — the link is expressed on the child only.
- The opposite generation inherits the source design's `generationMode` so comparisons are apples-to-apples.
- The handler returns a jobId; the client polls `/api/generate/[jobId]/status` as with normal generation.

**Reuse:** `src/lib/pipeline.ts` — the existing `generateOne` / multi-pass loop is called directly. No duplicated generation logic.

---

## Section 3 — UI changes

### Upload / generate form

**File:** the upload component under `src/components/upload/` (confirm exact filename at implementation — `YamlUploader.tsx` per CLAUDE.md). Keep the toggle encapsulated in the upload component, not in `src/app/page.tsx`, so the page stays a thin server-component wrapper.

- New two-state toggle above the "Generate variants" button, labeled **Mapping-informed** / **Freeform**.
- Default state: `mapping-informed`.
- Tooltip on hover explains the difference.
- Toggle state flows into the `POST /api/generate` body as `generationMode`.
- Toggle state is local React state only — no persistence across reloads.

### Variant gallery

**Files:** `src/components/gallery/VariantCard.tsx`, `src/app/gallery/[entityId]/page.tsx`

- Each `VariantCard` header gains a small pill badge showing its mode: blue "mapping" or grey "freeform".
- Each `VariantCard` action row gains a new button: **⇄ Generate opposite**.
- Click flow:
  1. `POST /api/generate/opposite` with the card's designId → returns jobId
  2. A skeleton card renders immediately in the grid, slotted next to the parent (same row position, indented / with a connector line)
  3. Existing polling (`/api/generate/[jobId]/status`) updates the skeleton to the final card
  4. On success, the opposite card renders with its own badge: orange pill "cat5 · opposite" (or "cat1 · opposite")
- The parent card's **⇄ Generate opposite** button becomes disabled once an opposite exists for it. Detection mechanism: on gallery page load, call a new helper `listOppositesFor(parentDesignIds: string[]): Record<designId, boolean>` that wraps `runs-repository.findOppositeOf` for each variant, and store the result in a gallery-page `Set<string>`. On successful opposite generation, add the source designId to the same Set optimistically so the button disables without a refetch.
- Opposite cards carry a subtle visual link to their parent: left border in the opposite's accent color + a "⇄ sibling" tag next to the card title.

### Editor

**Files:** `src/components/editor/` — likely changes to the closing step renderer + `EditableField` usage.

- Closing step section gains two labeled textareas under the existing closing dialogue block: `conceptReinforcement` and `tomorrowHook`.
- Each textarea has its own per-field "Ask AI" button, reusing the existing regenerate infrastructure (`/api/regenerate`).
- Editor header gains a small mode chip next to the design title showing "mapping" or "freeform" so the user knows which contract the design was generated under.

### New batch/library view

**Files:** `src/app/library/page.tsx` (new), plus supporting components under `src/components/library/`.

- New top-level route `/library`.
- Global nav (app shell / header) gains a "Library" link. If no nav header exists yet, introduce a minimal one in `src/app/layout.tsx`.
- Segmented control at the top of the page toggles between two tabs:
  - **Table tab** (primary, Option A from the mockup): sortable columns — entity, category (cat1/cat5), game style, mode (mapping/freeform), opposite indicator, D1–D9 as nine pass/fail dots, score (X/9), timestamp, actions (Open / Export / Delete). Client-side sort and filter; no server paging (sufficient for thousands of rows). "Export CSV" button dumps current filtered view.
  - **Grid tab** (Option B from the mockup): responsive card grid matching the variant gallery's visual style, one card per run, reading from `runs-repository`.
- **Empty state:** "No runs yet. Generate your first design from the upload page →"
- **Pair grouping:** in both tabs, opposite siblings are visually grouped with their parent — in the table, the opposite row is indented under its parent with a `⇄` glyph; in the grid, the opposite card is placed immediately after its parent.
- **Open action:** when user clicks Open on a run, the server reads the run file, pushes the full `GameDesign` back into the in-memory job store under its original `designId`, and redirects to `/editor/[designId]`. This restores editability — AI regen, export, re-run rubric all work. See Section 4 for the rehydration mechanic.

---

## Section 4 — Persistence

**New file:** `src/lib/runs-repository.ts`

One new module, one new directory, nothing else touches the filesystem directly.

### Directory layout

- `data/runs/` — gitignored (add to `.gitignore`), with a `.gitkeep` so the empty dir survives clones.
- Filename convention: `<ISO-timestamp>-<entity-slug>-<category>-<6-char-hash>.json`
  - Example: `2026-04-14T10-30-22-123Z-banana-cat1-a3f29e.json`
  - Timestamp-prefix sorts correctly with `fs.readdir().sort()`.
  - Hash suffix prevents collisions when two runs complete within the same millisecond.

### Run file shape

```ts
{
  runId: string,                     // same as the filename's hash slug
  timestamp: string,                  // ISO 8601
  entity: string,                     // slug from uploaded YAML
  entityDisplayName: string,          // human-readable label
  category: "cat1" | "cat5",
  gameStyle: string,
  generationMode: "freeform" | "mapping-informed",
  isOpposite: boolean,
  parentRunId: string | null,         // set iff isOpposite === true
  rubric: {
    d1: "pass" | "fail",
    d2: "pass" | "fail",
    d3: "pass" | "fail",
    d4: "pass" | "fail",
    d5: "pass" | "fail",
    d6: "pass" | "fail",
    d7: "pass" | "fail",
    d8: "pass" | "fail",
    d9: "pass" | "fail"
  },
  totalScore: number,                 // 0..9, sum of passes
  designId: string,                   // matches the id in the in-memory job store at generation time
  design: GameDesign,                 // full serialized design — powers rehydration on Open
  durationMs: number                  // end-to-end generation time for this run
}
```

Storing the full `design` bumps file size to ~20–50 KB each but eliminates dead-link failures in the library (where a design might otherwise have been cleaned out of the in-memory job store after 30 min). The library becomes a durable archive for free.

**Note on `generationMode` denormalization:** `generationMode` appears both at the run record top level (for fast filtering in the library without parsing the embedded design) AND inside `design.basicInfo.generationMode` (as the design's own record of how it was generated). These values must always agree. `saveRun()` should copy from `design.basicInfo.generationMode` into the top-level field, never the other way around — the design is the source of truth.

### Module API (`src/lib/runs-repository.ts`)

```ts
export interface RunRecord { /* shape above */ }

export async function saveRun(run: RunRecord): Promise<void>
// Writes one file to data/runs/ atomically: fs.writeFile(tmpPath, json)
// followed by fs.rename(tmpPath, finalPath). Prevents half-written files
// from partial crashes.

export async function listRuns(): Promise<RunRecord[]>
// fs.readdir + fs.readFile + JSON.parse for every file. Returns sorted
// descending by timestamp. No caching in v1 — re-reads every call.
// Add an in-memory cache later if the library feels slow.

export async function getRun(runId: string): Promise<RunRecord | null>
// Scans filenames for the runId suffix, reads + parses the match.

export async function deleteRun(runId: string): Promise<void>
// Removes the file. Idempotent — missing file is a no-op.

export async function findOppositeOf(parentRunId: string): Promise<RunRecord | null>
// Convenience used by gallery (to disable the opposite button) and library
// (to pair-group siblings).
```

### Wiring

- `src/lib/pipeline.ts` — after each completed variant generation (including opposites), calls `saveRun()` with the assembled `RunRecord`. Compute `rubric` and `totalScore` from the final evaluation pass.
- `src/app/library/page.tsx` — server component, calls `listRuns()` directly. No new API route needed (pure read view).
- `src/app/api/generate/opposite/route.ts` — calls `getRun(sourceRunId)` to fetch the parent if not in the job store; calls `saveRun()` for the child.
- `src/app/editor/[designId]/page.tsx` — gains a fallback in its design loader: if the `designId` isn't in the in-memory job store, call a new lookup helper (lists run files, finds one whose `designId` matches, or accepts `runId` as an alias query param) to rehydrate the design into the job store before rendering.
- `src/app/api/library/[runId]/delete` (optional new route) OR inline server action from the library page — handles deletion. Simplest: a server action invoked from the Delete button.

### Atomicity and concurrency

- Atomic writes via `.tmp` + `rename`. No partial reads.
- No locking needed: each run writes to a unique filename (timestamp + hash suffix).
- Reads are best-effort snapshots — `listRuns()` may briefly include a run file mid-write, but `JSON.parse` will either succeed (complete file) or throw (impossible with atomic rename). Wrap per-file parsing in `try/catch` and skip unparseable files with a `console.warn` — the `.tmp` file race window is microseconds.

### Dev-only disclaimer

This entire persistence layer is transitional. It works for local dev and single-instance self-hosting. It does **not** work on Vercel serverless or any environment with an ephemeral filesystem. When production deployment is planned, a follow-up change replaces `runs-repository.ts` with a real backend (Postgres via Prisma, Cloudflare KV + R2, Upstash, etc.). Callers must continue to go through the repository module — no direct filesystem access from anywhere else in the codebase.

---

## Section 5 — Verification (manual)

No automated tests exist. Run these after each section is implemented.

### After Section 1 (schema + rubric)
- `npm run build` passes with the new Zod fields.
- Hand-craft a `GameDesign` JSON missing `tomorrowHook`; confirm `z.parse()` rejects with a clear error.
- `POST /api/evaluate` on a design with an empty `conceptReinforcement` → D5 reports `fail` deterministically.
- `POST /api/evaluate` on a design whose `conceptReinforcement` explicitly names one of `coreKeyConcepts[]` → D5 proceeds to the LLM holistic check.

### After Section 2 (pipeline + opposite endpoint)
- Upload a real entity YAML (e.g., copy `banana.yaml` from autodesign's `data/mappings_dev20_0318/` into a local test file), generate with `generationMode: "mapping-informed"` → bridge step has two distinct non-empty lines, each referencing a dimension from the mapping.
- Same YAML, `generationMode: "freeform"` → bridge step has one opener in `warmStart`, `coldStart` is empty, no dimension-grounded language.
- `POST /api/generate/opposite { sourceDesignId }` with a cat1 design id → a cat5 sibling run file appears in `data/runs/` with `isOpposite: true` and `parentRunId` set correctly.
- Attempt opposite on a design that already has one (client-side) → confirm the gallery button is disabled.

### After Section 3 (UI)
- Upload page: toggle switches state, visually updates, flows into the next generate request (inspect network tab).
- Gallery: click **⇄ Generate opposite** on a variant card → skeleton renders next to the parent immediately, polling updates the skeleton, the final opposite card appears with the correct badge and visual linkage.
- Editor: the two new textareas render on closing step, accept edits, persist in the in-memory store, regenerate via per-field "Ask AI".
- `/library`: navigate via header link, confirm recently generated runs appear in both tabs. Sort by score in the Table tab. Click Open on a run → editor loads successfully and all actions (regen, export, re-run rubric) work. Click Delete on a run → file is removed from `data/runs/`, row disappears, no server errors.
- Pair grouping: after generating at least one parent + opposite, confirm both tabs visually group them.

### After Section 4 (persistence)
- Generate a design → a file appears in `data/runs/` with the expected filename pattern and full shape.
- Kill dev server (`Ctrl+C`), restart, navigate to `/library` → the run is still there.
- Manually delete a file from `data/runs/` while server is running, reload `/library` → the row is gone (no stale cache).
- Trigger two generations in quick succession (parallel variants) → both run files land without collision. Inspect filenames to confirm distinct hash suffixes.
- Stress the atomic rename: create `data/runs/foo.tmp` manually, reload `/library` → the `.tmp` file does not appear in `listRuns()` results.

### Full end-to-end golden path
1. Upload banana YAML.
2. Generate 2 variants in mapping-informed mode.
3. Click **⇄ Generate opposite** on one variant; opposite cat5 sibling appears in the gallery.
4. Open the opposite in the editor, edit `tomorrowHook`, re-run rubric.
5. Navigate to `/library` → 3 run files visible (2 parents + 1 opposite), pair grouping shows the opposite indented under its parent, one run shows updated rubric score after the edit.
6. Export CSV from library → downloaded file contains the visible rows with all columns.
7. Click Delete on one run → removed from library view and from `data/runs/`.

---

## Critical files

### New files
- `src/lib/runs-repository.ts` — filesystem-backed run persistence
- `src/app/api/generate/opposite/route.ts` — opposite-category generation endpoint
- `src/app/library/page.tsx` — new library route (server component)
- `src/components/library/RunsTable.tsx` — Table tab primary component
- `src/components/library/RunsGrid.tsx` — Grid tab primary component
- `src/components/library/LibraryTabs.tsx` — segmented control + tab state
- `data/runs/.gitkeep` — preserves the empty run directory

### Modified files
- `src/lib/design-schema.ts` — add `generationMode`, `conceptReinforcement`, `tomorrowHook` to Zod + TS types
- `src/lib/pipeline.ts` — branch prompt construction on `generationMode`; call `saveRun()` after each completed generation (reuses existing multi-pass loop)
- `src/app/api/generate/route.ts` — accept `generationMode` in POST body, pass through to pipeline
- `src/app/api/evaluate/route.ts` (or wherever D5 lives) — add deterministic pre-check on `conceptReinforcement`
- `src/app/api/regenerate/route.ts` — ensure per-field regen works for the two new closing fields (likely already generic)
- `src/components/upload/YamlUploader.tsx` — add the mapping/freeform toggle UI
- `src/components/gallery/VariantCard.tsx` — mode badge + opposite button + visual sibling linkage
- `src/app/gallery/[entityId]/page.tsx` — handle opposite-generation flow (skeleton slot, polling, result placement)
- `src/app/editor/[designId]/page.tsx` — rehydrate from runs-repository when designId is missing from job store
- `src/components/editor/` (specifically the closing step renderer) — add `conceptReinforcement` and `tomorrowHook` textareas with per-field Ask AI
- `src/app/layout.tsx` — add Library link to nav header (create minimal nav if none exists)
- `.gitignore` — add `data/runs/*.json` (keep `.gitkeep`)

### Reference files (read-only, informing prompt construction)
- `data/program.md` — rubric definitions; ensure D5 evaluation refers to these
- `data/templates.md` — Cat 1 / Cat 5 templates; mode-aware prompt construction draws from these
- `data/entity_guidance.md` — mapping schema; mapping-informed mode uses this
- `data/conversation_bridge.md` — flavor patterns; injected only in mapping-informed mode
- `data/game_styles.md` — used by opposite endpoint to pick a default style for the flipped category

---

## Execution order

Sections are listed in dependency order — do them sequentially:

1. **Section 1 (schema + rubric)** — foundation; everything else relies on the new fields
2. **Section 4 (persistence)** — build `runs-repository.ts` before the pipeline needs to call `saveRun()`
3. **Section 2 (pipeline + opposite endpoint)** — wires generation to the new fields, the mode toggle, and persistence
4. **Section 3 (UI)** — consumes all the above
5. **Section 5 (verification)** — run after each section, and as a final end-to-end pass

Each section ends with a commit using the conventional commit format already in use (`feat(scope): ...`). No auto-commits per CLAUDE.md — commit only when explicitly asked.

---

## Out of scope (deferred)

- Introducing Prisma or a real database
- Live player / widget rendering (fullstack-demo's `ScreenFrame` concept)
- Multi-agent pipeline refactor (Director / Script / Visual agents)
- Promoting `reflectiveQuestion` from cat5-only to universal closing
- Structured `awardedTitle` on celebration step
- Automated test harness (`*.test.ts` files)
- Session / auth changes
- Production deployment concerns (Vercel compatibility, blob storage, etc.)
- Server paging or virtualization in the library Table tab
