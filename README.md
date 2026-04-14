# WonderLens Design Studio

A web application where educators upload entity YAML files, receive AI-generated game design variants across six experience pillars, and refine them through a structured visual editor with per-field AI assistance and a 10-dimension quality rubric.

## User Flow

1. **Upload** -- Drag & drop a YAML entity mapping file; pick a generation mode (mapping-informed for delivery, freeform for ideation); preview the parsed entity summary
2. **Variant Gallery** -- Auto-generates 4 pillar-diverse design variants on arrival, each with rubric scores, mode + pillar pills, and a button to generate the opposite-category counterpart
3. **Design Studio** -- Three-panel editor (navigation tree, inline-editable fields with "Ask AI", D1-D10 scorecard with re-run + AI-comment regeneration)
4. **Library** -- Browse persisted runs as a sortable table or grid, with CSV export and parent/opposite grouping
5. **Export** -- Download as spec.md, prod.md, or both

## Domain Model

- **6 experience pillars**: Mystery, Creation, Performance, Discovery, Adventure, Nurture. Each pillar has one Cat 1 (in-device verbal) and one Cat 5 (out-of-device collection) game style, for **12 styles total**.
- **10D rubric**: D1 Technical Compliance, D2 Hook & Transition, D3 Edge Case Coverage, D4 IB Completeness, D5 Tier Appropriateness, D6 Dialogue Specificity, D7 Screen & UI Completeness, D8 Entity Mapping Alignment, D9 Game Feel, D10 Pillar Fidelity.
- **Bracket tone markers**: AI dialogue uses `[warm]`, `[excited]`, `[gentle pause]` -- never parentheses.
- A Zod `superRefine` enforces that `gameStyle` matches the design's `experiencePillar` for the assigned category.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui, lucide-react |
| Client State | Zustand |
| Validation | Zod |
| AI | Pluggable provider interface (OpenAI, Anthropic, OpenAI-compatible) |
| Persistence | File-based JSON store under `data/runs/` (dev). Prisma + PostgreSQL declared in `package.json` for future use; not yet wired. |
| Auth | NextAuth.js declared; not yet wired. |
| Deployment | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env   # See "Environment" below
npm run dev            # http://localhost:3000
```

### Environment

LLM provider and key are server-side only -- the UI never sends or stores either.

```bash
# Pick the backend (default: openai-compatible)
LLM_PROVIDER=openai-compatible

# Per-provider keys -- only the one matching LLM_PROVIDER is required
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_COMPATIBLE_API_KEY=...

# Required when LLM_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=...
OPENAI_COMPATIBLE_MODEL=...
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Project Structure

```
src/
  app/
    page.tsx                          # Upload screen + generation mode toggle
    gallery/[entityId]/page.tsx       # Variant gallery (auto-generates on mount)
    editor/[designId]/page.tsx        # Design studio editor
    library/page.tsx                  # Persisted runs browser (table + grid)
    api/
      generate/                       # Multi-pass generation + opposite + status
      evaluate/                       # 10D rubric scoring
      regenerate/                     # Per-field AI regeneration
      export/                         # Markdown export
      library/                        # Persisted run CRUD
      runs/                           # Run grouping helpers
      upload/                         # YAML upload + parse
  components/
    upload/                           # YAML uploader + mode comparison cards
    gallery/                          # Variant cards
    editor/                           # Editor panels, dialogue blocks, scorecard
    library/                          # Runs table, runs grid, CSV export
    common/                           # Shared pills (Mode, Category, Pillar, RubricDots)
  lib/
    llm/                              # Pluggable provider + adapters; getServerLLMProvider
    prompts/                          # Generate, evaluate, fix, regenerate prompt builders
    design-schema.ts                  # Zod schemas, RUBRIC_DIMENSIONS, PILLAR_STYLES
    pipeline.ts                       # Multi-pass generation + selectVariantConfigs
    runs-repository.ts                # File-based run persistence
    rubric-checks.ts                  # Deterministic D4 (concept reinforcement) check
    yaml-parser.ts                    # Entity YAML parsing
  store/
    design-store.ts                   # Zustand session state (no LLM config)
data/
  game_design_playbook.md             # See docs/ -- single source of truth (referenced)
  templates.md                        # Cat 1 / Cat 5 structural templates
  entity_guidance.md                  # Entity YAML parsing rules
  conversation_bridge.md              # Warm/cold start bridge patterns
  transform.md                        # Spec -> prod export rules
  runs/                               # Persisted RunRecord JSON files
docs/
  game_design_playbook.md             # Authoritative 10D rubric + 12 styles + 6 pillars
  plans/                              # Implementation plans (one per major change)
```

## AI Generation Pipeline

The multi-pass pipeline runs once per variant:

1. **Generate** -- Playbook + entity YAML + assigned (pillar, category, gameStyle) -> structured JSON
2. **Evaluate** -- 10D rubric scoring (pass/fail per dimension); deterministic D4 pre-check overrides the LLM if `closing.conceptReinforcement` does not name a Key Concept
3. **Fix** -- Targeted LLM repair for failing dimensions
4. **Re-Evaluate** -- Confirm fixes (max 3 iterations)

`selectVariantConfigs` shuffles all six pillars and assigns a balanced cat1/cat5 split, so a 4-variant run produces four genuinely different emotional experiences (not four similar in-device verbal games).

Generation runs as async background jobs with progressive variant rendering and a small concurrency pool (3) to stay within typical LLM rate limits.

## License

Private -- all rights reserved.
