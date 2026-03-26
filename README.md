# WonderLens Design Studio

A cloud-hosted SaaS web application where educators and content creators upload entity YAML files, receive AI-generated game design variants, and refine them through a structured visual editor with per-field AI assistance and D1-D9 quality scoring.

## User Flow

1. **Upload** -- Drag & drop a YAML entity mapping file; review the parsed entity summary
2. **Variant Gallery** -- AI generates 2-4 design variants across category x game style combinations, each with rubric scores
3. **Design Studio** -- Three-panel editor (navigation tree, inline-editable fields with "Ask AI", D1-D9 scorecard)
4. **Export** -- Download as spec.md, prod.md, or both

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Client State | Zustand |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (email + OAuth) |
| AI | Pluggable: Anthropic SDK, OpenAI SDK |
| Validation | Zod |
| Deployment | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env   # Fill in LLM API keys and database URL
npm run dev             # http://localhost:3000
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
    page.tsx                        # Upload screen
    gallery/[entityId]/page.tsx     # Variant gallery
    editor/[designId]/page.tsx      # Design studio editor
    api/
      generate/                     # AI generation endpoint
      evaluate/                     # Rubric evaluation
      regenerate/                   # Per-field AI regeneration
      export/                       # Markdown export
      upload/                       # YAML upload + parse
  components/
    upload/                         # YAML uploader + entity preview
    gallery/                        # Variant cards
    editor/                         # Editor panels, editable fields, dialogue blocks
  lib/
    llm/                            # Pluggable LLM provider + adapters
    design-schema.ts                # TypeScript types + Zod validation
    yaml-parser.ts                  # Entity YAML parsing
  store/
    design-store.ts                 # Zustand editor state
data/
  program.md                        # Agent instructions + 9D rubric
  templates.md                      # Cat 1 / Cat 5 structural templates
  entity_guidance.md                # Entity YAML parsing rules
  game_styles.md                    # Game style patterns + constraints
  transform.md                     # Spec -> prod export rules
  conversation_bridge.md            # Warm/cold start bridge patterns
```

## AI Generation Pipeline

The multi-pass pipeline matches the quality of the autonomous auto-designer:

1. **Generate** -- Full system prompt + entity YAML -> structured JSON design
2. **Self-Evaluate** -- 9D rubric scoring (pass/fail per dimension)
3. **Fix** -- Targeted LLM fixes for failing dimensions
4. **Re-Evaluate** -- Confirm fixes (max 3 iterations)

Generation runs as async background jobs with progressive variant rendering.

## License

Private -- all rights reserved.
