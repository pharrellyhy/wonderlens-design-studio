# Intern Pipeline Walkthrough — End-to-End Tour from Entity List to Running Game

## Context

The WonderLens system spans three repos/folders that together form one pipeline: `scripts/` (upstream data generation), `wonderlens-design-studio` (this repo; LLM design authoring), and `wonderlens-activity-fullstack-demo` (the runtime app that actually plays the games). The runtime has been copied into `refs/` for local inspection.

New interns need a single, coherent tour of the whole pipeline so they can see how entity lists become IB theme mappings become LLM-generated designs become runtime-playable recipes. The pipeline currently works end-to-end but has two seams where data is hand-carried between steps — those seams are part of what we want interns to see, because they're candidates for future automation.

**Outcome we want:** a written walkthrough doc (this file) plus an interactive HTML visualization (`2026-04-14-intern-pipeline-walkthrough.html`) that an intern can open in a browser as a field guide. The HTML is the primary teaching artifact; this doc is the source narrative and implementation plan for it.

## Scope caveats

- This is a **teaching artifact**, not a code change to the app. The HTML lives under `docs/plans/` and is not wired into the Next.js app.
- The walkthrough describes the pipeline as it exists today (2026-04-14), including the two unresolved seams. Fixing those seams is out of scope here — see `2026-04-14-playbook-alignment.md` and `2026-04-14-autodesign-parity-changes.md` for in-flight work on the studio side.
- All field names and file paths cited below are verified against the actual files in `refs/` and `src/`. If anything drifts, update this doc rather than the HTML first — the HTML is generated from this narrative.
- The HTML is a **single self-contained file** — no build step, no npm deps, loaded directly in a browser. Google Fonts is the only external dependency.
- No automated tests. Verification is opening the HTML in a browser and clicking through every station.

---

## Section 1 — The pipeline (what interns need to internalize)

Eight stations, grouped into three bands. Upstream scripts produce structured data. Design-studio turns that into LLM-authored dialogue designs. The runtime consumes structured recipes and plays them back as an interactive game.

### Band 1 — Upstream data generation (`scripts/`)

| # | Script | Input | Output |
|---|---|---|---|
| 1 | `scripts/entity_list_generator.py` | seed prompts | `entities.csv` — name, domain, keywords |
| 2 | `scripts/ib_theme_batch_generator.py` | entity CSV | `entity_ib_map.yaml` — entity → IB theme + key concepts |
| 3 | `scripts/exploration_tier_generator.py` | entity CSV | `tier_guidance.yaml` — T0/T1/T2 scaffolding per entity |

Two additional scripts (`llm_age_tier_adherence_eval.py`, `llm_conversation_benchmark.py`) are evaluation tools that run against generated designs, not upstream generators.

### Band 2 — Design-studio (this repo)

| # | Component | Input | Output |
|---|---|---|---|
| 4 | `src/lib/prompts/generate.ts` + `src/lib/pipeline.ts` + `src/lib/design-schema.ts` | entity YAML + hand-written `data/*.md` | `GameDesign` JSON in `data/runs/*.json` |
| 4b | `src/lib/markdown-export.ts` | `GameDesign` JSON | `spec.md` / `prod.md` (prose dialogue + rubric) |

### Band 3 — Runtime (`refs/`)

| # | Component | Input | Output |
|---|---|---|---|
| 5 | `refs/scripts/convert_game.py` | design-studio `spec.md` + Gemini LLM | `refs/backend/games/*.md` — YAML frontmatter + narrative body |
| 6 | `refs/backend/recipe_loader.py` + `refs/backend/schemas/recipe.py` | game MD | `ActivityRecipe` (Pydantic) with `voice_script`, `screen_frames`, `metadata` |
| 7 | `refs/backend/server.py` | `ActivityRecipe` | FastAPI JSON at `/game/{activity_type}` |
| 8 | `refs/frontend/` | `ActivityRecipe` JSON | Rendered game: audio, animation, widgets, photo capture |

### The two seams

- **Seam A — scripts → studio (between station 3 and 4).** `generate.ts` reads hand-written `data/entity_guidance.md`, not the generated `entity_ib_map.yaml` or `tier_guidance.yaml`. IB theme and tier scaffolding are re-inferred by the LLM every time.
- **Seam B — studio → runtime (between station 4b and 5).** Design-studio exports prose dialogue in markdown. The runtime needs structured YAML frontmatter with `activity_type`, `screen_frames`, `sfx_cue`, `animation`, `collection_catalog`, tone markers, etc. `convert_game.py` papers over this with a Gemini extraction call.

Interns should leave understanding that the middle is where future work will consolidate — either by extending the `GameDesign` schema to include runtime fields directly, or by building a deterministic converter that reads the spec markdown and emits recipe YAML without another LLM call.

---

## Section 2 — Runtime schema (what the studio does not yet produce)

Verified against `refs/backend/schemas/recipe.py` and `refs/backend/schemas/visual_composition.py`:

| Runtime field (refs) | Studio equivalent | Gap |
|---|---|---|
| `activity_type` | — | Missing. No frontmatter on export. |
| `metadata.ib_theme` / `ib_key_concept` / `concepts_earned` / `round_count` | `basicInfo.ibTheme` (string) | Partial — ibTheme is one string, not decomposed. Earned concepts missing. |
| `voice_script.hook_tone` / `closing_tone` / per-round `tone_marker` | `Step` / `DialogueBlock` dialogue text | Missing. No tone field in the schema. |
| `screen_frames[].widget` / `widget_params` / `animation` / `trigger` / `sfx_cue` / `sfx_label` | `Step.screenDescription: string` (prose) | Missing. Prose, not structured widget spec. |
| `celebration_frame` | — | Missing. |
| `collection_catalog` (correct + distractors) | `creativeVariables.collectionCriterion` | Missing catalog. Only the criterion name is captured. |
| `photo_features` | — | Missing. |

These deltas are the anatomy of Seam B.

---

## Section 3 — Intern walkthrough (six stations, ~half day)

Each station is a hands-on exercise. Interns should do them in order — each builds on the previous one's output.

### Station 1 — Entities → IB themes → Tier guidance
- **Open:** `scripts/entity_list_generator.py`, `scripts/ib_theme_batch_generator.py`, `scripts/exploration_tier_generator.py`
- **Run:** the three scripts in sequence against the seed prompts
- **Inspect:** pick three entities from `entities.csv`, then find them in `entity_ib_map.yaml` and `tier_guidance.yaml`. Does the assigned IB theme make sense? Is the tier guidance age-appropriate?
- **Key insight:** these outputs are structured, deterministic, and reusable.

### Station 2 — Generate a design in the studio
- **Open:** `src/lib/design-schema.ts` (scan top-level `GameDesign` fields), `src/lib/prompts/generate.ts` (see what context is loaded)
- **Run:** `npm run dev`, upload an entity YAML in the UI, click Generate, wait for a variant
- **Inspect:** open the resulting JSON under `data/runs/`. Then click "Export Spec" and open the markdown.
- **Key insight:** the studio generates dialogue, creative variables, and rubric scores — **no SFX, no widgets, no tone markers, no frontmatter**.

### Station 3 — Read the runtime schema
- **Open side by side:** `refs/backend/schemas/recipe.py`, `refs/backend/schemas/visual_composition.py`, `src/lib/design-schema.ts`
- **Exercise:** list every field the runtime has and the studio lacks. Compare to the gap table in Section 2 above.
- **Key insight:** the runtime has strong structural requirements (widgets, tones, SFX cues) that the studio currently glosses over as prose.

### Station 4 — Inspect a finished game
- **Open:** `refs/backend/games/polka_dot_patrol.md` (reference recipe)
- **Exercise:** compare the frontmatter directly to the `spec.md` from Station 2. What fields in the frontmatter have no equivalent in the spec?
- **Key insight:** this is the target format for the studio's export if we ever close Seam B.

### Station 5 — Run the manual bridge
- **Open:** `refs/scripts/convert_game.py`
- **Exercise:** trace how it calls Gemini to extract `widget`, `animation`, and `sfx_cue` from the prose in `spec.md`. Note which extractions are unreliable.
- **Key insight:** Seam B is a real LLM call today, not a deterministic transform. It's the single biggest candidate for automation.

### Station 6 — Play it
- **Open:** `refs/backend/server.py`, `refs/frontend/`
- **Run:** start the backend, start the frontend, load `polka_dot_patrol`
- **Exercise:** pick one SFX cue. Trace it from the running game → `ActivityRecipe` JSON on the wire → `sfx_cue` ID in the game MD frontmatter → actual audio file in the assets directory. Then do the same for an animation.
- **Key insight:** every asset on screen has a single chain of custody back to a string ID in the recipe. If the studio emitted those IDs, Seam B disappears.

---

## Section 4 — Interactive HTML visualization

**File:** `docs/plans/2026-04-14-intern-pipeline-walkthrough.html`

Single self-contained HTML file, no build step. Intern opens it in a browser and gets a visual field guide.

### What the HTML contains

1. **Hero** — title, subtitle, a one-paragraph framing of the pipeline.
2. **The map** — an SVG diagram of the 8 stations in three bands (upstream / studio / runtime) with labelled arrows between them. The two seams (A between bands 1→2, B between bands 2→3) are rendered as dashed red lines with an animated stroke-dash to draw the eye.
3. **Interactive stations** — clicking any station in the diagram opens a detail panel showing: files involved, what it produces, what to look for. Panels are toggled in-place; no modal/overlay.
4. **Seams callout** — an expanded "why this is a seam" explanation for A and B, with the specific field-level gaps for Seam B (from Section 2 above).
5. **Walkthrough stations** — the six exercises from Section 3 as numbered cards, each with file paths and inspection prompts.
6. **Gap table** — the runtime-vs-studio field comparison from Section 2, rendered as an HTML table.
7. **Footer** — pointer to this plan doc and to `docs/game_design_playbook.md`.

### Aesthetic direction

Technical field-notebook / architectural-schematic feel. Warm cream background, deep ink-navy for primary text, terracotta accent for seams and gaps, sage accent for the connected steps. Distinctive display serif (Fraunces) paired with body serif (IBM Plex Serif) and mono (IBM Plex Mono) for file paths. No purple gradients, no generic Inter/Roboto. The layout should feel like a page torn from a well-made technical handbook, not a generic SaaS landing page.

### Implementation notes

- Pure HTML + CSS + a small amount of vanilla JS for the station-detail toggling. No framework.
- Diagram is hand-authored SVG with `<g>` groups per station, `<path>` elements for arrows, and `<text>` for labels. Seam paths have `stroke-dasharray` + a CSS animation.
- JS: one `click` listener per station that toggles an `aria-expanded` attribute and shows/hides a sibling detail panel. Keyboard-accessible (Enter/Space).
- No external JS libs. Google Fonts loaded via `<link>` in `<head>`.
- Colors live in CSS custom properties at `:root` for consistency.

### Verification

- Open the file in a browser (Chrome/Safari/Firefox).
- Visual check: every station is visible, arrows connect cleanly, seam lines are dashed and animated.
- Click each of the 8 station nodes in the diagram — detail panel should toggle open/closed.
- Click the six walkthrough cards — copy the file paths, make sure each path resolves to a real file.
- Tab through with keyboard — focus ring visible on stations, Enter opens detail.
- Resize window from 1440 → 768 → 375 — layout should reflow gracefully (stations stack vertically on narrow screens).

---

## Deliverables

1. **`docs/plans/2026-04-14-intern-pipeline-walkthrough.md`** (this file) — narrative + plan
2. **`docs/plans/2026-04-14-intern-pipeline-walkthrough.html`** — interactive visualization

## Out of scope

- Wiring script outputs into `generate.ts` (that's Seam A remediation — future plan)
- Extending `GameDesign` schema with runtime fields (that's Seam B remediation — future plan)
- Automating the `convert_game.py` step
- Editing any files in `refs/` (those are reference copies only)
- Adding the walkthrough to the in-app docs navigation (the HTML is a standalone artifact for now)
