# Review Console Integration + Landing Simplification

## Summary

Integrate an activity review console into WonderLens Design Studio instead of building a separate frontend. The studio already imports 5-file activity bundles, renders editable structured activity data, shows rubric results, and previews recap/dashboard output. The review console should layer deterministic review diagnostics and authoring metadata visibility on top of the existing bundle editor.

Also simplify the landing page. The current page puts generation, mode selection, explanatory cards, and existing-activity review into one long mixed flow. Split it into task-first entry points so reviewers do not need to scan generation controls when they only want to inspect existing activities.

## Goals

- Make generated activity packages easy to inspect without reading five files manually.
- Support review of `activities/<activity_id>/` bundles from `wonderlens-activity-autodesign`.
- Surface mechanic-first adaptation metadata, asset dependencies, and product capability risks.
- Keep editing and AI regeneration available, but make review/diagnostics the first-class workflow.
- Simplify the home page into clear "Generate" vs "Review" paths.

## Non-Goals

- Do not build a full child-facing runtime simulator in this pass.
- Do not generate images in the studio.
- Do not add a runtime asset manifest or change the canonical 5-file bundle format.
- Do not replace the existing editor. Reuse it where it already works.
- Do not require persisted database storage. Keep file/session-based behavior unless a later plan changes persistence.

## Current State

The studio already has:

- 5-file activity bundle import from ZIPs or folders.
- `ActivityBundle` Zod schema.
- Editor panels for `spec`, `prod`, `tag_block`, recap preview, dashboard preview, and scorecard.
- Batch import support for multiple activity bundles.
- Export as activity bundle ZIP.
- Library view for persisted runs.

Gaps for review-console use:

- Landing page mixes generation and review workflows.
- Review diagnostics are mostly LLM rubric-oriented, not deterministic package QA.
- `## Adaptation Rationale` and `## Asset Brief` are not first-class review surfaces.
- Latest autodesign vocabulary has moved to mechanic-first D10 and asset dependency fields.
- The studio still has older wording around pillar fidelity and some stale pillar mapping assumptions.

## UX Direction

### Landing Page

Replace the current combined upload page with a task-first home page:

1. Primary action card: **Review Existing Activities**
   - Purpose: inspect generated packages, batch-review outputs, check asset dependencies, and edit when needed.
   - CTA: "Import activity bundles"
   - Accepts ZIPs, folders, or a parent folder containing multiple activity directories.

2. Secondary action card: **Generate From Entity Mapping**
   - Purpose: create new variants from YAML.
   - CTA: "Upload entity YAML"
   - Generation mode selection lives inside this flow, not on the home page.

3. Top navigation:
   - `Review`
   - `Generate`
   - `Library`

This can be implemented as either separate routes or task tabs. Prefer separate routes for clarity:

- `/` task selector
- `/review` bundle import and batch review entry
- `/generate` existing YAML upload + generation mode
- `/library` unchanged

### Review Console

After importing one or more bundles, reviewers should see a review-oriented surface before jumping into the full editor.

Recommended layout:

- Left: bundle list and filters
  - activity ID
  - mechanic
  - category
  - tier
  - pillar/style
  - asset policy
  - review status

- Center: activity flow review
  - package overview from `tag_block.yaml`
  - Step 1 through closing from `prod.md`
  - Step 3 rounds expanded
  - screen descriptions visible beside dialogue
  - branches collapsed/expandable per step

- Right: review diagnostics
  - mechanic fidelity
  - asset dependency completeness
  - V1 technical blockers
  - mapping grounding status
  - recap/dashboard alignment
  - scorecard summary

The existing editor remains available via "Open in Editor" from the review console.

## Data Model Additions

Do not change the canonical `ActivityBundle` files. Add derived review metadata inside the studio.

Create a new module:

```text
src/lib/review-metadata.ts
```

Suggested types:

```ts
export type AssetPolicy =
  | "no_assets"
  | "optional_support"
  | "required_prebuilt"
  | "runtime_generated"
  | "blocked";

export interface AssetRequirement {
  assetId: string;
  assetType: string;
  requiredness: "required" | "optional" | "fallback";
  generationTiming: "pre_generated" | "runtime_generated" | "display_existing" | "none";
  useStep: string;
  purpose?: string;
  promptEn?: string;
  source?: string;
  displayBehavior?: string;
  fallbackBehavior?: string;
  safetyConstraints?: string[];
}

export interface AdaptationReviewMetadata {
  inputMode?: "mapping_informed" | "parameterized" | "concept_only";
  canonicalMechanic?: string;
  readiness?: "ready_to_generate" | "generate_with_assumptions" | "blocked_until_product_decision";
  triggerCondition?: string;
  mappingUse?: string;
  productCapabilityFlags: string[];
  scaffoldFit?: "strong" | "acceptable" | "weak";
  assumptions: string[];
}

export interface ActivityReviewMetadata {
  adaptation?: AdaptationReviewMetadata;
  assetPolicy: AssetPolicy | "unknown";
  assets: AssetRequirement[];
  sourceSections: {
    adaptationRationale?: string;
    assetBrief?: string;
  };
}
```

Populate this by parsing `spec.md` sections during bundle import:

- `## Adaptation Rationale`
- `## Asset Brief`

If those sections are absent, use safe defaults:

- `assetPolicy: "unknown"` for imported packages that predate the asset layer.
- Empty asset list.
- Diagnostics should report "not provided" rather than failing the import.

## Deterministic Review Diagnostics

Create:

```text
src/lib/review-diagnostics.ts
```

Diagnostics should be deterministic and fast. They supplement, not replace, the LLM rubric.

### Mechanic Fidelity

Inputs:

- `reviewMetadata.adaptation.canonicalMechanic`
- `bundle.tagBlock.activity_signature.mechanic`
- `bundle.prod.steps`

Checks:

- If canonical mechanic exists, it must match `tagBlock.activity_signature.mechanic`.
- Step 3 repeated child action should align with the mechanic.
- If the check cannot confidently infer the repeated action, show `needs_review`, not `pass`.

First implementation can use conservative keyword heuristics per mechanic:

- `collect`: find, collect, photograph, bring back, look for
- `compare`: same, different, compare, which one
- `deduce`: clue, guess, solve, reveal
- `voice`: say as, speak as, perform as
- `build`: invent, make, create, combine
- `predict`: predict, guess before, reveal, result
- `narrate`: story, next happens, choose, sequence
- `care`: help, need, care, rescue
- `sort`: group, sort, category
- `enumerate`: name, notice, list, count parts

### Asset Dependency

Checks:

- If `assetPolicy !== "no_assets"`, `## Asset Brief` should exist.
- Every `assetId` referenced in `prod` screen descriptions should be defined in metadata.
- Required assets need `assetType`, `requiredness`, `generationTiming`, `useStep`, `displayBehavior`, and `fallbackBehavior`.
- Generated assets need `promptEn`.
- Existing/displayed assets need `source` or `promptEn`.
- `prod.md` should not include raw image prompts.
- `runtime_generated` should be `blocked` or `needs_product_decision` until runtime generation is explicitly supported.

### V1 Technical Blockers

Flag likely dependency on:

- OCR/text reading
- face/expression/pose detection
- IMU/camera angle detection
- before/after object-state comparison
- non-speech audio detection
- unsupported coloring/drawing UI
- unsupported material workflow

### Cross-File Alignment

Reuse existing schema invariants, then add review display for:

- dashboard focal attribute equals tag-block focal attribute
- recap action matches mechanic
- pillar/style pair is allowed
- `spec.identity.mechanic` equals tag-block mechanic
- scorecard exists only in `spec.md`

## Component Plan

### Landing Simplification

New or changed files:

- `src/app/page.tsx`
- `src/app/review/page.tsx`
- `src/app/generate/page.tsx`
- `src/components/home/TaskCard.tsx`
- Move current YAML upload content into a generate-specific component if needed.

Implementation notes:

- Keep visual density low on `/`.
- Hide generation-mode explanations until the user enters `/generate`.
- Make `Review Existing Activities` the first card because it is the fastest path for generated package QA.
- Avoid the current `OR` divider layout. It forces unrelated workflows into one scan path.

### Review Console

New files:

- `src/app/review/page.tsx`
- `src/components/review/ReviewConsole.tsx`
- `src/components/review/ReviewBundleList.tsx`
- `src/components/review/ReviewSummaryPanel.tsx`
- `src/components/review/FlowReviewPanel.tsx`
- `src/components/review/DiagnosticsPanel.tsx`
- `src/components/review/AssetBriefPanel.tsx`
- `src/components/review/AdaptationRationalePanel.tsx`

Reuse:

- `ExistingDesignImporter`
- `RubricDots`
- `ModePill`
- `PillarPill`
- `DialogueBlock`
- `TagBlockPanel` only inside the full editor, not the first review view
- `RecapPreview`
- `DashboardPreview`

## Import Flow Changes

Extend `ImportedBundleResult`:

```ts
interface ImportedBundleResult {
  bundle: ActivityBundle;
  rubricScores: RubricScores;
  rubricEvaluated: boolean;
  sourceFormat: "zip" | "files";
  reviewMetadata: ActivityReviewMetadata;
  diagnostics: ReviewDiagnostic[];
}
```

Run metadata parsing and diagnostics in `bundle-import.ts` after `parseBundleFromFileMap`.

For existing imported batches:

- Single bundle from `/review` opens review console detail, not editor.
- Multiple bundles show review list first.
- Each bundle row has:
  - "Review"
  - "Open in Editor"
  - "Export"

## Schema and Vocabulary Sync

Before or alongside the review console, sync the studio with the latest autodesign contract:

- D10 label becomes **Mechanic Fidelity + Scaffold Honesty**.
- `Nurture` should be a valid tag-block pillar, not mapped to `Connection`.
- Add authoring-only `asset_policy` values to studio review metadata, not tag-block schema.
- Add `activity_concept`, `match_pattern`, `capability_probe`, and `concept_only` vocabulary to review metadata docs/UI only.
- Use `prompt_en`, not `prompt_zh`.

This should be a targeted sync. Do not broaden into a generation prompt rewrite unless needed by tests.

## Implementation Phases

### Phase 1: Landing Split

- Create `/review` and `/generate`.
- Convert `/` into a simple task selector.
- Move current YAML upload and generation mode UI into `/generate`.
- Move existing activity importer into `/review`.
- Keep `/library` unchanged.

Verification:

```bash
npx eslint src/app/page.tsx src/app/review/page.tsx src/app/generate/page.tsx
npm run build
```

### Phase 2: Review Metadata + Diagnostics

- Add `review-metadata.ts`.
- Add `review-diagnostics.ts`.
- Extend `bundle-import.ts` result shape.
- Add unit tests for parsing `## Adaptation Rationale` and `## Asset Brief`.
- Add unit tests for asset diagnostics and mechanic mismatch diagnostics.

Verification:

```bash
npx tsx --test src/lib/__tests__/bundle-roundtrip.test.ts
npx tsx --test src/lib/__tests__/review-diagnostics.test.ts
npx eslint src/lib/review-metadata.ts src/lib/review-diagnostics.ts src/lib/bundle-import.ts
```

### Phase 3: Review Console UI

- Build `ReviewConsole`.
- Add bundle list, summary, flow review, diagnostics, and asset/adaptation panels.
- Wire "Open in Editor" to existing editor store.
- Keep diagnostics read-only in first pass.

Verification:

```bash
npx eslint src/components/review/*.tsx src/app/review/page.tsx
npm run build
```

### Phase 4: Batch Review Polish

- Add filters for mechanic, asset policy, category, tier, and status.
- Add per-bundle review state in session store.
- Add "needs product decision" and "ready to edit" statuses.
- Optionally persist reviewed imports into Library.

Verification:

```bash
npx eslint src/components/review/*.tsx src/store/design-store.ts
npm run build
```

## Acceptance Criteria

- Home page has only task selection and does not show YAML upload, generation mode cards, and bundle import at the same time.
- `/generate` preserves the existing entity YAML generation workflow.
- `/review` supports single and batch 5-file activity imports.
- Review console shows adaptation rationale when present.
- Review console shows asset brief rows with `prompt_en`, asset ID, timing, use step, display, and fallback.
- Required missing asset fields produce deterministic warnings.
- Runtime-generated image concepts are clearly marked as product-decision risks.
- Mechanic mismatch between adaptation metadata and tag block is flagged.
- Existing editor remains reachable and still edits the imported bundle.
- Existing import/export tests continue to pass.

## Risks

- Markdown section parsing can be brittle. Keep parser conservative and covered by fixtures from actual generated packages.
- Some old bundles will not have adaptation or asset sections. Treat missing metadata as "not provided" unless the bundle references assets.
- The current studio may still contain older autodesign vocabulary. Sync the narrow enum/rubric mismatches before relying on diagnostics.
- Review console could become another full editor if scope expands. Keep first pass read-heavy and diagnostic-focused.

## Open Questions

- Should imported review batches be persisted to Library automatically, or only when the reviewer saves them?
- Should `/review` default to the batch list after a single import, or open the single bundle directly?
- Should diagnostics be exportable as a QA report?
- Should product capability decisions live only in `spec.md` text, or should the studio maintain a sidecar review note for them?
