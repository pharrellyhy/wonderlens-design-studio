# ActivityBundle Migration — Implementation Plan

## Context

The on-disk activity layout has been redesigned. Each game now lives in `activities/<activity_id>/` as **5 files** (see `activities/README.md`, canonical example `activities/mystery_trail_butterfly/`):

1. `spec.md` — *authoring intent*: premise, IB-axis target, pedagogical rationale, selection trigger w/ tier_guidance attribute IDs, pillar/style/mechanic identity
2. `prod.md` — runtime: Basic Info table, **A.1 entity_attributes_covered**, **A.2 constellation adaptation notes** (Preserve/Swap/Watch), Activity Overview + KUD, Interaction Flow with steps
3. `tag_block.yaml` — structured metadata, JSON-Schema-validated against `activities/_schema/tag_block.schema.json` (closed enums: 12 observation_angle, 10 mechanic, 4 entity_role, 7 IB key_concepts, …)
4. `recap.template.yaml` — child recap payload + rendered text, with `{runtime_*}` placeholders
5. `dashboard.template.yaml` — parent dashboard fragment + `contributes_to` aggregation hooks

The current Studio still emits **one** `spec.md` + **one** `prod.md` from a flat `GameDesign` schema. This is misaligned in three places:

- **Generation output** — only produces 2 of 5 files; `tag_block`/`recap`/`dashboard` are missing entirely; `spec.md` content matches the *runtime* shape, not the new *authoring intent* shape; `prod.md` lacks A.1/A.2 sections.
- **Export** — `/api/export` returns `{specMd, prodMd}` JSON; users can't drop output into `activities/<id>/`.
- **Importer** — `design-import.ts` parses a single legacy `.md`; no path for the new 5-file layout.

This plan replaces `GameDesign` with a richer `ActivityBundle` whose 5 named children (`spec`, `prod`, `tagBlock`, `recap`, `dashboard`) mirror the on-disk layout 1:1, rewrites the generation prompt + export + importer accordingly, and migrates the editor UI to edit *prose + tag_block* (with closed-enum dropdowns) while rendering *recap + dashboard* as derived previews.

## Decisions

1. **Schema**: one bundle schema, 5 named children — `ActivityBundle = { schemaVersion, activityId, generationMode, spec, prod, tagBlock, recap, dashboard }`.
2. **Generation strategy**: ONE LLM call returns one JSON conforming to the full `activityBundleSchema`. The existing 4-pass pipeline (generate → evaluate → fix → re-evaluate) keeps working at the orchestration level.
3. **Editor scope**: edit prose (`spec` + `prod`) + `tagBlock` with closed-enum dropdowns. `recap` and `dashboard` are derived/preview-only.
4. **Export**: ZIP download. POST `/api/export` returns `application/zip`; root folder is `<activity_id>/`, contents are the 5 files.
5. **Import**: accept ZIP or folder of 5 files. Legacy single-`.md` importer is **removed**.

---

## 1. Schema design — `src/lib/activity-bundle-schema.ts` (NEW)

Keep `src/lib/design-schema.ts` for primitives only: `dialogueBlockSchema`, `roundSchema`, `stepSchema` (incl. closing `conceptReinforcement`/`tomorrowHook`), `rubricScoreSchema`, `rubricScoresSchema`, `rubricIssueSchema`, `RUBRIC_DIMENSIONS`, `experiencePillarSchema`, `categorySchema`, `tierSchema`, `generationModeSchema`, `PILLAR_STYLES`, `styleToPillar`, `PILLAR_LABELS`, `CATEGORY_LABELS`, `TIER_LABELS`. Strip `gameDesignSchema`/`variantResultSchema`/`generationJobSchema`; re-export bundle-shaped versions from the new module.

### 1.1 Closed enums (verbatim from `activities/_schema/tag_block.schema.json`)

| Schema | Values | Notes |
|---|---|---|
| `observationAngleSchema` | color, shape, size, quantity, texture, material, pattern, function, origin, behavior, emotion, state | 12 |
| `mechanicSchema` | enumerate, compare, collect, sort, deduce, voice, build, predict, narrate, care | 10 |
| `entityRoleSchema` | subject, exemplar, catalyst, reference | 4 |
| `ibKeyConceptSchema` | Form, Function, Causation, Change, Connection, Perspective, Responsibility | 7 (TitleCase, used in `tag_block.key_concepts`) |
| `topicAxisSchema` | form, function, causation, change, connection, perspective, responsibility | 7 (lowercase, used in `progression.topic_axis`) |
| `tagBlockPillarSchema` | Discovery, Performance, Mystery, Creation, Adventure, Connection | 6 (TitleCase) |
| `entityBindingSchema` | bound, parameterized, agnostic | 3 |
| `templateTypeSchema` | cat1, cat5 | 2 |
| `tierEnumSchema` | T0, T1, T2 | 3 |
| `caregiverRoleSchema` | scaffold, co-explorer, observer | 3 |

**Dual-capitalisation gotcha**: existing `experiencePillarSchema` is lowercase (`mystery|creation|performance|discovery|adventure|nurture`); `tagBlockPillarSchema` is TitleCase. Add `EXPERIENCE_PILLAR_TO_TAG_BLOCK_PILLAR` map. `nurture → Connection` is the only non-trivial mapping; flag as TODO to confirm against `docs/activity_vocabulary.md`.

### 1.2 The 5 children

- **`specSchema`** — `{ title, subtitle?, premise, target: { ibAxisPrimary, ibAxisSecondary?, primaryTier: tierEnumSchema, tierElasticity, ageNotes }, pedagogicalRationale, selectionTrigger: { description, tierGuidanceAttributeIds: string[].min(1), constellationNotes? }, identity: { pillar (TitleCase), gameStyle, mechanic, observationAngle, entityRole } }`.
- **`prodSchema`** — `{ basicInfo: { activityName, activityCategory: templateTypeSchema, recommendedTier: tierEnumSchema, coreIbKeyConcepts: ibKeyConceptSchema[].min(1), relatedConcepts, atlSkillsFocus, gameStyle, designVersion, lastUpdated (YYYY-MM-DD) }, entityAttributesCovered: string[].min(1), constellationAdaptation: { preserve, swap, watch }, overview: { briefDescription, designHighlight, typicalScenario }, kud: { know, understand, do }, steps: stepSchema[].min(1) }`. **Reuses** `stepSchema`/`dialogueBlockSchema`/`roundSchema`/`childResponsesSchema` unchanged.
- **`tagBlockSchema`** — full Zod port of `tag_block.schema.json`, with `.passthrough()` to mirror `additionalProperties: true`. Includes `activity_id` regex `^[a-z][a-z0-9_]+$`, `tier_range`, `progression`, `caregiver_role`, `activity_signature.bridge_prerequisites.primary` constrained to observation-angle enum (max 3), `matchability.tier_support: { T0,T1,T2 booleans }.strict()`.
- **`recapSchema`** — `{ payloadDefaults: { entity, tier, ageYears (placeholder strings), whatWeNoticed: observationAngleSchema, whatWeDid (past-tense mechanic), entityRole, focalAttribute: { token, childLabel, badgeEmojiNone }, highlightMoment, finds?: { label, photo }[], difficultyLevel (1-3), nextStepHint, caregiverObserved, rewardBadge }, rendered: { title, line_1, line_2, line_3, badge, next } }`.
- **`dashboardSchema`** — `{ session: { axis: topicAxisSchema, angle: observationAngleSchema, mechanic, entityRole, focalAttribute, entryRung, exitRung, outcome (placeholder) }, contributesTo: { curiosityRadial: { axis, angle }, explorationMatrix: { cell }, keyConceptsExposure: Record<ibKeyConcept, { angle: observationAngle }>, atlSkillsTrail: string[] } }`.

### 1.3 ActivityBundle + cross-doc invariants (`superRefine`)

```ts
activityBundleSchema = z.object({
  schemaVersion: z.literal(1),
  activityId:    z.string().regex(/^[a-z][a-z0-9_]+$/),
  generationMode: generationModeSchema,
  spec, prod, tagBlock, recap, dashboard,
}).superRefine(...)
```

Invariants enforced:

- **I1** `tagBlock.activity_id === activityId`
- **I2** `prod.basicInfo.gameStyle === tagBlock.game_style`
- **I3** `prod.basicInfo.activityCategory === tagBlock.template_type`
- **I4** `prod.basicInfo.recommendedTier === tagBlock.tier_range.primary`
- **I5** `spec.identity.pillar === tagBlock.pillar`
- **I6** `spec.identity.gameStyle === tagBlock.game_style`
- **I7** `spec.identity.{mechanic, observationAngle, entityRole}` mirror `tagBlock.activity_signature.{mechanic, observation_angle, entity_role}`
- **I8** `recap.payloadDefaults.whatWeNoticed === tagBlock.activity_signature.observation_angle`
- **I9** `recap.payloadDefaults.entityRole === tagBlock.activity_signature.entity_role`
- **I10** `dashboard.session.{angle,mechanic,axis,entityRole,focalAttribute}` mirror tagBlock equivalents (`axis === progression.topic_axis`)
- **I11** `(pillar lower-cased, category) → game_style` matches `PILLAR_STYLES[pillar][category]` (preserves existing pillar↔style↔category check)

`variantResultSchema`/`generationJobSchema` are renamed-field clones: `design?` → `bundle?`. `RubricScores`/`RubricIssue` reused unchanged.

---

## 2. Generation prompt rewrite — `src/lib/prompts/generate.ts`

ONE LLM call. Replace `JSON_SCHEMA_INSTRUCTIONS` with a TS-interface block describing `ActivityBundle` end-to-end. Add three subsections:

1. **Closed Vocabularies** — list all closed enums verbatim as bullet lists; reference `activities/_schema/tag_block.schema.json` and `docs/activity_vocabulary.md` so the model never substitutes synonyms.
2. **Cross-Doc Invariants** — list I1–I11 as one-sentence rules; turns the validator's failure modes into authoring guidance.
3. **Derived Fields — Author These Too** — explicitly require the LLM to author `dashboard.contributesTo.*` and `recap.payloadDefaults.whatWeDid`. The editor will not let users hand-edit them, but the LLM produces them and the validator enforces consistency.

Add an **`activityId` convention**: `<game_style>_<entity>` lowercase snake_case (e.g. `mystery_trail_butterfly`). Inline `activities/mystery_trail_butterfly/{spec,prod,tag_block,recap,dashboard}.*` as a "Reference Bundle" few-shot. `buildSystemContent` still loads `playbookMd`, `templatesMd`, `entityGuidanceMd`, plus mode-conditional `conversationBridgeMd`. `buildModeGuidance` unchanged.

### 2.1 Post-LLM derivation (kept minimal)

We do **not** auto-derive `dashboard.contributesTo` server-side — the validator surfaces any divergence, and round-tripping through edit→re-evaluate stays clean. Single exception: if `recap.payloadDefaults.whatWeDid` is missing, fill via a `MECHANIC_PAST_TENSE` map in `src/lib/bundle-derivations.ts` (`collect → collected`, `compare → compared`, …). Called only inside `parseAndValidateBundle` when missing.

---

## 3. Export pipeline — `src/lib/bundle-export.ts` (NEW)

Add `jszip` to dependencies. Reuse `formatDialogueBlock` and `formatStep` from existing `src/lib/markdown-export.ts` (delete `exportSpec`/`exportProd`/`formatStepProd` once consumers migrate).

API: `renderSpecMarkdown(b)`, `renderProdMarkdown(b)`, `renderTagBlockYaml(b)`, `renderRecapYaml(b)`, `renderDashboardYaml(b)`, `bundleToZip(b): Promise<Uint8Array>`.

- **`renderSpecMarkdown`** mirrors `activities/mystery_trail_butterfly/spec.md`: `# {title}`, `> {subtitle}`, `## Premise`, `## Target` bullets, `## Pedagogical rationale`, `## Selection trigger` (description + bulleted attribute IDs + constellation note), `## Experience pillar & game style` (5 bullets pulled from `spec.identity` + `tagBlock.activity_signature`).
- **`renderProdMarkdown`** mirrors `activities/mystery_trail_butterfly/prod.md`: `## {activityName}`, `### A. Basic Info` 9-row table from `prod.basicInfo`, `### A.1 Entity Attributes Covered` (yaml fenced block), `### A.2 Constellation Adaptation Notes` (Preserve/Swap/Watch), `### B. Activity Overview` (4 numbered bullets ① brief ② KUD ③ highlight ④ scenario), `### C. Interaction Flow` followed by `formatStep(step)` for every step (already renders bridge warm/cold, rounds, closing reinforcement).
- **`renderTagBlockYaml`** uses `js-yaml` then post-processes to splice `# §0 IDENTITY`, `# §1 IB FRAME`, `# §2 ACTIVITY SIGNATURE`, `# §3 MATCHABILITY` block-comment headers in front of `activity_id`, `entity`, `activity_signature`, `matchability` keys. `additionalProperties` (passthrough) preserved.
- **`renderRecapYaml`** / **`renderDashboardYaml`** are plain `js-yaml.dump` with a hard-coded one-line preamble each.
- **`bundleToZip`** packs root folder `<bundle.activityId>/` containing all 5 files.

---

## 4. Import pipeline — `src/lib/bundle-import.ts` (NEW); delete `design-import.ts`

Delete `src/lib/design-import.ts` and `src/lib/design-import.test.ts` in phase 1.

API:

- `importBundleFromZip(buf: ArrayBuffer): Promise<ImportedBundleResult>` — opens with `jszip`, accepts any single root directory.
- `importBundleFromFiles(files: File[]): Promise<ImportedBundleResult>` — folder-picker path; matches the 5 expected filenames case-insensitively.

Both share `parseBundleFiles`:

1. Locate the 5 expected files (`spec.md`, `prod.md`, `tag_block.yaml`, `recap.template.yaml`, `dashboard.template.yaml`); throw `BundleImportError` listing missing names.
2. YAML files via `js-yaml.load` (`JSON_SCHEMA`, no custom types).
3. Markdown files via narrow parsers (`parseSpecMarkdown`, `parseProdMarkdown`) walking the **fixed structure** the renderers above produce — not generic markdown parsing. Tiny (~150 LOC total) and round-trip lossless against the canonical `mystery_trail_butterfly` files.
4. Synthesise the bundle: `activityId` from root dir name (zip) or `tagBlock.activity_id` (folder); `generationMode` from a tagBlock passthrough key `x_generation_mode`, defaulting to `freeform` if absent.
5. `activityBundleSchema.parse(...)` — superRefine surfaces every cross-doc mismatch as one error.
6. Returned `rubricScores` defaults to all-fail. Importer never auto-rates.

`BundleImportError extends Error` with `.missingFiles?: string[]` and `.zodIssues?: ZodIssue[]`. UI shows both.

---

## 5. Migration of every consumer

### 5.1 Editor UI

- `src/store/design-store.ts`: rename `activeDesign`→`activeBundle`, `setActiveDesign`→`setActiveBundle`. `updateField(path, value)` reused; new path roots `spec.*`, `prod.*`, `tagBlock.*`. Reject any path beginning with `recap.` or `dashboard.` (write-guard with `console.warn`) — those are derived previews. `generationMode` selector reads from `activeBundle.generationMode`.
- `src/app/editor/[designId]/page.tsx`: header `activeDesign.basicInfo.activityName` → `activeBundle.prod.basicInfo.activityName`; `experiencePillar` derived from `activeBundle.tagBlock.pillar` via reverse map for `<PillarPill>`. Section ids become `spec`, `prod-basic`, `prod-overview`, `prod-steps`, `tagBlock`, `recap-preview`, `dashboard-preview`. Drop existing `creativeVariables` and standalone `basicInfo` sections.
- `src/components/editor/NavigationPanel.tsx`: new groups Spec / Prod (basic + A.1/A.2 + overview + KUD + step list) / Tag Block / Recap (read-only) / Dashboard (read-only).
- `EditableField.tsx`, `DialogueBlock.tsx`: unchanged; still bind via path.
- **NEW `TagBlockPanel.tsx`**: dropdowns for every closed enum (`observation_angle`, `mechanic`, `entity_role`, `key_concepts` multi-select, `topic_axis`, `caregiver_role` multi-select, `entity_binding`, `template_type`, `pillar`); text inputs for `activity_id`, `entity`, `focal_attribute`, `intro`, `preview_label`, `preview_prompt`; number for `progression.difficulty_level`; bool checkboxes for `matchability.tier_support.*`.
- **NEW `RecapPreview.tsx`**: renders `recap.rendered.{title,line_1..3,badge,next}` as a styled child-card; collapses `payloadDefaults` JSON in a `<details>`.
- **NEW `DashboardPreview.tsx`**: renders `dashboard.session` as a labelled grid and `contributesTo` as bullet groups.
- `ScorecardPanel.tsx`: unchanged — `RubricScores` shape preserved.
- `src/lib/api-client.ts`: `evaluateDesign`/`regenerateField`/`exportDesign` request/response field renames `design`→`bundle`. `exportDesign` becomes a blob download (no `format` param).

### 5.2 Gallery / library

- `src/components/gallery/VariantCard.tsx`: `design?: GameDesign` → `bundle?: ActivityBundle`. `design.basicInfo.activityName` → `bundle.prod.basicInfo.activityName`; `design.overview.briefDescription` → `bundle.prod.overview.briefDescription`; `experiencePillar` derived from `bundle.tagBlock.pillar`. Replace the three creative-variable rows (Drama/Award/TrendingUp) with: `focal_attribute` (`bundle.tagBlock.activity_signature.focal_attribute`), `mechanic × observation_angle` computed string, `reward_hook` (`bundle.tagBlock.progression.reward_hook`).
- `src/app/gallery/[entityId]/page.tsx`: polling unchanged; `VariantResult.design` → `bundle` cascades.
- `src/components/library/RunsTable.tsx`, `RunActions.tsx`, `LibraryTabs.tsx`, `RunsGrid.tsx`: read flat `RunRecord` fields only; surface-only renames if any.
- `src/lib/run-groupings.ts`: pure data; no shape touch.

### 5.3 Persistence

- `src/lib/runs-repository.ts`: `runRecordSchema.design: gameDesignSchema` → `bundle: activityBundleSchema`. Keep denormalised `category`/`gameStyle` for sort keys. `saveRun` normalises `generationMode: run.bundle.generationMode`. Filename scheme unchanged.
- `src/lib/job-store.ts`: in-memory only; no shape touch.
- `src/app/api/library/[runId]/route.ts`: GET returns `RunRecord`; consumers read `bundle` instead of `design`.

### 5.4 Pipeline + prompts

- `src/lib/pipeline.ts`: `let design` → `let bundle`; `gameDesignSchema` → `activityBundleSchema` in `llmJsonCall`; `applyD4Override(scores, issues, bundle)` reading `bundle.prod.steps` / `bundle.prod.basicInfo.coreIbKeyConcepts`.
- `src/lib/rubric-checks.ts`: `checkD4Deterministic(bundle)`; logic identical, paths swapped.
- `src/lib/prompts/evaluate.ts`: 10 dimensions unchanged; `buildEvaluateMessages(bundle)`; user prompt JSON-stringifies the bundle and adds a one-paragraph note about which sub-tree to evaluate per dimension (`prod.steps` for D1/D3/D5/D6/D7, `prod.basicInfo` for D4 counts, `tagBlock` for D8/D10).
- `src/lib/prompts/fix.ts`: `buildFixMessages(bundle, issues)`; system prompt updated to ActivityBundle shape.
- `src/lib/prompts/regenerate.ts`: rewrite path examples (`prod.basicInfo.activityName`, `spec.premise`, `tagBlock.activity_signature.observation_angle`, `prod.steps[2].rounds[1].dialogue.aiSays`); empty path = full bundle. Add a guard: paths beginning `recap.` or `dashboard.` return 400 — those are derived.
- API routes `evaluate`, `regenerate`, `generate/[jobId]/status`: rename body field `design` → `bundle`.

### 5.5 Opposite generation

- `src/app/api/generate/opposite/route.ts`: `sourceRun.design.basicInfo.experiencePillar` → derive lowercase pillar from `sourceRun.bundle.tagBlock.pillar` via reverse map. `sourceRun.category` already on the flat record.

### 5.6 Export route

- `src/app/api/export/route.ts`: parse `{ bundle }`, validate, return `new NextResponse(zipBytes, { headers: { "content-type": "application/zip", "content-disposition": "attachment; filename=\"<activityId>.zip\"" } })`. Drop the `format` parameter entirely.

### 5.7 Upload / import endpoints

- `src/components/upload/ExistingDesignImporter.tsx`: dual affordance — ZIP file input OR multi-file folder picker (`webkitdirectory`). POST multipart to `/api/upload`. Display `BundleImportError` (missing files + zod issues).
- `src/app/api/upload/route.ts`: dispatch to `importBundleFromZip` or `importBundleFromFiles`.
- `src/components/upload/YamlUploader.tsx`: unchanged (entity-YAML upload for generation, not design import).

### 5.8 Misc deletions

- `src/lib/design-import.ts`, `src/lib/design-import.test.ts`.
- `markdown-export.ts` exports `exportSpec`, `exportProd`, `formatStepProd` (keep `formatDialogueBlock`, `formatStep` if reused; otherwise re-export from `bundle-export.ts`).
- `data/runs/*.json` (16 stale files at audit time) → keep `.gitkeep`.

---

## 6. Validation strategy

- **Runtime guard**: every API boundary calls `activityBundleSchema.parse(...)`; the `superRefine` block centralises all cross-doc invariants (single Zod error envelope).
- **Drift test** `src/lib/__tests__/tag-block-schema-drift.test.ts`: at test time loads `activities/_schema/tag_block.schema.json` and asserts each Zod enum's `_def.values` (sorted) equals the JSON-schema enum (sorted) for `observation_angle`, `mechanic`, `entity_role`, `topic_axis`, `key_concepts`, `caregiver_role`, `entity_binding`, `template_type`, `pillar`, `tier`. Failure message names the diff. CI-blocking.
- **Round-trip test** `src/lib/__tests__/bundle-roundtrip.test.ts`: imports `activities/mystery_trail_butterfly/*` from disk, runs `bundleToZip`, unzips in-memory, re-imports, asserts deep equality.
- **Rubric stays 10D unchanged.** D4 deterministic check repointed at `bundle.prod`; semantics identical.

---

## 7. Legacy data handling

- `data/runs/*.json` are deleted in phase 1, replaced by `.gitkeep`. `listRuns()` would skip them with a warning anyway; explicit deletion keeps CI logs clean.
- No conversion script — re-running a couple of fixtures replenishes the library.
- `designs/cat1/`, `designs/cat5/` markdown fixtures (used by deleted tests) stay on disk for reference but no code reads them.

---

## 8. Phased rollout

| Phase | Scope | Verifiable end-state |
|---|---|---|
| **1** | Schemas + wipe legacy: `activity-bundle-schema.ts`, drift test, delete `data/runs/*.json`, delete `design-import.ts`+test, strip three big schemas from `design-schema.ts`. | `tsc --noEmit` red across the repo (intentional punch list); drift test green. |
| **2** | Exporter + ZIP route: add `jszip`, write `bundle-export.ts`, rewrite `export/route.ts`. | Manual: feed a hand-built `ActivityBundle` literal → `bundleToZip` → `unzip` → byte-diff against `mystery_trail_butterfly/*` (modulo whitespace). |
| **3** | Importer + upload route: `bundle-import.ts`, rewrite `upload/route.ts` and `ExistingDesignImporter.tsx`. | Round-trip test green. |
| **4** | Pipeline + prompts + opposite: rewrite all four prompt files; migrate `pipeline.ts`, `rubric-checks.ts`, `runs-repository.ts`, opposite/evaluate/regenerate/status routes. | One cat1 + one cat5 generated end-to-end; both pass `activityBundleSchema` and the python `jsonschema` snippet. |
| **5** | Editor UI + gallery + library: store rename, page restructure, NavigationPanel rewrite, three new panels, VariantCard migration, library audits, api-client renames. | `npm run dev` opens generated bundles in the editor; all sections render; `Ask AI` regenerates `tagBlock.activity_signature.observation_angle` and the change propagates into Recap/Dashboard previews. |
| **6** | Cleanup + verification: delete dead exports; lint, typecheck, node tests, python snippet end-to-end. | All checks green. |

Each phase is independently buildable: phases 2–4 leave the editor red until phase 5, but APIs and CLI tests work.

---

## 9. File-by-file change list

**NEW**

- `src/lib/activity-bundle-schema.ts` — schemas, enums, invariants, types.
- `src/lib/bundle-export.ts` — 5 renderers + `bundleToZip`.
- `src/lib/bundle-import.ts` — zip/folder importers + narrow markdown parsers.
- `src/lib/bundle-derivations.ts` — `MECHANIC_PAST_TENSE`, derivation helpers.
- `src/components/editor/TagBlockPanel.tsx` — closed-enum dropdowns + text inputs.
- `src/components/editor/RecapPreview.tsx` — read-only child recap card.
- `src/components/editor/DashboardPreview.tsx` — read-only parent fragment.
- `src/lib/__tests__/tag-block-schema-drift.test.ts` — enum drift guard.
- `src/lib/__tests__/bundle-roundtrip.test.ts` — export/import round-trip.

**EDIT**

- `src/lib/design-schema.ts` — strip `gameDesignSchema`/`variantResultSchema`/`generationJobSchema`; keep primitives + constants.
- `src/lib/pipeline.ts` — `design` → `bundle`; schema swap; D4 override target.
- `src/lib/rubric-checks.ts` — `checkD4Deterministic(bundle)`.
- `src/lib/runs-repository.ts` — record schema swap; `saveRun` normalisation.
- `src/lib/prompts/generate.ts` — full prompt rewrite (interface + invariants + vocab + few-shot).
- `src/lib/prompts/evaluate.ts` — input rename + dimension hint paragraph.
- `src/lib/prompts/fix.ts` — input rename + bundle shape note.
- `src/lib/prompts/regenerate.ts` — path examples + recap/dashboard guard.
- `src/lib/api-client.ts` — `design` → `bundle`; export returns blob.
- `src/store/design-store.ts` — `activeBundle` rename + recap/dashboard write-guard.
- `src/app/editor/[designId]/page.tsx` — section restructure.
- `src/components/editor/NavigationPanel.tsx` — new groups.
- `src/components/gallery/VariantCard.tsx` — field renames + tagBlock-driven detail rows.
- `src/app/api/export/route.ts` — return `application/zip`.
- `src/app/api/upload/route.ts` — bundle import dispatcher.
- `src/components/upload/ExistingDesignImporter.tsx` — zip/folder picker.
- `src/app/api/generate/opposite/route.ts` — pillar derivation from tagBlock.
- `src/app/api/evaluate/route.ts`, `src/app/api/regenerate/route.ts`, `src/app/api/generate/[jobId]/status/route.ts` — `bundle` field swap.
- `package.json` — add `jszip`.

**DELETE**

- `src/lib/design-import.ts`
- `src/lib/design-import.test.ts`
- `data/runs/*.json` (keep `.gitkeep`)
- `markdown-export.ts` exports `exportSpec`, `exportProd`, `formatStepProd` (keep `formatDialogueBlock`, `formatStep`).

---

## 10. Verification plan

1. `npm run lint` and `npx tsc --noEmit` — both clean.
2. `node --test src/lib/__tests__/tag-block-schema-drift.test.ts src/lib/__tests__/bundle-roundtrip.test.ts` — green.
3. **Manual generation**: `npm run dev` → upload a sample entity YAML from `data/mappings_dev20_0318/` → trigger 1 cat1 + 1 cat5 → confirm gallery card renders activityName + focal_attribute + mechanic × observation_angle.
4. **Editor round-trip**: open generated bundle → confirm Spec / Prod / Tag Block sections are editable, Recap and Dashboard previews read-only; rerun rubric works; regenerating `tagBlock.activity_signature.observation_angle` updates the field AND propagates into the recap/dashboard previews via the cross-doc bind.
5. **End-to-end disk validation**: click Export → browser downloads `<activityId>.zip` → `unzip` to `activities/<id>/` → run the python snippet from `activities/README.md`:
   ```
   python3 -c "
   import json, yaml, pathlib, sys
   from jsonschema import Draft202012Validator
   schema = json.loads(pathlib.Path('activities/_schema/tag_block.schema.json').read_text())
   v = Draft202012Validator(schema)
   ok = True
   for p in sorted(pathlib.Path('activities').glob('*/tag_block.yaml')):
       errs = list(v.iter_errors(yaml.safe_load(p.read_text())))
       print(('OK  ' if not errs else 'FAIL'), p)
       for e in errs:
           ok = False
           print(f'  {list(e.absolute_path)}: {e.message}')
   sys.exit(0 if ok else 1)
   "
   ```
   All entries print `OK` and exit 0. Requires `pip install jsonschema pyyaml`.
6. **Import round-trip**: re-upload the same zip via `ExistingDesignImporter`; confirm editor opens with bundle equal to the exported one and rubric all-fail.
7. **Library**: generate two more, confirm `RunsTable` + CSV export still work with the renamed embedded `bundle` field.

---

## Critical files

- `src/lib/activity-bundle-schema.ts` (NEW — Zod schemas + cross-doc invariants)
- `src/lib/bundle-export.ts` (NEW — 5 renderers + zip)
- `src/lib/bundle-import.ts` (NEW — zip/folder import)
- `src/lib/prompts/generate.ts` (REWRITE — `JSON_SCHEMA_INSTRUCTIONS` for ActivityBundle)
- `src/lib/pipeline.ts` (EDIT — bundle field swap; D4 override target)
- `src/app/editor/[designId]/page.tsx` (EDIT — section restructure for spec/prod/tagBlock + previews)

---

## Note on plan location

Per the project's `CLAUDE.md`, design plans live in `docs/plans/`. Once this plan is approved and execution begins, copy this file to `docs/plans/2026-05-07-activity-bundle-migration.md` and commit it (as the first execution-phase commit) so the plan ships with the codebase.
