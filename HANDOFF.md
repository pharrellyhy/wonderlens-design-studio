# Session Handoff

Last updated: 2026-05-09

---

## Review Import Header Alignment — Fixed

### Problem
The `/review` empty import state rendered the title and description against the wide page container while the import selection card was centered at `max-w-2xl`, leaving the intro visually offset from the card.

### Solution
Constrained the review intro wrapper to the same centered `max-w-2xl` width as the import card and added a focused regression test for that layout contract.

### Edits
- `src/app/review/page.tsx` — aligned the review intro wrapper with the importer card width.
- `src/app/review/page.test.ts` — added a regression check for the centered `max-w-2xl` intro wrapper.

### NOT Changed
- Import behavior, review-console state, and editor handoff behavior were not changed.
- The main review console remains inside the existing `max-w-5xl` page container.

### Verification
```bash
npx tsx --test src/app/review/page.test.ts
npx eslint src/app/review/page.tsx src/app/review/page.test.ts
npm run build
```

Manual visual check at `http://localhost:3000/review` with a `1140x508` viewport measured `h1_x=234.0`, `card_x=234.0`, `delta=0.0`.

---

## Review Console Integration — Implemented

### Problem
The studio needed a review-first workflow for generated 5-file activity bundles. The home page mixed YAML generation and existing-activity review, and imported bundles jumped straight into the editor without surfacing adaptation rationale, asset dependencies, deterministic QA diagnostics, or batch-review status.

### Solution
Implemented the review console integration from `docs/plans/2026-05-09-review-console-integration.md`. The home page is now a task selector, `/generate` preserves YAML generation, and `/review` imports single or batch activity bundles into a read-only review console before editor handoff. Imports now derive review metadata from `spec.md` and run deterministic diagnostics for mechanic fidelity, asset dependency completeness, V1 blockers, product-decision risks, scorecard placement drift, and cross-file alignment.

### Edits
- `src/app/page.tsx`, `src/app/generate/page.tsx`, `src/app/review/page.tsx`, `src/app/layout.tsx` — task-first routing and Review/Generate/Library nav.
- `src/components/home/*` — home task cards and selector test.
- `src/components/review/*` — review console, bundle list, filters, flow review, diagnostics, asset brief, adaptation rationale, and summary panels.
- `src/components/upload/ExistingDesignImporter.tsx` — dual import modes: legacy editor handoff or review-console batch handoff.
- `src/lib/review-metadata.ts`, `src/lib/review-diagnostics.ts`, `src/lib/bundle-import.ts` — derived metadata and diagnostics on every `ImportedBundleResult`.
- `src/lib/activity-bundle-schema.ts`, `src/components/editor/TagBlockPanel.tsx`, `src/lib/design-schema.ts`, `src/lib/prompts/{generate,regenerate,evaluate}.ts` — narrow vocabulary sync: `Nurture` tag-block pillar and D10 “Mechanic Fidelity + Scaffold Honesty”.
- `src/store/design-store.ts` — session-only per-bundle review status.
- Tests added/updated under `src/components/home`, `src/components/review`, `src/store`, and `src/lib/__tests__`.

### NOT Changed
- Canonical activity bundle files remain the same 5-file format.
- Review metadata is derived in the studio; no tag-block `asset_policy` field was added.
- Imported review batches are session state only; they are not auto-persisted to Library.
- The full editor remains the editing surface; the console is read-first and diagnostic-focused.

### Verification
```bash
npx tsx --test src/components/home/HomeTaskSelector.test.tsx
npx tsx --test src/components/review/ReviewConsole.test.tsx
npx tsx --test src/store/review-status.test.ts
npx tsx --test src/lib/__tests__/review-diagnostics.test.ts
npx tsx --test src/lib/__tests__/bundle-roundtrip.test.ts
npx tsx --test src/lib/__tests__/tag-block-schema-drift.test.ts
npx tsx --test src/lib/__tests__/prompt-vocabulary.test.ts
npx eslint src/app/page.tsx src/app/generate/page.tsx src/app/review/page.tsx src/app/layout.tsx src/components/home/*.tsx src/components/review/*.tsx src/components/upload/ExistingDesignImporter.tsx src/components/editor/TagBlockPanel.tsx src/store/design-store.ts src/store/review-status.test.ts src/lib/review-metadata.ts src/lib/review-diagnostics.ts src/lib/bundle-import.ts src/lib/activity-bundle-schema.ts src/lib/design-schema.ts src/lib/prompts/generate.ts src/lib/prompts/regenerate.ts src/lib/prompts/evaluate.ts src/lib/__tests__/review-diagnostics.test.ts src/lib/__tests__/bundle-roundtrip.test.ts src/lib/__tests__/prompt-vocabulary.test.ts
npm run build
```

---

## Review Console Integration Plan — Complete

### Problem
The studio home page currently mixes YAML generation, generation mode guidance, and existing-bundle review in one long page. Generated activity packages also need a review-first surface for adaptation rationale, asset dependencies, mechanic fidelity, V1 blockers, and cross-file checks rather than forcing reviewers to inspect five files manually.

### Solution
Added an implementation plan for integrating a review console into the existing Design Studio instead of building a separate app. The plan recommends a task-first landing page with separate Review and Generate paths, derived review metadata from `spec.md`, deterministic diagnostics, asset brief visualization, and incremental reuse of the existing importer/editor/library.

### Edits
- `docs/plans/2026-05-09-review-console-integration.md` — new implementation plan covering UX, routes, data model, diagnostics, component plan, phases, verification, acceptance criteria, risks, and open questions.

### NOT Changed
- No application code was changed.
- No schema, prompt, or runtime behavior was changed.
- No image generation was added.

### Verification
```bash
git diff --check
sed -n '1,260p' docs/plans/2026-05-09-review-console-integration.md
git diff -- HANDOFF.md
```

---

## Dialogue Cue Brackets — Complete

### Problem
Some dialogue cue tags, especially silent-branch timing cues like `(wait 2s)`, still appeared with parentheses in prod markdown and in prompt/reference examples. The canonical reference bundle is inlined into generation prompts, so those examples could keep teaching the model the old wrapper.

### Solution
Normalized dialogue cue tags to square brackets in export rendering, prompt guidance, transform/reference docs, and authored activity examples. Child-response branch labels such as `(Ideal)`, `(Unexpected)`, and `(No response)` remain unchanged because they are structural labels, not dialogue cue tags.

### Edits
- `src/lib/bundle-export.ts` — added a scoped formatter that converts leading dialogue cues such as `(wait 2s)` or `(triumphant)` to `[wait 2s]` / `[triumphant]` when rendering prod markdown.
- `src/lib/__tests__/bundle-roundtrip.test.ts` — added regression coverage for parenthesized timing tags in prod export.
- `src/lib/prompts/{generate,fix,regenerate}.ts` — clarified that dialogue cue tags, including timing cues, must use square brackets.
- `data/program.md`, `data/transform.md`, `data/conversation_bridge.md` — updated guidance and target examples to square-bracket cue tags.
- `activities/{mystery_trail_butterfly,polka_dot_patrol,voice_stage_lion}/prod.md` — converted existing `(wait 2s)` and remaining AI follow-up cue tags to square brackets.

### NOT Changed
- Child-response branch labels remain parenthesized.
- The ActivityBundle schema and importer behavior were not changed.
- The “Source” side of `data/transform.md` still shows old parenthesized examples because that section documents input being transformed.

### Verification
```bash
./node_modules/.bin/tsx --test src/lib/__tests__/bundle-roundtrip.test.ts
npx eslint src/lib/bundle-export.ts src/lib/prompts/generate.ts src/lib/prompts/fix.ts src/lib/prompts/regenerate.ts src/lib/__tests__/bundle-roundtrip.test.ts
git diff --check
```

---

## Editor Sub-step Expansion + Field AI Controls — Complete

### Problem
The editor sidebar could reflect parsed sub-steps, but reviewers could not add missing bridge variants or extend a rounds step beyond the parsed rounds. Several editable dialogue/tag-block fields also lacked the same comment + regenerate affordances as the main editable fields.

### Solution
Added store helpers for extending existing structured step shapes: bridge steps can add a missing `warmStart` or `coldStart`, and rounds steps can append another round after the highest parsed `roundNumber`. The editor now exposes those actions in the active step view and immediately navigates to the new sub-step. Field-level AI controls were centralized and reused across main editable fields, dialogue textareas, response/follow-up boxes, screen descriptions, tag-block text fields, selects, multi-selects, and tier-support toggles.

### Edits
- `src/store/design-store.ts` — added `addBridgeVariant()` and `addRound()` helpers with empty `DialogueBlock` scaffolds.
- `src/store/design-store.test.ts` — added regression coverage for adding a missing warm start and appending after non-contiguous parsed rounds.
- `src/app/editor/[designId]/page.tsx` — added `Add Warm Start`, `Add Cold Start`, and `Add Round` actions; wired AI controls into every top-level editable field and the Tag Block panel.
- `src/components/editor/EditableField.tsx` — extracted reusable comment/regen controls and made blank regen submit directly.
- `src/components/editor/DialogueBlock.tsx` — added comment/regen controls to AI says, each child response, each AI follow-up, and screen description.
- `src/components/editor/TagBlockPanel.tsx` — added comment/regen support to tag-block text fields, enum selects, multi-selects, and tier support.

### NOT Changed
- The data model still uses the existing `warmStart` / `coldStart` bridge fields and `rounds[]` array; no parallel arbitrary sub-step schema was introduced.
- Recap and dashboard remain derived previews, not directly editable fields.
- Field regeneration still goes through the existing `/api/regenerate` flow.

### Verification
```bash
npx tsx --test src/store/design-store.test.ts
npx tsx --test src/components/editor/NavigationPanel.test.ts
npx tsx --test src/lib/__tests__/bundle-roundtrip.test.ts
npx eslint src/components/editor/EditableField.tsx src/components/editor/DialogueBlock.tsx src/components/editor/TagBlockPanel.tsx 'src/app/editor/[designId]/page.tsx' src/store/design-store.ts src/store/design-store.test.ts
npx tsc --noEmit --pretty false
npm run build
```

---

## Batch Activity Import — Complete

### Problem
The Review/Modify entry path accepted only one activity ZIP or one unpacked activity folder at a time. Dropping or selecting multiple activity archives was ignored after the first file, and selecting a parent folder containing several activity subfolders could mix required files by basename instead of keeping each activity bundle separate.

### Solution
Added batch import helpers for both ZIP files and folder file lists. Folder imports now group required files by their parent `webkitRelativePath`, so a parent directory containing multiple activity folders produces one parsed `ActivityBundle` per activity. The home-screen importer accepts multiple ZIPs, grouped folder files, or drag-and-drop batches. Single imports still open directly in the editor; multi-imports render a selectable list so the reviewer can choose which activity to modify. The imported batch list lives in the shared Zustand store, so opening one activity and clicking the editor's Back to Gallery button returns to the upload/review screen with the batch list still available. Upload scorecard seeding now prefers `## Self-Evaluation Scorecard` from `prod.md`, then falls back to `spec.md` when `prod.md` has no complete D1-D10 table. The prod parser now accepts authored prod files like `activities/color_scout_property/prod.md`, including `Step 1b`, colon-outside-bold dialogue labels, `Possible child responses`, six-step flows, and title-based closing detection. The editor sidebar now reflects parsed structure instead of placeholders: absent bridge variants are hidden, Step 3 round count is derived from `step.rounds.length`, and child round rows use the parsed round numbers.

### Edits
- `src/lib/bundle-import.ts` — added `importBundlesFromZipFiles` and `importBundlesFromFiles`; kept `importBundleFromFiles` as a single-bundle compatibility wrapper.
- `src/lib/bundle-import.ts` — scorecard seeding prefers `prod.md` and falls back to `spec.md`; structural prod parsing ignores trailing scorecard blocks instead of treating them as the activity body.
- `src/lib/bundle-import.ts` — authored-prod dialogue parser accepts `**AI says**:`, `**Possible child responses**:`, `Step 1a/1b`, and detects closing steps by title so Step 6 closings are not shadowed by Step 5 celebrations.
- `src/lib/__tests__/bundle-roundtrip.test.ts` — added regression coverage for multiple folder-style imports, multiple selected ZIP archives, prod.md-over-spec.md scorecard precedence, spec.md scorecard fallback, and concrete `activities/color_scout_property/prod.md` content loading.
- `src/components/upload/ExistingDesignImporter.tsx` — multi-file ZIP picker/drop handling, grouped folder imports, and a multi-import selection list.
- `src/store/design-store.ts` — added `importedBundles` plus setter/clear actions; `resetSession()` intentionally preserves the batch list across editor navigation.
- `src/store/design-store.test.ts` — regression for preserving an imported batch through `resetSession()` + `setActiveBundle()`.
- `src/components/editor/NavigationPanel.tsx` — extracted parsed-section builder; hides absent warm/cold bridge entries and derives round count from parsed rounds.
- `src/components/editor/NavigationPanel.test.ts` — regression for parsed-only sidebar entries and non-contiguous round numbers.

### NOT Changed
- Existing single ZIP/folder imports still open directly in the editor.
- Bundle parsing, schema validation, and D4 rubric behavior were not changed.
- Imported activities remain session-state editor entries; the batch list does not persist imports into the library.

### Verification
```bash
npx tsx --test src/lib/__tests__/bundle-roundtrip.test.ts
npx tsx --test src/store/design-store.test.ts
npx tsx --test src/components/editor/NavigationPanel.test.ts
npx eslint src/lib/bundle-import.ts src/lib/__tests__/bundle-roundtrip.test.ts src/components/upload/ExistingDesignImporter.tsx
npx eslint src/components/editor/NavigationPanel.tsx src/components/editor/NavigationPanel.test.ts
npx eslint src/store/design-store.ts src/store/design-store.test.ts
npx eslint src/app/page.tsx
npx tsc --noEmit --pretty false
npm run build
```

---

## ActivityBundle Migration — Complete

### Problem
The on-disk activity layout was redesigned into a 5-file bundle per activity (`spec.md`, `prod.md`, `tag_block.yaml`, `recap.template.yaml`, `dashboard.template.yaml`) under `activities/<activity_id>/`. The studio was still emitting one `spec.md` + one `prod.md` from a flat `GameDesign` schema, so generation output, the export endpoint, and the existing-design importer were all misaligned with the canonical layout. The new `tag_block.yaml` carries closed-enum vocabularies (12 observation_angle, 10 mechanic, 4 entity_role, 7 IB key concepts, …) validated by `activities/_schema/tag_block.schema.json`, and recap/dashboard templates carry runtime placeholders the studio had no concept of.

### Solution
Replaced `GameDesign` with `ActivityBundle = { schemaVersion, activityId, generationMode, spec, prod, tagBlock, recap, dashboard }` and migrated every consumer. ONE LLM call returns the full bundle JSON; the existing 4-pass pipeline (generate → evaluate → fix → re-evaluate) keeps working unchanged at the orchestration level. 11 cross-doc invariants (e.g. `tagBlock.activity_id === bundle.activityId`, `recap.payloadDefaults.whatWeNoticed === tagBlock.activity_signature.observation_angle`) are enforced by Zod's `superRefine`. Export is now a ZIP download whose root is `<activity_id>/`. Import accepts ZIP or folder picker; the legacy single-`.md` parser is removed. Editor surfaces Spec / Prod / Tag Block as editable sections with closed-enum dropdowns, plus read-only Recap and Dashboard previews kept fresh by a cross-doc mirror in the store. The plan lives at `docs/plans/2026-05-07-activity-bundle-migration.md`.

In a follow-up the importer also parses `## Self-Evaluation Scorecard` tables out of `prod.md` first, falling back to `spec.md`, so author PASS/FAIL/N-A verdicts surface as initial rubric state. The editor's scorecard distinguishes "not evaluated yet" (neutral pills + banner) from a real all-fail, and an unrated import auto-triggers `/api/evaluate` on mount. Tone markers in all 5 canonical activities (`(parens)` / `*(parens)*`) were converted to `[brackets]` per D6.

### Edits
- `src/lib/activity-bundle-schema.ts` (NEW) — closed enums, 5 child schemas, `activityBundleSchema` with 11-invariant `superRefine`, renamed `variantResultSchema`/`generationJobSchema`, capitalisation map (lowercase studio pillar ↔ TitleCase tagBlock, `nurture ↔ Connection`).
- `src/lib/bundle-export.ts` (NEW) — 5 renderers (`renderSpecMarkdown`, `renderProdMarkdown`, `renderTagBlockYaml`, `renderRecapYaml`, `renderDashboardYaml`) + `bundleToZip(bundle): Promise<{ bytes, filename }>`. Uses `jszip` + `js-yaml`.
- `src/lib/bundle-import.ts` (NEW) — `importBundleFromZip` / `importBundleFromFiles` + narrow markdown parsers + scorecard parser (`parseScorecard` returns `{ scores, evaluated }`); `BundleImportError` carries `missingFiles` and `zodIssues`.
- `src/lib/__tests__/tag-block-schema-drift.test.ts` (NEW) — drift guard: every Zod enum is asserted against the canonical JSON Schema at test time. CI-blocking.
- `src/lib/__tests__/bundle-roundtrip.test.ts` (NEW) — semantic round-trip on a hand-typed bundle + scorecard-parsing test.
- `src/lib/design-schema.ts` — stripped `gameDesignSchema`/`variantResultSchema`/`generationJobSchema`/`synthesisTypeSchema`; primitives + 10D rubric constants kept.
- `src/lib/pipeline.ts`, `runs-repository.ts`, `rubric-checks.ts`, `job-store.ts` — `design` → `bundle` throughout; D4 closing-step check repointed at `bundle.prod`; persisted `RunRecord.bundle` instead of `RunRecord.design`.
- `src/lib/prompts/{generate,evaluate,fix,regenerate}.ts` — bundle-aware prompts. `generate.ts` inlines `activities/mystery_trail_butterfly/*` as a few-shot reference; lists every closed enum verbatim; states the 11 invariants. `regenerate.ts` rejects `recap.*` / `dashboard.*` paths (derived previews).
- `src/app/api/{evaluate,regenerate,export,upload,library/[runId],generate,generate/opposite,generate/[jobId]/status}/route.ts` — `bundle` body field; `/api/export` returns `application/zip`; `/api/regenerate` 400s on derived-preview paths; opposite route derives lowercase pillar from `sourceRun.bundle.tagBlock.pillar` via reverse map.
- `src/store/design-store.ts` — `activeBundle`/`setActiveBundle`; `updateField` write-guards `recap.*`/`dashboard.*`; `mirrorTagBlockSignatureChange` keeps recap + dashboard previews in sync when the user edits `tagBlock.activity_signature` fields. New `rubricEvaluated: boolean` flag distinguishes "not yet rated" from real evaluation.
- `src/lib/api-client.ts` — `EvaluateParams`/`RegenerateParams`/`OpenRunResult` carry `bundle`; `exportDesign` returns `{ blob, filename }` from the new ZIP route; `ImportedBundleResult` now also carries `rubricEvaluated`.
- `src/lib/generation-poller.ts` — `DesignVariant.bundle` from the renamed `VariantResult.bundle`.
- `src/components/editor/NavigationPanel.tsx` — new grouped layout: Spec / Prod / Prod·Steps / TagBlock / Derived.
- `src/components/editor/TagBlockPanel.tsx` (NEW) — closed-enum dropdowns + multi-selects + tier_support tri-state + entity_class_filter.
- `src/components/editor/RecapPreview.tsx` (NEW) — read-only child-card preview + payloadDefaults table.
- `src/components/editor/DashboardPreview.tsx` (NEW) — read-only session grid + contributesTo.
- `src/components/editor/ScorecardPanel.tsx` — three visual states (unrated / pass / fail); banner when unrated; surfaces evaluator errors inline.
- `src/components/gallery/VariantCard.tsx` — reads `bundle.prod`/`bundle.tagBlock`; new detail rows (focal_attribute, mechanic × observation_angle, reward_hook).
- `src/app/editor/[designId]/page.tsx` — section restructure (spec / prod-basic / prod-overview / prod-attributes / prod-constellation / prod-step-N / tagBlock / recap-preview / dashboard-preview); ZIP-download export; `useEffect` auto-fires `/api/evaluate` when an unrated bundle is loaded.
- `src/app/page.tsx`, `src/app/gallery/[entityId]/page.tsx`, `src/components/library/LibraryTabs.tsx` — `setActiveBundle` everywhere; importer-flow passes `evaluated=result.rubricEvaluated` so imported scorecards seed real verdicts.
- `src/components/upload/ExistingDesignImporter.tsx` — drag-and-drop ZIP, "Pick ZIP" / "Pick folder" buttons (`webkitdirectory`), `BundleImportError`-aware error rendering.
- `activities/{mystery_trail_butterfly,voice_stage_lion,polka_dot_patrol,color_scout_property,shape_quest_property}/prod.md` — tone markers converted from `(text)` / `*(text)*` to `[text]` so dialogue passes D6's "square brackets only" rule. 229 lines rewritten across the five activities.
- `package.json` — added `jszip` (runtime), `tsx` (devDep — matches existing `npx tsx --test` convention from prior handoffs).
- `docs/plans/2026-05-07-activity-bundle-migration.md` — design doc; harness plan file copied here per project convention.

### NOT Changed
- 10D rubric (D1–D10) is unchanged. D4 deterministic check moved from `design.steps` / `design.basicInfo.coreKeyConcepts` to `bundle.prod.steps` / `bundle.prod.basicInfo.coreIbKeyConcepts`; semantics identical.
- `runs-repository.ts` filename scheme + atomic-write pattern.
- The 4-pass pipeline orchestration (generate → evaluate → fix → re-evaluate, max 3 fix iterations).
- `data/runs/*.json` — old fixtures remain deleted; only `.gitkeep` present.
- The legacy single-`.md` importer was deleted in Phase 1; no fallback path. Bundle ZIP / folder is the only import shape.

### Verification
```
./node_modules/.bin/tsc --noEmit --pretty false      # 0 errors
./node_modules/.bin/eslint src                        # 0 errors
./node_modules/.bin/tsx --test \
  src/lib/__tests__/tag-block-schema-drift.test.ts \
  src/lib/__tests__/bundle-roundtrip.test.ts          # 16/16 pass
npm run build                                         # successful, 11 routes
```

End-to-end smoke (offline): parsing every canonical activity round-trips through `bundleToZip` + `importBundleFromZip` losslessly on `mystery_trail_butterfly` (the only one fully internally consistent at session time); re-rendered `tag_block.yaml` validates green against `activities/_schema/tag_block.schema.json` via the python `jsonschema` snippet in `activities/README.md`. Four other canonicals surface real on-disk drift the new validator correctly catches (color_scout / shape_quest gameStyle disagreement; polka_dot pillar→category→style mismatch; voice_stage_lion recommendedTier).

Live-server `/api/export` HTTP smoke skipped: a pre-existing `npm run dev` (PID 86412) was holding port 3000 with stale code returning 502s. The route is a thin wrapper over `bundleToZip` (already verified offline) and is included in the successful `npm run build`.

---

## Existing Activity Import — Complete

### Problem
The app only supported starting from entity YAML and generating new variants. Existing WonderLens activities in spec markdown or structured JSON could not be opened for review, manual edits, targeted AI regeneration, rubric re-score, or export.

### Solution
Added a deterministic import path on the home screen. YAML upload still starts the generation/gallery flow. Existing WonderLens spec/prod markdown (`.md`) and structured `GameDesign` JSON (`.json`) now import directly into the existing Design Studio editor. Markdown imports normalize legacy game styles such as `prediction_game` into the current pillar/style schema and parse available D1-D10 scorecard rows, defaulting missing dimensions to fail so reviewers can re-run the rubric.

### Edits
- `src/lib/design-import.ts` — new pure importer for WonderLens markdown and `GameDesign` JSON.
- `src/lib/design-import.test.ts` — focused Node test covering markdown import, legacy style normalization, round parsing, JSON import, and every `.md` fixture under `designs/cat1` and `designs/cat5`.
- `src/components/upload/ExistingDesignImporter.tsx` — new client importer for `.md` and `.json` files.
- `src/app/page.tsx` — added a second entry path: create from YAML or review an existing design.
- `README.md` — updated user flow and project structure for the import path.

### NOT Changed
- No LLM-based conversion was added; import works without provider credentials.
- Imported markdown is normalized into the existing structured `GameDesign` model; raw markdown is not kept as a parallel source of truth.
- Imported designs are session-state editor entries, like gallery selections; they are not automatically persisted into `data/runs/`.
- Existing YAML generation, gallery, library, rubric, regeneration, and export routes were not refactored.

### Verification
```bash
npx tsx --test src/lib/design-import.test.ts
npx eslint src/lib/design-import.ts src/lib/design-import.test.ts src/components/upload/ExistingDesignImporter.tsx src/app/page.tsx
npx tsc --noEmit --pretty false
npm run build
```

Notes:
- Parser tests passed.
- Parser tests include all current spec/prod markdown files under `designs/cat1` and `designs/cat5`.
- Targeted ESLint passed.
- TypeScript passed.
- `npm run build` passed on retry after an earlier transient Google Fonts fetch failure.

---

## Autodesign Parity Changes — Complete

### Problem
Four concrete gaps between `wonderlens-design-studio` (Next.js SaaS) and the original `wonderlens-activity-autodesign` repo were identified during a brainstorming pass:
1. No first-class switch for mapping-informed vs freeform generation (autodesign Batch 1 vs Batch 2 contracts)
2. Closing step missing `tomorrowHook` (cross-session retention) and `conceptReinforcement` (auditable IB concept surfacing)
3. No opposite-category variant mode (autodesign Batch 3 flipped same entity to the other category)
4. No batch/comparative view or persistence — the in-memory job store cleaned jobs after 30 min, so there was no library of previously generated designs

### Solution
Shipped on branch `feat/autodesign-parity-changes` in 10 commits covering schema, pipeline, persistence, UI, and a follow-up fix pass. Every section went through implementer → spec review → code-reviewer → (optional) simplifier per superpowers subagent-driven-development. Full golden path verified end-to-end in the browser with real LLM generation (mapping-informed + freeform + opposite flow).

**Four design decisions locked:**
- **Freeform mode** means YAML still required, bridges use a single generic `warmStart` with `coldStart` omitted, `conversation_bridge.md` NOT injected, `tier_guidance` is soft guidance
- **Mapping-informed mode** produces dual `warmStart` + `coldStart` grounded in different dimensions, `conversation_bridge.md` flavor patterns injected, `tier_guidance` hard constraint
- **Opposite generation** is a per-variant gallery button (not automatic, not upload-form toggle) — lazy, explicit, low disruption
- **Persistence** via file-per-run JSON under `data/runs/` — dev-only transitional store, isolated behind `runs-repository.ts`, embeds full `GameDesign` for durable editor rehydration

### Edits

**Schema + rubric (commits `83c8308`, `0126dcb`, `dd8bc40`)**
- `src/lib/design-schema.ts` — added `generationMode: z.enum(["freeform", "mapping-informed"])` required on `basicInfo`; `conceptReinforcement` + `tomorrowHook` optional strings on `stepSchema` (semantically required on closing steps, following the warmStart/coldStart precedent); added `Category` type alias.
- `src/lib/rubric-checks.ts` (NEW) — `checkD5Deterministic` + `applyD5Override` helpers. Deterministic D5 pre-check: closing step must exist, `conceptReinforcement` must contain a word-boundary match of at least one `coreKeyConcepts[]` entry (NFKC-normalized, case-insensitive). Used by both `POST /api/evaluate` and both LLM-evaluate call sites in `generateVariant` — single helper, no duplication.
- `src/lib/prompts/generate.ts` — new 4th parameter `generationMode`; updated `JSON_SCHEMA_INSTRUCTIONS` to describe the new fields; mode-specific bridge rules for freeform vs mapping-informed.
- `src/lib/prompts/evaluate.ts` — D5 rubric section now notes the deterministic override and directs the LLM to judge D5 on Key Concept count, Related Concepts, KUD, and ATL skills.
- `src/app/api/generate/route.ts` — accepts `generationMode` in the POST body, validates via Zod `safeParse`, returns 400 on missing/invalid. No default — explicit is required.
- `src/app/api/evaluate/route.ts` — applies `applyD5Override` after LLM evaluate.
- Dead `z.ZodError instanceof` guard dropped from `api/generate/route.ts` catch block (refactor).

**Persistence (commits `e8c5388`, `1faec07`)**
- `src/lib/runs-repository.ts` (NEW) — filesystem-backed run persistence. Exports `saveRun`, `listRuns`, `getRun`, `getRunByDesignId`, `deleteRun`, `findOppositeOf`, `findOppositesFor` (batch), plus Zod `runRecordSchema.strict()`. Atomic writes via `fs.writeFile(tmp)` + `fs.rename`. Enforces the `generationMode` denormalization invariant: the embedded design is source of truth, `saveRun` copies from `design.basicInfo.generationMode` to the top-level field before parse. 10-char hex `runId`, ISO-safe filename with `:`/`.` replaced, `deleteRun` scans by suffix (not filename reconstruction) to be robust to scheme changes.
- `src/lib/pipeline.ts` — `generateVariant` measures end-to-end `durationMs`, constructs a `RunRecord` on the happy path (including `sourceEntityYaml: entity.rawYaml` so the opposite endpoint can re-parse the source later), and calls `saveRun` inside a try/catch that suppresses persistence failures with `console.error` so they can't block generation. New `DIMENSION_KEYS` module constant makes `totalScore` computation explicit. `category: string` tightened to `category: Category` union across `generateVariant`, `selectVariantConfigs`, `runGenerationJob`.
- `src/app/api/generate/route.ts` — `variantConfigs` body field now validated through Zod with a narrowed `Category` enum, returning 400 with Zod error messages on malformed input.
- `.gitignore` — `data/runs/*.json`, `data/runs/*.tmp` ignored; `data/runs/.gitkeep` preserved.
- `data/runs/.gitkeep` (NEW) — preserves the empty run directory across clones.

**Mode-aware pipeline + opposite endpoint (commits `3adecf6`, `9b72260`)**
- `src/lib/prompts/generate.ts` — split prompt construction into `buildSystemContent` (conditionally includes `conversation_bridge.md` only for mapping-informed) and `buildModeGuidance` (returns the mode-specific user-content block). Freeform guidance: soft tier_guidance, single warmStart, coldStart optional, no flavor patterns. Mapping-informed guidance: hard tier_guidance, dual bridges grounded in different dimensions, flavor selection from conversation_bridge.md.
- `src/app/api/generate/opposite/route.ts` (NEW) — `POST /api/generate/opposite { sourceDesignId, llmProvider, apiKey? }`. Validates body via Zod. Looks up source via `getRunByDesignId` (the persisted run file is the authoritative source — in-memory-only designs without a run file return 404). Flips category, picks the first game style for the target category, inherits the source's `generationMode`, re-parses `sourceEntityYaml` into a `ParsedEntity`, and delegates to `enqueueSingleVariantJob` which returns a `{jobId}` that the client polls via the existing `/api/generate/[jobId]/status` endpoint.
- `src/lib/pipeline.ts` — `generateVariant` gains `options?: { parentDesignId?: string; designId?: string }`. The saved `RunRecord` uses `isOpposite: options?.parentDesignId !== undefined` and `parentRunId: options?.parentDesignId ?? null`. `options?.designId ?? crypto.randomUUID()` is the crucial fix: the placeholder id minted in `runGenerationJob` and the persisted `designId` used to be two different UUIDs, so `getRunByDesignId(placeholder.id)` would have 404'd every opposite request. Now the caller controls the id and both match.
- New exported helper `enqueueSingleVariantJob` in `pipeline.ts` — creates the placeholder + jobs.set + fire-and-forget background closure, used by both the opposite endpoint and potentially future single-variant flows. The main multi-variant path still uses `runGenerationJob`. Both now thread `{ designId: placeholder.id }` into `generateVariant` so the placeholder id and the persisted id are identical.
- `src/lib/runs-repository.ts` — `runRecordSchema` gains `sourceEntityYaml: z.string().min(1)` so opposite generation can re-parse a `ParsedEntity` with full tier_guidance + dimension data (the embedded `GameDesign.entityMapping` alone lacks tier_guidance).

**UI: upload toggle, gallery opposite, editor closing fields (commit `cf61760`)**
- `src/components/upload/YamlUploader.tsx` — new segmented `radiogroup "Generation mode"` with Mapping-informed / Freeform. Default `mapping-informed`. Tooltip text changes based on selection. Flows into design-store's new `generationMode` slot (session-only, not persisted across reloads).
- `src/components/gallery/VariantCard.tsx` — mode pill badge, `⇄ Generate opposite` button (disabled when parent already has an opposite), orange opposite badge on sibling cards, visual link to parent via left border accent.
- `src/app/gallery/[entityId]/page.tsx` — fetches parents-with-opposite set via new `GET /api/runs/opposites?parentIds=...` route on gallery mount; `oppositeBusyParents` tracked as a Set (trimmed when children reach terminal state). Concurrent polling: the main multi-variant poller and per-opposite single-variant pollers run independently without clobbering each other.
- `src/components/editor/ScorecardPanel.tsx` / step renderer — two new `EditableField` textareas on closing steps: `conceptReinforcement` and `tomorrowHook`. Each uses field paths `steps.${stepIndex}.conceptReinforcement` / `.tomorrowHook` which `/api/regenerate` resolves via dot-notation against the live `GameDesign`. Editor header gains a mode chip next to the design title.
- `src/lib/api-client.ts` — `startGeneration` now requires `generationMode`; `generateOppositeVariant` added.
- `src/lib/generation-poller.ts` — `startOppositePolling` slot keyed by jobId in a `Map`, distinct from the singleton `active` slot for multi-variant jobs.
- `src/app/api/runs/opposites/route.ts` (NEW) — thin wrapper over `runs-repository.findOppositesFor` so the client-side gallery can query by parent designIds.

**Library view: Table + Grid tabs (commit `a49292b`)**
- `src/app/library/page.tsx` (NEW) — server component, calls `listRuns()` directly, passes `RunRecord[]` to client components.
- `src/components/library/LibraryTabs.tsx` (NEW) — client component owning tab state + Open/Delete handlers.
- `src/components/library/RunsTable.tsx` (NEW) — sortable columns (entity / category / mode / score / timestamp / game style / opposite / D1–D9 / actions), client-side sort cycle asc → desc → none → asc, CSV export button with RFC-4180 quote escaping, pair grouping applied at the group level so children stay attached to parents under any sort column.
- `src/components/library/RunsGrid.tsx` (NEW) — card grid sharing the same pair grouping helper.
- `src/components/library/RunActions.tsx` (NEW) — shared Open/Delete buttons.
- `src/lib/run-groupings.ts` (NEW) — pure `groupRunsWithOpposites` + `flattenGroups` helpers. Orphaned opposites (parent missing) render in their natural timestamp position with an `orphan` tag.
- `src/app/api/library/[runId]/route.ts` (NEW) — `GET` returns `{designId, design, rubricScores}` for Open rehydration; `DELETE` calls `runs-repository.deleteRun`. Open skips the in-memory job store entirely and writes directly to the Zustand store via `setActiveDesign`, because the editor's data flow reads from Zustand, not from `jobs`. (Deviation from the plan text; documented in `docs/plans/2026-04-14-autodesign-parity-changes.md`.)
- `src/app/layout.tsx` — new sticky global nav header with Upload / Library links.
- `src/lib/api-client.ts` — `openLibraryRun`, `deleteLibraryRun` added.

**Fix pass: shared pills, busy-set trim, editor layout (commit `b7479d9`)**
- `src/components/common/ModePill.tsx`, `CategoryPill.tsx`, `RubricDots.tsx` (NEW) — extracted the duplicated pills that had been copy-pasted across VariantCard, RunsTable, RunsGrid, and the editor header. CategoryPill accepts a `useLabel` prop since the gallery shows the long `CATEGORY_LABELS` form while the library uses the short `cat1`/`cat5` key.
- `src/app/editor/[designId]/page.tsx` — `h-screen` → `flex-1 min-h-0` so the editor consumes exactly the leftover viewport space below the sticky nav (the prior value made the body taller than the viewport, pushing the scorecard's bottom below the fold).
- `src/app/gallery/[entityId]/page.tsx` — `oppositeBusyParents` is now a `Set<string>` with explicit trim-on-terminal-state via a Zustand `subscribe` effect that prunes parents whose child reached `complete` or `failed`. Also added an effect to reset `parentsWithOpposite` to `[]` whenever `parsedEntity.name` changes, preventing stale entity-A pills from flickering on entity-B's first render.
- `src/components/library/LibraryTabs.tsx` — `busyRunId` cleared synchronously after `router.push` in `handleOpen` so the row doesn't appear stuck on "Opening..." forever if the user navigates back.
- `src/components/library/RunsTable.tsx` — `aria-sort` on sortable `<th>` elements; headers and CSV still use the 9-dimension shape.
- `src/components/library/RunActions.tsx` — explicit `aria-label="Delete run"` on the icon-only delete button.
- `src/app/page.tsx` — removed the duplicate page-level title that duplicated the global nav.
- `docs/plans/2026-04-14-autodesign-parity-changes.md` — Section 3 Open-action description updated to match the actual implementation (Zustand direct-write, not job-store rehydration).

**Docs + plans**
- `docs/plans/2026-04-14-autodesign-parity-changes.md` — full design plan committed alongside Section 1, amended during the Section 3 fix pass.
- `docs/game_design_playbook.md` (NEW, user-provided) — new source of truth for game design; 6 pillars × 12 styles × 10D rubric. Referenced by the next plan.
- `docs/plans/2026-04-14-playbook-alignment.md` (NEW) — Phase 1 + Phase 2 plan for aligning the codebase with the playbook: bracket tone markers, 10D rubric with renumbering, `experiencePillar` field, 12-style expansion, `selectVariantConfigs` rewrite. Phase 3 (Tier A/B/P pipeline, property-bridge templates, constellation bridging) deferred. Execute in a fresh session.

### NOT Changed
- **No Prisma / PostgreSQL.** Plan explicitly defers this. `data/runs/*.json` is a transitional dev-only store and is NOT safe on Vercel serverless. Section 4 of the plan documents that `runs-repository.ts` is the single seam where the backend can be swapped.
- **No automated tests.** Project has no `*.test.ts` setup; verification is manual via `npm run build` / `npm run lint` / browser playwright drive.
- **No editor rehydration of the in-memory job store.** The Open-from-library flow writes the design directly into the Zustand store via `setActiveDesign` and navigates to `/editor/[designId]`. The plan originally said "push back into in-memory job store" but the editor reads from Zustand, so that was unnecessary indirection.
- **No freeform coldStart.** Freeform mode emits only `warmStart`; `coldStart` is omitted entirely (undefined). The plan text was corrected to reflect this.
- **Old `data/runs/*.json` files** from manual verification remain on disk. They are valid under the current schema. They will become invalid when the next plan's 10D rubric + `experiencePillar` ships — delete them then.
- **No Visual Companion artifacts committed.** `.superpowers/brainstorm/` is gitignored. `library-pair-grouping.png` (a verification screenshot) was deleted before commit, not archived.

### Verification
```bash
git log --oneline b7933a9^..HEAD           # 10 commits
npm run build                                # clean, 14 routes
npm run lint                                 # clean
ls data/runs/*.json                          # 5+ run files from manual verification
python3 -c "import json; d = json.load(open('data/runs/2026-04-14T01-45-01-433Z-sunflower-cat5-396327d6d0.json')); print(d['isOpposite'], d['parentRunId'])"
```

**Manual browser drive (playwright)** confirmed:
1. Upload toggle flips Mapping-informed ↔ Freeform with tooltip update
2. YAML upload parses entity + shows summary
3. Gallery produces 4 variants (mapping-informed mode) with dual warm/cold bridges, all 9/9 PASS
4. Editor mode chip visible, Step 5 Closing renders `CONCEPT REINFORCEMENT` + `TOMORROW HOOK` textareas with per-field Ask AI
5. Editor layout fills viewport exactly (2360 = 2360, no overflow past sticky nav)
6. Run files persisted with correct filename format, denormalization invariant holds, D5 deterministic check passes ("Form" matches, "transform" does NOT)
7. `POST /api/generate/opposite` with a cat1 designId → 9/9 PASS cat5 sibling, `isOpposite: true`, `parentRunId` matches source `designId` (placeholder id fix verified)
8. Library Table + Grid render, pair grouping visually indents the opposite under its parent with `⇄` glyph, Export CSV button present
9. Delete action removes row from UI and file from disk atomically
10. Open action rehydrates via Zustand and renders the full design with all scorecard scores
11. **Freeform mode verified** in a separate generation pass: all freeform variants emit `warmStart` only, `coldStart` omitted, `conceptReinforcement` populated with concepts like "the magic of FUNCTION" and "the Form of sunflower parts" that pass the word-boundary D5 match

### Next steps
- Merge this branch (PR to follow)
- Start a fresh session to execute `docs/plans/2026-04-14-playbook-alignment.md` on a new branch `feat/playbook-alignment`. Before starting, delete `data/runs/*.json` (the 10D rubric + `experiencePillar` changes will invalidate all existing run files)

---

## Phase 1 Review and Contract Fixes — Complete

### Problem
Picked up from the existing Phase 1 handoff and reviewed the recent commit window (`fe61151`, `fa1b7be`, `37b150e`, `bd110da`, `06cd631`) plus the current workspace delta. Two end-to-end regressions were present in the newly wired API flow:
- Gallery generation posted `entityYaml`, but `POST /api/generate` still required `entity`
- Editor global regeneration posted an empty `fieldPath`, but `POST /api/regenerate` rejected empty strings as missing input

The workspace also still contains required runtime files under `src/lib/llm/` and `src/lib/yaml-parser.ts` as untracked files, and there is still no automated test suite in the repo.

### Solution
Reviewed the committed Phase 1 flow and fixed the broken request/response contracts instead of broadening scope. `POST /api/generate` now accepts the client payload shape used by the gallery and remains backward-compatible with the older `entity` field. `POST /api/regenerate` now accepts full-design regeneration requests with an empty or omitted `fieldPath`, and the regeneration prompt now explicitly supports both field-level and full-design updates. The handoff now records these fixes and the remaining repo risks.

### Edits
- `src/app/api/generate/route.ts`
  - Accepts `entityYaml` from the gallery client, with fallback to `entity` for compatibility.
  - Uses the normalized YAML source for parsing.
  - Runs `cleanupJobs()` before creating a new job.
- `src/app/api/regenerate/route.ts`
  - Treats `fieldPath` as optional instead of required.
  - Allows the editor’s global feedback regeneration flow to submit an empty field path.
- `src/lib/prompts/regenerate.ts`
  - Expanded the prompt contract to support full-design regeneration when `fieldPath` is empty.
  - Clarified the target description so the model can return either a single field value or a full `GameDesign` object.
- `HANDOFF.md`
  - Added this review entry with the commit window reviewed, fixes applied, and current risks.

### NOT Changed
- No automated tests were added. `package.json` still has no `test` script.
- No Prisma, NextAuth, or database work was added in this pass.
- No broader pipeline refactor was done beyond the API contract fixes above.
- `src/lib/llm/` and `src/lib/yaml-parser.ts` remain present in the workspace as untracked files; they were reviewed but not committed in this pass.

### Verification
```bash
git log --oneline --decorate -n 5
npx eslint src/app/api/generate/route.ts src/app/api/regenerate/route.ts src/lib/prompts/regenerate.ts
npm run build
npm run lint
git status --short
```

Notes:
- `npm run build` passed after the API contract fixes.
- `npm run lint` passed.
- No automated tests were available to run.

---

## Phase 1: AI Pipeline — Complete

### Problem
Phase 0 delivered the full UI scaffold (Upload, Gallery, Editor screens) but all backend functionality was stubbed with `console.log()`. No API routes, no generation pipeline, no prompt engineering, no markdown export. The app couldn't generate or evaluate designs.

### Solution
Implemented the complete backend on branch `feat/phase1-ai-pipeline` — 13 new files, 5 modified files, all stateless (no DB). The generation pipeline runs multi-pass LLM calls (generate → evaluate → fix → re-evaluate) with JSON parse retry logic. API routes use an in-memory job store for async generation with polling. Frontend is fully wired to the real API.

### Edits
- `src/lib/design-schema.ts` — Added `RubricIssue`, `VariantResult` (optional design for failed variants), `GenerationJob` types + Zod schemas
- `src/store/design-store.ts` — Added `llmProvider`, `apiKey`, `setLlmConfig` with Zustand `persist` middleware (localStorage)
- `src/lib/prompts/generate.ts` — Pass 1 prompt builder. Loads 5 data files at module scope, builds system + user messages with JSON schema instructions
- `src/lib/prompts/evaluate.ts` — Pass 2/4 rubric evaluation prompt with D1-D9 criteria
- `src/lib/prompts/fix.ts` — Pass 3 targeted fix prompt using failing dimensions + issues
- `src/lib/prompts/regenerate.ts` — Per-field regeneration prompt for Ask AI feature
- `src/lib/pipeline.ts` — Multi-pass pipeline: `generateVariant()` (4-pass with retry), `selectVariantConfigs()`, `runGenerationJob()` (sequential with per-variant error catching)
- `src/lib/markdown-export.ts` — `exportSpec()` (full format) and `exportProd()` (condensed per transform.md rules)
- `src/lib/api-client.ts` — Fetch wrapper: `startGeneration`, `pollGenerationStatus`, `evaluateDesign`, `regenerateField`, `exportDesign`
- `src/app/api/upload/route.ts` — YAML upload + parse endpoint
- `src/app/api/generate/route.ts` — Async generation job creation with in-memory store + 30min TTL cleanup
- `src/app/api/generate/[jobId]/status/route.ts` — Polling endpoint for generation progress
- `src/app/api/evaluate/route.ts` — 9D rubric evaluation via LLM
- `src/app/api/regenerate/route.ts` — Per-field AI regeneration
- `src/app/api/export/route.ts` — Markdown export (spec + prod)
- `src/app/gallery/[entityId]/page.tsx` — Added LLM settings bar (provider dropdown + API key input), generation trigger, 3-second polling loop with progressive variant rendering
- `src/app/editor/[designId]/page.tsx` — Wired `handleAskAI`, `handleRerunRubric`, `handleRegenerateWithFeedback`, `handleExport` to real API calls
- `.gitignore` — Fixed `lib/` → `/lib/` to stop ignoring `src/lib/`

### NOT Changed
- No Prisma schema, NextAuth, or database — all state is in-memory/client-side
- No automated tests added — verification is build + lint + manual
- No settings page — LLM config is inline on the gallery page
- ScorecardPanel component unchanged — already accepted `isEvaluating` prop

### Verification
```bash
npm run build    # All 9 routes compile, 0 errors
npm run lint     # 0 warnings, 0 errors
npm run dev      # Start dev server on http://localhost:3000
```

Manual smoke test:
1. Upload YAML from `data/mappings_dev20_0318/animals/big_cats.yaml`
2. Navigate to gallery, enter API key, click "Generate Variants"
3. Watch variants appear progressively as each completes
4. Click a variant to open in editor
5. Click "Re-run Rubric" to re-evaluate
6. Click "Export Design" to download spec + prod markdown

---

## Phase 0 Review and Hardening — Complete

### Problem
Phase 0 was marked complete, but the newly added Design Studio scaffold still needed a focused review against the current spec and actual repo state. The handoff also did not reflect the latest doc alignment work or the fact that there is no automated test suite in the repo yet.

### Solution
Reviewed the current Phase 0 implementation against `docs/superpowers/specs/2026-03-26-design-studio-design.md`, ran fresh verification, and tightened a few weak spots without changing scope. The review hardened YAML parsing and upload error handling, replaced the brittle nested Zustand field updater with a safer immutable setter, removed unnecessary CommonJS indirection from the provider factory, and simplified repeated conditional UI logic in the editor navigation, gallery card, and editor path handling. `AGENTS.md` is already aligned to the Design Studio project, and this handoff now records the current verified state.

### Edits
- `src/lib/yaml-parser.ts`
  - Added structural guards for invalid or empty YAML input.
  - Centralized string extraction helpers for themes, key concepts, and related concepts.
  - Corrected the `EntityMapping` shape so the inner `entity` field is optional, matching the actual top-level YAML structure.
- `src/components/upload/YamlUploader.tsx`
  - Cleared stale parsed-entity state on invalid file types and parse failures.
  - Added a file-reader result type check before parsing.
- `src/store/design-store.ts`
  - Replaced the previous path updater with a recursive immutable setter that handles nested arrays and objects more predictably.
- `src/lib/llm/provider.ts`
  - Replaced `require()`-based provider construction with direct TypeScript imports and a small constructor map.
- `src/components/editor/NavigationPanel.tsx`
  - Replaced the nested ternary icon selection with a dedicated helper for readability.
- `src/components/gallery/VariantCard.tsx`
  - Removed duplicated category-tag styling logic.
- `src/app/editor/[designId]/page.tsx`
  - Switched editor field paths to derive from the current step index instead of mixing hardcoded and computed paths.
- `HANDOFF.md`
  - Added this review entry and refreshed the session record to reflect the current Phase 0 state.

### NOT Changed
- Phase 0 scope is still the same: app scaffold, core screens, client-side state, and provider abstractions.
- No API route handlers were added in this pass.
- No Prisma schema, NextAuth setup, prompt builders, or markdown export implementation were added in this pass.
- No automated tests were added in this pass. There is currently no `test` script in `package.json`; verification remains lint/build plus manual review.

### Verification
```bash
npx eslint src/lib/yaml-parser.ts src/store/design-store.ts src/lib/llm/provider.ts src/components/editor/NavigationPanel.tsx src/components/gallery/VariantCard.tsx src/components/upload/YamlUploader.tsx 'src/app/editor/[designId]/page.tsx'
npx eslint src/lib/yaml-parser.ts
npm run build
npm run lint
```

Notes:
- `npm run build` initially failed on `src/lib/yaml-parser.ts` because `EntityMapping.entity` was incorrectly required; that mismatch was fixed and the build then passed.
- There are no automated tests in the repo yet, so no test command was available to run in this review pass.

---

## Phase 0: Project Setup — Complete

### Problem
Need a new standalone Next.js project for WonderLens Design Studio — a SaaS web app where educators upload entity YAML files, receive AI-generated game design variants, and refine them through a structured visual editor with per-field AI assistance and D1-D9 quality scoring.

### Solution
Scaffolded the full project with `create-next-app`, installed all dependencies, copied domain knowledge files from the autodesign repo, implemented all three frontend screens (Upload, Gallery, Editor), built the Zustand state layer, created the pluggable LLM provider interface with two adapters, and set up comprehensive TypeScript types with Zod validation. API endpoint directories are created but route handlers are deferred to Phase 1.

### Edits

**Configuration & setup:**
- `package.json` — Added dependencies: `@anthropic-ai/sdk`, `openai`, `@prisma/client`, `prisma`, `next-auth`, `zustand`, `zod`, `js-yaml` and their dev type packages
- `tsconfig.json` — Strict TypeScript config with `@/*` path alias to `src/*`
- `postcss.config.mjs` — Tailwind CSS v4 integration
- `eslint.config.mjs` — Next.js core web vitals + TypeScript rules
- `.env.example` — Template for `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, NextAuth secrets

**Pages (4 files, ~631 lines):**
- `src/app/layout.tsx` (33 lines) — Root layout with Geist fonts, dark mode, app title "WonderLens Design Studio"
- `src/app/page.tsx` (64 lines) — Upload landing page with `YamlUploader` component, entity summary display, navigate to gallery on success
- `src/app/gallery/[entityId]/page.tsx` (99 lines) — Variant gallery grid, maps over store variants, renders `VariantCard` components, loading spinner, "Regenerate All" button
- `src/app/editor/[designId]/page.tsx` (435 lines) — Three-panel editor: `NavigationPanel` (left), inline-editable fields organized by section (center), `ScorecardPanel` (right). Handles all step types (bridge with warm/cold start, rules, rounds, celebration, closing). Category-aware UI for cat5-specific fields. Backend calls stubbed with `console.log()`

**Components (6 files, ~754 lines):**
- `src/components/upload/YamlUploader.tsx` (175 lines) — Drag & drop + click-to-browse YAML uploader, parses via `parseEntityYaml()`, shows entity summary (themes, concepts, tiers, dimensions), error handling for invalid files
- `src/components/gallery/VariantCard.tsx` (121 lines) — Design variant card showing category tag, game style, activity name, description, creative variables, D1-D9 rubric score pills (green pass / red fail), pass count, loading skeleton, error state
- `src/components/editor/NavigationPanel.tsx` (105 lines) — Left sidebar tree view: Basic Info, Overview & KUD, Creative Variables, Steps 1-5. Dynamic sub-items for bridge (warm/cold) and rounds steps. Active section highlight
- `src/components/editor/EditableField.tsx` (97 lines) — Inline-editable text input or textarea with label, field path tracking, comment button, AI regeneration button, comment box for AI context
- `src/components/editor/DialogueBlock.tsx` (161 lines) — Multi-section dialogue editor: AI Says (indigo), Child Responses ideal/unexpected/silent (green/yellow/red), AI Follow-ups (purple), Screen Description (gray). All independently editable via `onChange` callback
- `src/components/editor/ScorecardPanel.tsx` (97 lines) — Right sidebar: D1-D9 dimension table with pass/fail status + labels, "Re-run Rubric" button, feedback textarea + "Regenerate with feedback" button, "Export Design" button. All backend calls stubbed

**Library (5 files, ~340 lines):**
- `src/lib/design-schema.ts` (162 lines) — Full TypeScript types (`GameDesign`, `DialogueBlock`, `Round`, `Step`, `RubricScores`) + Zod schemas for runtime validation. Constants: `RUBRIC_DIMENSIONS` (d1-d9 labels), `GAME_STYLES`, `CATEGORY_LABELS`, `TIER_LABELS`
- `src/lib/yaml-parser.ts` (113 lines) — Parses entity YAML via `js-yaml`, extracts name, themes, key concepts, tier counts, dimension summaries. Returns `ParsedEntity` type
- `src/lib/llm/provider.ts` (41 lines) — Abstract `LLMProvider` interface with `generate(messages, options)`, `LLMProviderType` union ("openai" | "anthropic"), factory function `createLLMProvider()`
- `src/lib/llm/openai.ts` (31 lines) — OpenAI adapter using `openai` SDK, model: `gpt-4o`, max tokens 16,000, JSON mode support
- `src/lib/llm/anthropic.ts` (33 lines) — Anthropic adapter using `@anthropic-ai/sdk`, model: `claude-sonnet-4-20250514`, max tokens 16,000, separates system from user/assistant messages

**State management (1 file, 113 lines):**
- `src/store/design-store.ts` — Zustand store with slices: upload (`parsedEntity`), gallery (`variants[]`), editor (`activeDesign`, `rubricScores`), generation (`generationJobId`), UI (`activeSection`). Includes `updateField(path, value)` with deep nested immutable setter supporting paths like `"steps.0.warmStart.aiSays"`

**Data files (copied from autodesign repo):**
- `data/program.md` — Full agent instructions + 9D rubric definitions
- `data/templates.md` — Cat 1 / Cat 5 structural templates
- `data/entity_guidance.md` — Entity YAML parsing rules
- `data/game_styles.md` — 6 game style patterns + constraints
- `data/transform.md` — Spec to prod markdown export rules
- `data/conversation_bridge.md` — Warm/cold start bridge patterns
- `data/mappings_dev20_0318/` — 21 entity YAML files across 14 domains

**API endpoint directories (created, no route handlers yet):**
- `src/app/api/generate/`
- `src/app/api/evaluate/`
- `src/app/api/regenerate/`
- `src/app/api/export/`
- `src/app/api/upload/`

**Documentation:**
- `CLAUDE.md` — Updated for Design Studio project (removed all Activity Demo references)
- `README.md` — Replaced create-next-app boilerplate with project overview, tech stack, structure, setup instructions
- `AGENTS.md` — Agent responsibilities and workflows
- `docs/superpowers/specs/2026-03-26-design-studio-design.md` — Full system design specification

### NOT Changed
- **No Prisma schema** — `prisma/schema.prisma` not created yet; current implementation uses Zustand client-side state only. Database schema deferred to Phase 1
- **No NextAuth configuration** — Dependency installed but no `api/auth/[...nextauth]/route.ts` or provider setup
- **No API route handlers** — Directories created but no `route.ts` files; all backend calls stubbed in frontend with `console.log()`
- **No markdown export logic** — `src/lib/markdown-export.ts` not created; export button in scorecard is a placeholder
- **No prompt engineering files** — `src/lib/prompts/` directory not created; generation/evaluation/regeneration prompts deferred to Phase 2

### Verification
```bash
npm install          # Install all dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Verify production build succeeds
npm run lint         # Run ESLint checks
```

**Manual checks:**
1. Visit `/` — should see YAML upload screen with drag & drop area
2. Upload a YAML from `data/mappings_dev20_0318/` — should parse and show entity summary
3. Navigate to `/gallery/test` — should see gallery layout (no variants without backend)
4. Navigate to `/editor/test` — should see three-panel editor layout (no data without backend)
