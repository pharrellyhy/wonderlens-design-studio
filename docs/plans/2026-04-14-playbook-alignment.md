# Playbook Alignment — 10D Rubric, Experience Pillars, 12 Game Styles, Bracket Tone Markers

## Context

`docs/game_design_playbook.md` is the new source of truth for WonderLens game design. It diverges substantially from what `wonderlens-design-studio` currently implements, which was derived from an earlier version of the autodesign repo. Two specific user-flagged concerns triggered this plan:

1. AI dialogue tone markers should be wrapped in square brackets (`[warm]`) not parentheses (`(warm)`).
2. The rubric has **10 dimensions** in the playbook, not 9.

Beyond those, a full walkthrough of the playbook revealed broader structural divergence: **6 Experience Pillars**, **12 game styles** (none of the current style names survive), and rubric dimensions that are not merely additive but renumbered + merged. The current D5 (IB Alignment) becomes playbook D4 (IB Completeness), which affects the deterministic `conceptReinforcement` pre-check shipped in Section 1 of `2026-04-14-autodesign-parity-changes.md`.

This plan bundles **Phase 1 + Phase 2** of the proposed scope split:
- **Phase 1** — tone markers, 10D rubric, schema + UI ripple (foundation; the 10D rubric forces re-numbering)
- **Phase 2** — `experiencePillar` field, 12-style expansion, `selectVariantConfigs` rewrite, LLM prompt rewrite pointing at the playbook

**Phase 3** (Tier A/B/P selection pipeline, property-bridge templates, constellation bridging, spec/prod export reformat, `field_experiment` AI-as-assessor rule, additional Basic Info metadata) is deferred to a separate plan.

**Outcome we want:** design-studio generates designs that score against the playbook's 10D rubric, pick from the playbook's 12 styles grouped by the 6 pillars, use bracket tone markers, and surface all of this in the existing editor + library + gallery UI.

## Scope caveats

- **Breaking change for existing `data/runs/*.json`**. The new `rubricScoresSchema` adds `d10`, renames dimension labels, and `basicInfo.experiencePillar` becomes a required field on `gameDesignSchema`. `runRecordSchema.strict()` will reject old files on `listRuns()` with a `console.warn` and skip them. Dev-only store — no migration code. Any runs generated before this change must be re-generated to show up in the library.
- **`data/program.md` + `data/game_styles.md` content is stale** and must be regenerated or replaced. Detailed text rewrites are out of code scope — they happen alongside this plan but as markdown edits. The **code-level choice** is whether `generate.ts` reads `docs/game_design_playbook.md` directly (retiring `program.md` and `game_styles.md`) or keeps the existing reads. This plan recommends the former.
- **`data/templates.md` is partially stale.** Its step-by-step scaffolding is still useful but the pillar overlays and per-style template slots need to be rewritten to match the 12 new styles. Content rewrite is out of code scope; the plan flags which sections need updating.
- **Run files persist the full `GameDesign`.** When the schema changes, embedded designs on disk become invalid (missing `experiencePillar`, unknown `gameStyle` enum values). Same "skip on listRuns + console.warn" handling — no migration.
- **No automated tests.** Verification is manual (build + lint + drive the UI with a real LLM key).
- **`selectVariantConfigs` rewrite is a behavior change.** Today it picks 1 cat1 + 1 cat5 + 2 filler. With 12 styles across 6 pillars, the new strategy diversifies by pillar. Users who rely on the old variant distribution will see different output mixes.
- **The playbook references files that don't exist yet** (`constellation_map.yaml`, property-bridge template files, gold standard `designs/` markdown). This plan does NOT create those. It only makes the schema + prompts + UI able to *represent* playbook-aligned designs.

---

## Section 1 — Schema changes

**File:** `src/lib/design-schema.ts`

### 1a. Rubric dimensions 9 → 10 with renumbering

Replace the existing `RUBRIC_DIMENSIONS` and `RUBRIC_DIMENSION_DESCRIPTIONS` constants. Map old → new:

| Current | Playbook | New label | Notes |
|---|---|---|---|
| d1 Technical Constraints | D1 | **V1 Technical Compliance** | Kept, renamed |
| d2 Hook Rule | D2 | **Hook & Transition** | Merged with current d3 |
| d3 Transition Naturalness | *(merged)* | — | Removed, folded into d2 |
| d4 Edge Case Handling | D3 | **Edge Case Coverage** | Renumbered (d4 → d3) |
| d5 IB Alignment | D4 | **IB Completeness** | Renumbered (d5 → d4). **This is where the deterministic `conceptReinforcement` check now lives.** |
| d6 Tier Appropriateness | D5 | **Tier Appropriateness** | Renumbered (d6 → d5) |
| d7 Dialogue Quality | D6 | **Dialogue Specificity** | Renumbered (d7 → d6) |
| d8 Screen Descriptions | D7 | **Screen & UI Completeness** | Renumbered (d8 → d7) |
| d9 Entity Mapping Alignment | D8 | **Entity Mapping Alignment** | Renumbered (d9 → d8) |
| — | D9 | **Game Feel** | NEW. "Genuine uncertainty + satisfying resolution. Child experiences stakes." |
| — | D10 | **Pillar Fidelity** | NEW. "Blind reader could identify which pillar. Emotional arc matches pillar promise." |

Update:
```ts
export const RUBRIC_DIMENSIONS = {
  d1: "V1 Technical Compliance",
  d2: "Hook & Transition",
  d3: "Edge Case Coverage",
  d4: "IB Completeness",
  d5: "Tier Appropriateness",
  d6: "Dialogue Specificity",
  d7: "Screen & UI Completeness",
  d8: "Entity Mapping Alignment",
  d9: "Game Feel",
  d10: "Pillar Fidelity",
} as const;
```

Update `RUBRIC_DIMENSION_DESCRIPTIONS` with the playbook's PASS criteria (copied verbatim or condensed from §6 of the playbook). The d4 entry should note that `basicInfo.coreKeyConcepts` must be named in the closing step's `conceptReinforcement` field.

### 1b. `rubricScoresSchema` — add `d10`, keep pass/fail shape

```ts
export const rubricScoresSchema = z.object({
  d1: rubricScoreSchema,
  d2: rubricScoreSchema,
  d3: rubricScoreSchema,
  d4: rubricScoreSchema,
  d5: rubricScoreSchema,
  d6: rubricScoreSchema,
  d7: rubricScoreSchema,
  d8: rubricScoreSchema,
  d9: rubricScoreSchema,
  d10: rubricScoreSchema,
});
```

### 1c. New `experiencePillarSchema` enum + `basicInfo.experiencePillar`

```ts
export const experiencePillarSchema = z.enum([
  "mystery",
  "creation",
  "performance",
  "discovery",
  "adventure",
  "nurture",
]);
export type ExperiencePillar = z.infer<typeof experiencePillarSchema>;
```

Add required field to `gameDesignSchema.basicInfo`:
```ts
experiencePillar: experiencePillarSchema,
```

### 1d. Replace `GAME_STYLES` with 12 new styles grouped by pillar

Playbook §2 lists the 12 styles as Cat1/Cat5 pairs under each pillar. Model in code:

```ts
export const GAME_STYLES = {
  cat1: [
    "mystery_lens",       // Mystery
    "inventor_workshop",  // Creation
    "voice_stage",        // Performance
    "prediction_lab",     // Discovery
    "time_traveler",      // Adventure
    "care_station",       // Nurture
  ],
  cat5: [
    "mystery_trail",      // Mystery
    "mix_lab",            // Creation
    "ensemble_show",      // Performance
    "field_experiment",   // Discovery
    "quest_collector",    // Adventure
    "rescue_team",        // Nurture
  ],
} as const;
```

Also add a **pillar → (cat1, cat5) style lookup** so `selectVariantConfigs` can reason by pillar:

```ts
export const PILLAR_STYLES: Record<ExperiencePillar, { cat1: string; cat5: string }> = {
  mystery:     { cat1: "mystery_lens",      cat5: "mystery_trail" },
  creation:    { cat1: "inventor_workshop", cat5: "mix_lab" },
  performance: { cat1: "voice_stage",       cat5: "ensemble_show" },
  discovery:   { cat1: "prediction_lab",    cat5: "field_experiment" },
  adventure:   { cat1: "time_traveler",     cat5: "quest_collector" },
  nurture:     { cat1: "care_station",      cat5: "rescue_team" },
};
```

### 1e. Optional pillar labels constant (for UI tooltips)

```ts
export const PILLAR_LABELS: Record<ExperiencePillar, string> = {
  mystery:     "Mystery — I figured it out!",
  creation:    "Creation — I made this!",
  performance: "Performance — They loved it!",
  discovery:   "Discovery — Was I right?!",
  adventure:   "Adventure — Look how far we went!",
  nurture:     "Nurture — I helped!",
};
```

---

## Section 2 — Rubric helper (D5 → D4 move)

**File:** `src/lib/rubric-checks.ts`

The deterministic `conceptReinforcement` pre-check currently lives on D5 because the old rubric's D5 was "IB Alignment". In the new rubric D4 is "IB Completeness" which covers the same concept-naming requirement. Move the check to D4.

**Renames:**
- `checkD5Deterministic` → `checkD4Deterministic` (body unchanged; still validates `closing.conceptReinforcement` against `basicInfo.coreKeyConcepts` with the word-boundary regex and NFKC normalization)
- `applyD5Override` → `applyD4Override` (sets `d4: "fail"` instead of `d5: "fail"`, strips any pre-existing `d4` issue before injecting the deterministic reason)

**Call sites to update** (same three as Section 1 of the previous plan):
1. `src/app/api/evaluate/route.ts` — import path + function name
2. `src/lib/pipeline.ts` — two call sites in `generateVariant` (pass 2 evaluate + re-evaluate in the fix loop)

**Reason string update:** adjust the injected issue's `dimension: "d4"` (was `"d5"`).

**Do NOT change** the helper's signature or the `D5CheckResult` type alias beyond the rename — its semantics are stable.

---

## Section 3 — Pipeline changes

**File:** `src/lib/pipeline.ts`

### 3a. `ALL_FAIL_SCORES` + `DIMENSION_KEYS`

```ts
const ALL_FAIL_SCORES: RubricScores = {
  d1: "fail", d2: "fail", d3: "fail", d4: "fail", d5: "fail",
  d6: "fail", d7: "fail", d8: "fail", d9: "fail", d10: "fail",
};

const DIMENSION_KEYS = [
  "d1","d2","d3","d4","d5","d6","d7","d8","d9","d10",
] as const;
```

`totalScore` range is now 0..10 (not 0..9). `runRecordSchema.totalScore` bounds must update.

### 3b. `selectVariantConfigs` rewrite — pillar-aware

Current implementation picks 1 cat1 + 1 cat5 + shuffled filler from the old 6-style pool. New strategy:

- Always produce `maxVariants` distinct `(pillar, category)` tuples
- Prefer pillar diversity: if `maxVariants ≤ 6`, pick `maxVariants` distinct pillars with randomly-assigned categories (prefer balanced split: for 4 variants, 2 cat1 + 2 cat5)
- Each tuple maps to a concrete style via `PILLAR_STYLES[pillar][category]`
- Return `Array<{ category: Category; gameStyle: string }>` for backward-compat with `runGenerationJob`

Pseudocode:
```ts
export function selectVariantConfigs(maxVariants = 4): Array<{ category: Category; gameStyle: string }> {
  const pillars = shuffle([...ALL_PILLARS]); // 6 entries
  const picked = pillars.slice(0, Math.min(maxVariants, pillars.length));
  const categories = balancedCategorySplit(picked.length); // e.g. [cat1, cat5, cat1, cat5]
  shuffleInPlace(categories);
  return picked.map((pillar, i) => ({
    category: categories[i],
    gameStyle: PILLAR_STYLES[pillar][categories[i]],
  }));
}
```

Reasoning: the old mix was category-diverse but pillar-blind; users saw 3 similar cat1 styles because all 4 cat1 styles were in the same "interactive verbal" space. Pillar-diverse output gives four genuinely different emotional experiences per session.

### 3c. `RunRecord` construction in `generateVariant`

- `rubric: evaluation.scores` — now a 10-field object, no code change
- `totalScore` — still `DIMENSION_KEYS.filter(...).length` but max is 10
- `design.basicInfo.experiencePillar` is populated by the LLM per the new prompt (Section 4); the pipeline just passes it through
- No change to `sourceEntityYaml`, `parentRunId`, `isOpposite` logic

### 3d. `generateVariant` / `runGenerationJob` / `enqueueSingleVariantJob` signatures

Signatures do NOT change. `generationMode` + `options?.parentDesignId` + `options?.designId` threading stays the same. The new pillar + style choices are passed **inside** the existing `gameStyle` parameter (no new parameter needed; the prompt decides the pillar from the style).

Actually: the LLM needs to emit the pillar to match the assigned style. Two options:
- **Option A (simpler):** caller resolves pillar from style via reverse-lookup on `PILLAR_STYLES`, then passes the pillar as part of the user-content block in `buildGenerateMessages`. LLM echoes it into `basicInfo.experiencePillar`.
- **Option B:** LLM picks the pillar itself. This risks mismatch between `gameStyle` and `experiencePillar` unless the prompt constrains it.

**Pick Option A.** Add a helper `styleToPillar(style: string): ExperiencePillar` that reverse-looks up `PILLAR_STYLES`. Export from `design-schema.ts`. Callers in `pipeline.ts` + the prompt builder use it.

---

## Section 4 — LLM prompt changes

### 4a. `src/lib/prompts/generate.ts`

- Replace the hardcoded `JSON_SCHEMA_INSTRUCTIONS` reference to the 9-dimension rubric with a 10-dimension version pulled from the playbook
- Add `experiencePillar` to the TypeScript-like schema description in the instructions string
- Add bracket-format tone marker rule: `"aiSays": string, // Actual AI dialogue with tone marker in square brackets, e.g., [warm]`
- Update the 12-style list in the instructions (the old list was implicit; make it explicit)
- Document the 6 pillars with their "Child feels" phrasing from playbook §2

- **Source of truth for prompt content:** read `docs/game_design_playbook.md` at module load time, alongside the existing `data/*.md` files. The playbook supersedes `data/program.md` and `data/game_styles.md` for generation guidance. Two choices:
  - **Choice A:** add `const playbookMd = fs.readFileSync(path.join(process.cwd(), "docs/game_design_playbook.md"), "utf-8");` and inject it into `buildSystemContent`. Retire `programMd` and `gameStylesMd` reads. This keeps one source of truth and lets the user edit the playbook in place.
  - **Choice B:** copy playbook content into `data/program.md` as a rewrite. Lose the docs/data split but keep the existing prompt loading unchanged.
  - **Recommendation: Choice A.** The playbook is a design document that benefits from living under `docs/` and being human-readable as a standalone file. `data/` is for agent reference content that happens to match the playbook — preventing drift by reading the same file is cleaner than maintaining two copies.

- `buildModeGuidance(generationMode)` — no structural change; the freeform / mapping-informed split still applies. Bracket format is emphasized in both blocks.

- In the user-content block, add the pillar assignment near the other assignment parameters:
  ```
  - **Game style**: ${gameStyle}
  - **Experience Pillar**: ${pillar} (derived from game style)
  ```
  And a new instruction:
  ```
  X. Set basicInfo.experiencePillar to "${pillar}" — it must match the pillar associated with the assigned game style per PILLAR_STYLES.
  ```

- **Tone marker wording update** — line 108 (`// Actual AI dialogue with tone marker`) → `// Actual AI dialogue with tone marker in square brackets, e.g., "[warm] Look at this sunflower!"`. Add one explicit instruction in the Rules-for-steps block: `"Tone/emotion markers on AI dialogue MUST use square brackets: [warm], [excited], [gentle pause]. NEVER use parentheses for tone markers."`

### 4b. `src/lib/prompts/evaluate.ts`

- Replace the entire 9-dimension rubric body in `EVALUATE_SYSTEM_PROMPT` with a 10-dimension rubric pulled from playbook §6
- Rename D5 Note about "conceptReinforcement field is checked deterministically" → D4 Note
- Replace the parentheses check: `"Does every AI line include a tone/emotion marker in parentheses?"` → `"Does every AI line include a tone/emotion marker in square brackets, e.g., [warm]?"`
- Add D9 Game Feel definition: "Does the design create genuine uncertainty with a satisfying resolution? Does the child experience real stakes — not just structured Q&A?"
- Add D10 Pillar Fidelity definition: "Could a blind reader identify the experience pillar (Mystery / Creation / Performance / Discovery / Adventure / Nurture) from this design alone? Does the emotional arc match the pillar's promise per the playbook §2?"
- Update output format JSON schema description to include `d10`

### 4c. `src/lib/prompts/fix.ts`

- Update references to dimension numbers to match the new numbering
- Update tone marker wording if "parentheses" appears
- No structural change

### 4d. `src/lib/prompts/regenerate.ts`

- Line 36: `If changing dialogue, maintain tone markers in parentheses at the start of AI lines.` → `If changing dialogue, maintain tone markers in square brackets at the start of AI lines (e.g., [warm], [excited]).`

### 4e. Playbook-as-source in `buildSystemContent`

Current:
```ts
const sections: string[] = [
  programMd, templatesMd, entityGuidanceMd, gameStylesMd,
];
if (generationMode === "mapping-informed") sections.push(conversationBridgeMd);
sections.push(JSON_SCHEMA_INSTRUCTIONS);
```

New:
```ts
const sections: string[] = [
  playbookMd,         // NEW primary source (replaces programMd + gameStylesMd)
  templatesMd,        // Still used for step-by-step scaffolding
  entityGuidanceMd,   // Still used for YAML mapping rules
];
if (generationMode === "mapping-informed") sections.push(conversationBridgeMd);
sections.push(JSON_SCHEMA_INSTRUCTIONS);
```

Retire `programMd` and `gameStylesMd` reads at the top of `generate.ts`. Leave the `.md` files in place on disk for now (they're referenced by the old plan as reference files) but stop injecting them into prompts.

**Caveat:** `templates.md` has pillar-specific overlay content that references the old non-pillar system. A manual markdown rewrite of `templates.md` is required alongside this code change — tracked in Section 9 (Content files).

---

## Section 5 — UI changes

### 5a. Scorecard panel (editor)

**File:** `src/components/editor/ScorecardPanel.tsx` (or wherever the D1–D9 buttons are rendered — read first)

Render 10 PASS/FAIL buttons instead of 9. Button labels come from `RUBRIC_DIMENSIONS` — already dynamic if the component iterates the constant; if hardcoded, unhardcode.

### 5b. Editor header mode chip + pillar chip

**File:** `src/app/editor/[designId]/page.tsx`

Alongside the existing mode chip (`mapping` / `freeform`), add a pillar chip reading `design.basicInfo.experiencePillar`. Use a new shared component `src/components/common/PillarPill.tsx` (same pattern as `ModePill`, `CategoryPill`, `RubricDots` from the previous plan's Section 3 fix pass). Colors: pick one distinctive color per pillar, or use a single accent color and surface the pillar name as the label.

Minimum visual treatment:
- Small pill with pillar name (e.g., "Adventure")
- Tooltip with the playbook's "Child feels" phrasing (e.g., "Look how far we went!")

### 5c. Gallery `VariantCard` — pillar pill

**File:** `src/components/gallery/VariantCard.tsx`

Add `<PillarPill />` next to the existing mode pill on complete variants. Reads `variant.design?.basicInfo.experiencePillar`.

### 5d. Library rubric dots 9 → 10

**Files:**
- `src/components/common/RubricDots.tsx` — render 10 dots instead of 9. Since the component accepts `rubric: RubricScores` and iterates the dimension keys, this is a one-line change if the component uses `Object.entries` or `DIMENSION_KEYS`. If it hardcodes d1–d9, unhardcode.
- `src/components/library/RunsTable.tsx` — column header "D1–D9" → "D1–D10"; the column width may need adjusting.
- `src/components/library/RunsGrid.tsx` — same header text.
- `src/components/gallery/VariantCard.tsx` — the in-card D1–D9 dot strip also becomes D1–D10.

### 5e. Library CSV export

**File:** `src/components/library/RunsTable.tsx` (export helper section)

Add the `d10` column to CSV output. Update the header row: `d1,d2,...,d9` → `d1,d2,...,d10`. Each row's rubric values flow from the new `RunRecord.rubric` shape.

Optionally: add an `experiencePillar` column to CSV output (useful for cross-design analysis).

### 5f. Library Table + Grid pillar column (optional)

Add a "Pillar" column between "Mode" and "Game style" in the table view. Show the `PillarPill` component. Sortable by pillar name. Similarly on the grid card. Flag as **optional polish** — not a hard requirement for the rubric change.

---

## Section 6 — Persistence schema bump

**File:** `src/lib/runs-repository.ts`

### 6a. `runRecordSchema.rubric`

No direct change needed — `rubric: rubricScoresSchema` already pulls from `design-schema.ts` and auto-picks up the new d10 field.

### 6b. `runRecordSchema.totalScore`

Adjust bounds from 0..9 to 0..10:
```ts
totalScore: z.number().int().min(0).max(10),
```

### 6c. `runRecordSchema.design`

No direct change — `design: gameDesignSchema` pulls the updated shape (with `experiencePillar` on basicInfo) automatically.

### 6d. `.strict()` rejection of old files

Old run files missing `experiencePillar` in the embedded `design.basicInfo` and lacking `d10` in `rubric` will fail `runRecordSchema.parse` inside `listRuns()`. They're caught by the per-file `try/catch` and skipped with `console.warn`. No code change needed. **Flag this in the plan so the user knows the old files will disappear from the library view.**

### 6e. Optional cleanup helper

Optionally add a new `listLegacyRunFiles()` or a one-shot `purgeInvalidRunFiles()` helper. **Recommendation: skip.** Users can manually `rm data/runs/*.json` after upgrading. Adding cleanup code for a dev-only transitional store is yak-shaving.

---

## Section 7 — Content files (flagged, not implemented by code changes)

These are **markdown rewrites** — not code changes — but they're required for the feature to work end-to-end. The plan flags them so they're not forgotten.

### 7a. `data/program.md` — retire (or rewrite)

Stop reading it in `generate.ts`. Leave on disk for reference. If the user wants to keep a single "agent instructions" file in `data/` for consistency, rewrite it from the playbook (copy+paste sections 1–2–6–10).

### 7b. `data/game_styles.md` — retire (or rewrite)

Stop reading it in `generate.ts`. Leave on disk for reference. The playbook §2 + §3 cover this content.

### 7c. `data/templates.md` — rewrite required

Current content references the old 6 styles and 9D rubric. Rewrite to describe:
- Template A (Cat1) + Template B (Cat5) skeletons
- Pillar overlays for all 6 pillars (Mystery, Creation, Performance, Discovery, Adventure, Nurture)
- Creative variables per pillar
- Bracket tone marker convention

The code change in `generate.ts` keeps reading `templates.md` but the rewritten content is the authoritative source.

### 7d. `data/entity_guidance.md` — no rewrite needed

The mapping YAML format hasn't changed. Keep as-is.

### 7e. `data/conversation_bridge.md` — no rewrite needed

Bridge flavor patterns (Recall / Discovery / Curiosity / Challenge) are orthogonal to the rubric changes. Keep as-is. The playbook §8 "Entity Constellation Bridging" is a higher-level topic (constellation matching) that does NOT change the bridge patterns themselves.

### 7f. `docs/game_design_playbook.md` — authoritative

Already in place. `generate.ts` reads it directly per Section 4e.

---

## Section 8 — Verification (manual)

### After Section 1–4 (schema + prompts)
- `npm run build` passes
- `npm run lint` passes
- Hand-craft a `GameDesign` JSON missing `experiencePillar` → Zod rejects
- Hand-craft a `GameDesign` with `experiencePillar: "adventure"` and `gameStyle: "mystery_lens"` → schema passes (mismatch is NOT caught by Zod, only by the LLM prompt logic)
- `POST /api/evaluate` with a design that has empty `conceptReinforcement` → **D4** reports `fail` (was D5)
- Read `generate.ts` rendered prompt (log it once during dev) → confirm:
  - `docs/game_design_playbook.md` content is included in the system prompt
  - Bracket format rule is explicit
  - Pillar assignment is in the user-content block

### After Section 5 (UI)
- Editor scorecard: 10 buttons
- Editor header: both mode chip AND pillar chip visible
- Gallery VariantCard: mode + pillar pill on complete variants
- Library RunsTable: column header "D1–D10", 10 dots per row
- Library RunsGrid: 10 dots per card
- Library CSV export: `d10` column present, optional `experiencePillar` column
- Playwright drive: navigate all pages, confirm no layout regressions

### After Section 6 (persistence)
- Existing run files in `data/runs/` do NOT appear in the library (skipped by `listRuns` with `console.warn`)
- `rm data/runs/*.json && touch data/runs/.gitkeep` cleans slate
- Generate a new design via the upload flow → new run file is persisted with:
  - `rubric: {d1..d10}` all present
  - `design.basicInfo.experiencePillar` set to a valid pillar
  - `design.basicInfo.gameStyle` in the new 12-style enum
  - `totalScore` in [0..10]
- Library shows the new run with all 10 dots

### Full end-to-end golden path
1. `rm data/runs/*.json` (or rename the dir)
2. Upload a real entity YAML (e.g., `garden_flowers.yaml`)
3. Toggle Freeform → Generate
4. Gallery shows 4 variants with pillar + mode pills; the 4 variants come from 4 different pillars
5. Open one variant → editor shows mode + pillar chip, scorecard shows 10 PASS buttons
6. Navigate to closing step → `conceptReinforcement` + `tomorrowHook` textareas still render (unchanged by this plan)
7. All AI dialogue in the variant uses `[...]` tone markers, never `(...)`
8. Navigate to `/library` → 4 new runs, 10-dot rubric strip, pillar column visible
9. Click opposite on one variant → opposite generated, 5th run appears
10. Export CSV → confirm `d10` column and optional `experiencePillar` column

---

## Section 9 — Critical files

### Modified files
| Path | Purpose |
|---|---|
| `src/lib/design-schema.ts` | `RUBRIC_DIMENSIONS` → 10 entries; `rubricScoresSchema` + d10; new `experiencePillarSchema` + `ExperiencePillar` type; `basicInfo.experiencePillar` required; replace `GAME_STYLES` with 12 styles; add `PILLAR_STYLES`, `PILLAR_LABELS`, `styleToPillar` helper |
| `src/lib/rubric-checks.ts` | Rename `checkD5Deterministic` → `checkD4Deterministic`, `applyD5Override` → `applyD4Override`; change the overridden field from `d5` to `d4` |
| `src/app/api/evaluate/route.ts` | Update import + function names |
| `src/lib/pipeline.ts` | `ALL_FAIL_SCORES` → 10 fields; `DIMENSION_KEYS` → 10 entries; `totalScore` max 10; rewrite `selectVariantConfigs` pillar-aware; update two `applyD5Override` call sites to `applyD4Override` |
| `src/lib/prompts/generate.ts` | Read `docs/game_design_playbook.md`; stop reading `programMd` + `gameStylesMd`; update `JSON_SCHEMA_INSTRUCTIONS` with 10D rubric, `experiencePillar`, bracket tone markers, 12 styles; add `styleToPillar` call to surface pillar in the user-content block |
| `src/lib/prompts/evaluate.ts` | Replace 9D rubric with 10D; update D4 deterministic-check note; parentheses → brackets; add D9 Game Feel + D10 Pillar Fidelity |
| `src/lib/prompts/fix.ts` | Update dimension references to 10D if any are hardcoded |
| `src/lib/prompts/regenerate.ts` | Line 36: parentheses → square brackets |
| `src/lib/runs-repository.ts` | `totalScore` bounds 0..10 (rubric + design changes ride on schema import) |
| `src/components/editor/ScorecardPanel.tsx` (or wherever the 9 buttons are) | 9 → 10 PASS/FAIL buttons |
| `src/app/editor/[designId]/page.tsx` | Add `<PillarPill />` next to the existing mode chip |
| `src/components/gallery/VariantCard.tsx` | Add `<PillarPill />` + 9-dot → 10-dot rubric strip |
| `src/components/common/RubricDots.tsx` | Render 10 dots instead of 9 |
| `src/components/library/RunsTable.tsx` | "D1–D9" → "D1–D10" header; CSV export `d10` column; optional `experiencePillar` column |
| `src/components/library/RunsGrid.tsx` | "D1–D9" → "D1–D10" header |

### New files
| Path | Purpose |
|---|---|
| `src/components/common/PillarPill.tsx` | New shared component for rendering the experience pillar pill (mirrors `ModePill` / `CategoryPill`) |

### Markdown rewrites (out of code scope, flagged as a blocker for live use)
| Path | Action |
|---|---|
| `data/templates.md` | Rewrite to use 12 new styles, 6 pillar overlays, bracket tone markers |
| `data/program.md` | Retire from prompt injection (leave on disk for reference) |
| `data/game_styles.md` | Retire from prompt injection (leave on disk for reference) |

---

## Execution order

Sequential (each section depends on the previous):

1. **Section 1 (schema)** — foundation; everything downstream depends on the new types and constants
2. **Section 2 (rubric-checks D5 → D4 rename)** — the helper is referenced by both pipeline + evaluate route
3. **Section 3 (pipeline)** — wires everything
4. **Section 4 (prompts)** — LLM content must match the schema
5. **Section 5 (UI)** — render 10 dots, new pills
6. **Section 6 (persistence)** — mostly propagates automatically, just the totalScore bound
7. **Section 7 (content rewrites — out of code scope)** — happens in parallel; must be complete before the feature is usable
8. **Section 8 (verification)** — run after each section and as a final end-to-end pass

Each section ends with a conventional commit (`feat(schema): 10D rubric + experience pillars + 12 game styles`, etc.). No auto-commit per CLAUDE.md.

---

## Out of scope (deferred to Phase 3)

The playbook describes these but this plan does NOT implement them:

1. **Tier A / B / P game selection pipeline** — gold standards, constellation-adapted games, property-bridge templates
2. **Property-bridge templates** (Shape Quest, Color Scout, etc. — 18 templates parameterized by visual property)
3. **`constellation_map.yaml`** — entity→gold-standard mapping with bridge types (same_taxonomy, part_of, etc.)
4. **`results.tsv`** tracking as a separate artifact — our `data/runs/*.json` serves the same purpose richer; no TSV code
5. **Spec vs prod export reformat** per playbook §4 (H1 vs H2, bullet vs table, blockquote vs inline) — may or may not already match `data/transform.md`; verify at Phase 3 time
6. **`field_experiment` AI-as-assessor rule** — AI announces properties instead of asking the child. Only applies once `field_experiment` style is actually generating meaningful content
7. **Additional Basic Info metadata** — `Design Version`, `Last Updated`, `Mapping Source` (on basicInfo directly, distinct from `entityMapping.mappingSource`)
8. **Style Recommender** (playbook §7) — the system that decides which gold standard to bridge for an entity that has no direct match
9. **Automated test harness** — no `*.test.ts` setup, same as the previous plan

---

## Risks + tradeoffs

1. **Breaking run files.** Every pre-existing run file is rendered invalid. The library will look empty until new runs are generated. Dev-only store, acceptable.

2. **Pillar-style binding is a constraint the LLM might violate.** Even with `styleToPillar` threaded through the prompt and a hard instruction, the LLM could produce a design with `gameStyle: "mystery_lens"` and `experiencePillar: "adventure"`. No Zod constraint catches this because both fields are independently valid enums. Mitigations:
   - Option: add a Zod `.superRefine` on `basicInfo` that checks `PILLAR_STYLES[experiencePillar][category].includes(gameStyle)`. Rejects at parse time. Cost: one small refinement.
   - Recommendation: **add the refinement**. It's cheap insurance.

3. **`selectVariantConfigs` behavior change** produces different variant mixes than before. Users who were familiar with the old 1-cat1 + 1-cat5 + 2-filler distribution will see 4 pillar-diverse variants instead. This is the *intent* of the change, not a regression, but worth flagging.

4. **12 styles is a bigger prompt.** The system prompt now enumerates 12 styles + 6 pillars + playbook content. Net prompt size may grow by 30–50%. LLM token cost per variant goes up proportionally. Acceptable for dev; monitor if production budgets tighten.

5. **`docs/game_design_playbook.md` read path.** If the file is missing (e.g., someone deletes it), `generate.ts` fails at module load. Add a clear error message. Consider a build-time check.

6. **D10 Pillar Fidelity is subjective.** A blind-reader test is hard for an LLM evaluator to self-apply. Expect higher D10 failure rates until the fix loop learns the criterion. Consider: in the evaluate prompt, give 2–3 concrete positive + negative examples per pillar to anchor the LLM's judgment.

7. **Pillar rollup for the old 4 generated variants.** Any designs persisted during manual verification of the previous plan (`2026-04-14-autodesign-parity-changes.md`) are now invalid. `rm data/runs/*.json` as part of this plan's rollout.

---

## Success criteria

- `npm run build` + `npm run lint` clean on every commit
- Generated designs emit `experiencePillar`, bracket tone markers, and 10D rubric scores
- The library shows 10 dots per run, the editor scorecard shows 10 buttons
- `selectVariantConfigs` produces 4 variants from 4 distinct pillars
- The deterministic `conceptReinforcement` check correctly fails D4 (not D5) when missing
- Old run files are skipped (not crashing) on `listRuns`
- End-to-end golden path passes manual verification with a real LLM key
