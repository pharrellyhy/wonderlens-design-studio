# WonderLens Design Studio — Spec & Implementation Plan

## Context

The WonderLens Activity Auto-Designer currently operates as a fully autonomous AI agent pipeline: an entity + category assignment goes in, and a complete game design (spec + prod markdown files) comes out. While this produces consistent results, there's no human-in-the-loop to catch nuance issues or inject domain expertise during the design process.

**Problem**: Non-technical users (educators, content creators) cannot participate in the design process — they can only review finished markdown files after the fact.

**Solution**: A cloud-hosted SaaS web application ("Design Studio") where users upload entity YAML files, receive AI-generated design variants, and refine them through a structured visual editor with per-field AI assistance and quality scoring.

**Outcome**: Higher quality game designs through human-AI collaboration, accessible to non-technical users.

---

## 1. User Flow

### Screen 1: Upload
- Drag & drop YAML entity mapping file (e.g., `lion.yaml`)
- System parses YAML and displays entity summary: name, tier dimensions, key attributes, IB themes
- User confirms entity looks correct before proceeding

### Screen 2: Variant Gallery
- AI generates 2-4 design variants across different category × game style combinations
  - Categories: Cat 1 (In-Device Verbal) and Cat 5 (Out-of-Device Collection)
  - Game styles: voice_acting, storytelling_chain, prediction_game, helper_hotline (Cat 1); comparison_chart, naming_story (Cat 5)
- Each variant displayed as a card showing:
  - Category + game style tags
  - Activity name
  - Brief description
  - Key creative variables (metaphor, role_title, escalation)
  - D1-D9 rubric scores (pass/fail per dimension)
- User clicks a card to open it in the Design Studio
- "Regenerate All" button to get fresh variants

### Screen 3: Design Studio (Core Editor)
Three-panel layout:

**Left Panel — Navigation**
- Tree view of design structure: Basic Info → Overview & KUD → Creative Variables → Steps 1-5
  - Step 1 shows sub-items: Step 1a (Warm Start) and Step 1b (Cold Start)
  - Step 3 shows sub-items: Round 1, Round 2, Round 3, etc.
- Click to scroll/jump to that section in the editor

**Center Panel — Editor**
All fields inline-editable. Organized by section:

- **Basic Info**: Activity name (text), category (dropdown), tier (dropdown), IB key concepts (tag chips with add/remove), related concepts (tag chips), ATL skills (tag chips), game style (dropdown)
- **Overview**: Brief description (textarea), KUD table (K/U/D lists), design highlight (textarea), typical scenario (textarea)
- **Creative Variables**: metaphor, role_title, game_mechanic, scenario_type, target_response_type, escalation_axis (all text inputs). Cat 5 adds: visual_feature, collection_criterion, synthesis_type, stuck_hint
- **Steps 1-5**: Each step has:
  - AI Says (textarea, color-coded blue)
  - Child Responses: Ideal / Unexpected / Silent (textareas, color-coded green/yellow/red)
  - AI Follow-ups: for Ideal / Unexpected / Silent (textareas, color-coded purple)
  - Screen Description (textarea, gray)
- **Step 3 Rounds**: Expandable sub-sections for each round (3-5 rounds), each with the same structure as above

Per-field interaction:
- Every field is directly editable (contenteditable / input)
- Every section has a "💬 comment" button to leave feedback
- Every section has a "✨ Ask AI" button that sends the comment + current design state to the LLM for targeted regeneration of just that section

**Right Panel — Quality & AI**
- D1-D9 Scorecard: Shows pass/fail for each rubric dimension (matching domain's two-level system), clickable to see evaluation details
- "Re-run Rubric" button to re-score after edits
- AI Comment Box: Global comment textarea + "Regenerate with feedback" button for broader regeneration requests
- Export button

### Screen 4: Export
- Preview final design in both spec and prod formats
- Download as spec.md, prod.md, or both
- Transform follows existing `transform.md` rules: 7-row Basic Info table, condense rounds to 1-line summaries (except Round 1), compress screen descriptions, strip scorecard

---

## 2. AI Engine

### Pluggable LLM Layer
- Abstract `LLMProvider` interface: `generate(systemPrompt, userMessage, options) → structuredOutput`
- **MVP**: Ship with 1 adapter (OpenAI or Claude — user's choice). Add Gemini/OpenRouter post-MVP.
- Interface designed for easy addition of new providers
- User configures provider + API key in app settings

### Generation Pipeline (Multi-Pass)
Matches current autonomous agent quality:

1. **Pass 1 — Generate**: Full `program.md` + `templates.md` + `entity_guidance.md` as system prompt. Entity YAML + category + game style as user input. LLM generates structured JSON design (NOT markdown — internal format is JSON; markdown only on export).
2. **Pass 2 — Self-Evaluate**: Run 9D rubric against generated design. Output: dimension scores (pass/fail) + identified issues.
3. **Pass 3 — Fix**: For any dimension scoring fail, send the design + issue description back to LLM for targeted fixes.
4. **Pass 4 — Re-Evaluate**: Confirm fixes resolved issues. If not, repeat (max 3 iterations).

For variant generation, run this pipeline 2-4 times with different category × style parameters.

### Async Generation Architecture
Generating 2-4 variants with the 4-pass pipeline means 8-16+ LLM calls, potentially taking 3-10 minutes. Architecture:

- **Server**: Generation runs as a background job (tracked via `GenerationJob` table). API route `/api/generate` creates a job and returns `jobId` immediately.
- **Progress**: Client polls `/api/generate/[jobId]/status` every 3 seconds, or uses Server-Sent Events (SSE) for real-time updates.
- **Progress UI**: Gallery shows a progress indicator: "Generating variant 2/4... (Evaluating rubric)". Each variant appears as a card as soon as its pipeline completes (progressive rendering).
- **Partial failures**: If one variant fails, the others still display. User can retry failed variants.
- **Concurrency**: Max 1 active generation job per user. Queue additional requests.

### Token Cost Considerations
The system prompt (`program.md` + `templates.md` + `entity_guidance.md`) is ~15,000-25,000 tokens. With a 4-pass pipeline × 4 variants:
- Worst case: ~400,000 input tokens per upload (~$1-4 depending on provider)
- Optimization: Cache the system prompt, share evaluation context across passes
- The per-field regeneration is much cheaper (~2,000-5,000 tokens per call)
- User should be aware of cost per generation — show estimated cost before generating

### Per-Field Regeneration
When user clicks "Ask AI" on a specific section:
- Send: current full design state (for context) + user's comment + the specific field path + relevant template constraints for that field
- Receive: updated content for just that field/section
- User sees a diff and can accept or reject

### Rubric Re-Scoring
- After any edit (manual or AI-generated), user can re-run the 9D rubric
- Shows which dimensions improved/degraded
- Non-blocking — user can export even with warnings

---

## 3. Data Model

### Core Schema (PostgreSQL via Prisma)

```
User {
  id, email, name, role, llmProvider, llmApiKey (encrypted),
  createdAt, updatedAt
}

Design {
  id, userId, entityName, category, tier, gameStyle,
  status (draft | reviewing | approved | exported),
  designData (JSON — full structured design),
  rubricScores (JSON — {d1..d9: pass|fail}),
  entityYaml (text — original uploaded YAML),
  createdAt, updatedAt
}

GenerationJob {
  id, userId, entityName,
  status (queued | generating | evaluating | fixing | complete | failed),
  currentPass (1-4), currentVariant (1-4), totalVariants,
  variants (JSON[] — completed design variants),
  error (text, nullable),
  createdAt, updatedAt
}

DesignVersion {
  id, designId, versionNumber, designData (JSON snapshot),
  changedBy, changeDescription,
  createdAt
}

Comment {
  id, designId, fieldPath (e.g., "steps.2.rounds.0.aiSays"),
  text, resolved, aiResponse,
  userId, createdAt
}
```

### Design JSON Structure
```typescript
interface GameDesign {
  basicInfo: {
    activityName: string;
    category: 'cat1' | 'cat5';
    tier: 'T0' | 'T1' | 'T2';
    triggerEntity: string;       // Entity name
    triggerScene: string;        // Where child encounters entity
    coreKeyConcepts: string[];
    relatedConcepts: string[];
    atlSkills: string[];
    gameStyle: string;
    ibTheme: string;             // Primary IB theme
  };
  creativeVariables: {
    metaphor: string;
    roleTitle: string;
    gameMechanic: string;
    scenarioType: string;
    targetResponseType: string;
    escalationAxis: string;
    // Cat 5 only
    visualFeature?: string;
    collectionCriterion?: string;
    synthesisType?: 'narrative' | 'classification';
    stuckHint?: string;
    reflectiveQuestion?: string;
  };
  overview: {
    briefDescription: string;
    kud: { know: string[]; understand: string[]; do: string[] };
    designHighlight: string;
    typicalScenario: string;
  };
  steps: Step[];
  entityMapping: {
    mappingSource: string;       // YAML file path/name
    anchorDimensions: string[];  // e.g., ["emotions", "appearance"]
    conversationAnchorDimensions: string[]; // For bridge grounding
    themes: string[];
    keyConcepts: string[];
  };
}

// Step 1 (bridge) has warm + cold variants; other steps are singular
interface Step {
  stepNumber: number;
  title: string;
  type: 'bridge' | 'rules' | 'rounds' | 'celebration' | 'closing';
  // For type === 'bridge': both warmStart and coldStart are populated
  warmStart?: DialogueBlock;     // Step 1a: post-conversation bridge
  coldStart?: DialogueBlock;     // Step 1b: standalone bridge
  // For all other types: single dialogue block
  dialogue?: DialogueBlock;
  rounds?: Round[];              // Only for type === 'rounds'
}

interface DialogueBlock {
  aiSays: string;
  childResponses: { ideal: string; unexpected: string; silent: string };
  aiFollowUps: { ideal: string; unexpected: string; silent: string };
  screenDescription: string;
}

interface Round {
  roundNumber: number;
  dialogue: DialogueBlock;
}
```

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| UI | React, Tailwind CSS, shadcn/ui |
| Client State | Zustand (fast inline editing) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (email + OAuth) |
| AI | Pluggable: Anthropic, OpenAI, Google AI, OpenRouter SDKs |
| Storage | Vercel Blob / S3 (YAML uploads) |
| Deployment | Vercel |
| Repository | New standalone repo |

---

## 5. Key Files to Create (New Repo)

```
wonderlens-design-studio/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing / upload page
│   │   ├── gallery/[entityId]/page.tsx # Variant gallery
│   │   ├── editor/[designId]/page.tsx  # Design studio editor
│   │   ├── api/
│   │   │   ├── generate/route.ts       # AI generation endpoint
│   │   │   ├── evaluate/route.ts       # Rubric evaluation endpoint
│   │   │   ├── regenerate/route.ts     # Per-field regeneration
│   │   │   ├── export/route.ts         # Markdown export
│   │   │   ├── upload/route.ts         # YAML upload + parse
│   │   │   └── auth/[...nextauth]/route.ts
│   │   └── settings/page.tsx           # User settings (LLM config)
│   ├── components/
│   │   ├── upload/                     # YAML upload + entity preview
│   │   ├── gallery/                    # Variant cards
│   │   ├── editor/                     # Design studio panels
│   │   │   ├── NavigationPanel.tsx
│   │   │   ├── EditorPanel.tsx
│   │   │   ├── ScorecardPanel.tsx
│   │   │   ├── EditableField.tsx       # Reusable inline-edit component
│   │   │   ├── DialogueBlock.tsx       # AI says / child responses / follow-ups
│   │   │   └── RoundEditor.tsx
│   │   └── common/                     # Shared UI components
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── provider.ts             # Abstract LLM interface
│   │   │   ├── openai.ts              # OpenAI adapter (MVP)
│   │   │   └── anthropic.ts            # Claude adapter (MVP)
│   │   │   # Post-MVP: gemini.ts, openrouter.ts
│   │   ├── prompts/
│   │   │   ├── generate.ts            # Full generation prompt (from program.md)
│   │   │   ├── evaluate.ts            # Rubric evaluation prompt
│   │   │   ├── regenerate.ts          # Per-field regeneration prompt
│   │   │   └── templates.ts           # Template definitions (from templates.md)
│   │   ├── yaml-parser.ts             # Entity YAML parsing
│   │   ├── markdown-export.ts         # Design → spec.md / prod.md (transform.md rules)
│   │   └── design-schema.ts           # TypeScript types + Zod validation
│   ├── store/
│   │   └── design-store.ts            # Zustand store for editor state
│   └── prisma/
│       └── schema.prisma              # Database schema
├── data/
│   ├── program.md                     # Copied from autodesign repo
│   ├── templates.md                   # Copied from autodesign repo
│   ├── entity_guidance.md             # Copied from autodesign repo
│   ├── game_styles.md                 # Copied from autodesign repo
│   └── transform.md                   # Copied from autodesign repo
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## 6. Reference Files (from this repo)

These files from `wonderlens-activity-autodesign` contain the domain knowledge that powers the Design Studio:

| File | Purpose | How it's used |
|------|---------|---------------|
| `program.md` | Full agent instructions, constraints, 9D rubric | System prompt for generation + evaluation |
| `templates.md` | Cat 1 and Cat 5 structural skeletons | Defines the design JSON schema + generation constraints |
| `entity_guidance.md` | How to read entity YAML, dimension anchoring rules | Guides entity parsing and anchor dimension selection |
| `docs/game_styles.md` | 6 game style patterns with constraints | Populates game style dropdown, constrains creative variables |
| `transform.md` | Spec → prod transformation rules | Powers the markdown export (prod format) |
| `conversation_bridge.md` | Warm/cold start bridge patterns | Generates Step 1 content |
| `data/mappings_dev20_0318/*.yaml` | Example entity YAML files | Reference format for YAML parser |
| `designs/cat1/*.md`, `designs/cat5/*.md` | Existing designs | Reference for expected output quality |

---

## 7. Implementation Phases

### Phase 0: Project Setup
1. Save spec document to `docs/superpowers/specs/2026-03-26-design-studio-design.md` in the autodesign repo
2. Create new Next.js project locally at `~/codebase/github/wonderlens-design-studio/` using `create-next-app`
3. Copy reference data files from autodesign repo (`program.md`, `templates.md`, `entity_guidance.md`, `game_styles.md`, `transform.md`, `conversation_bridge.md`) into `data/` folder
4. Initialize git, push to GitHub when foundation is working

### Phase 1: Foundation (Week 1-2)
- Configure Tailwind, shadcn/ui, Prisma, NextAuth in the new project
- Implement YAML parser and entity summary display
- Create database schema and migrations
- Build the Upload screen

### Phase 2: AI Engine (Week 2-3)
- Implement pluggable LLM provider interface + first adapter (OpenAI or Claude)
- Port program.md / templates.md into structured generation prompts
- Build multi-pass generation pipeline (generate → evaluate → fix)
- Create API routes for generation and evaluation

### Phase 3: Variant Gallery (Week 3-4)
- Build variant card components
- Integrate with generation pipeline to produce 2-4 variants
- Display rubric scores on cards
- Handle loading states (generation takes time)

### Phase 4: Design Studio Editor (Week 4-6)
- Build three-panel layout (navigation, editor, scorecard)
- Implement EditableField component with inline editing
- Build DialogueBlock component for AI says / child responses / follow-ups
- Implement per-field "Ask AI" regeneration flow
- Build scorecard sidebar with rubric display
- Add comment system

### Phase 5: Export & Polish (Week 6-7)
- Implement markdown export (spec + prod formats) using transform.md rules
- Add version history
- Polish UI, error handling, loading states
- Generation progress UI (SSE/polling, progressive variant rendering)

### Phase 6: Deployment (Week 7-8)
- Set up Vercel deployment
- Configure PostgreSQL (Vercel Postgres or Neon)
- Set up environment variables and secrets
- Auth configuration
- Testing and QA

---

## 8. Verification

### Manual Testing
1. Upload a known entity YAML (e.g., lion from `data/mappings_dev20_0318/`)
2. Verify entity summary displays correctly
3. Generate variants → verify 2-4 cards appear with valid designs
4. Open a variant in the editor → verify all fields are populated and editable
5. Edit a field manually → re-run rubric → verify scores update
6. Use "Ask AI" on a field with a comment → verify targeted regeneration works
7. Export to markdown → compare with existing designs in `designs/cat1/` or `designs/cat5/` for format compliance

### Automated Tests
- Unit tests: YAML parser, markdown exporter, design schema validation
- Integration tests: LLM adapter mock tests, generation pipeline
- E2E tests: Full upload → generate → edit → export flow (Playwright)

### Quality Gate
- Compare exported markdown against existing hand-crafted designs for structural compliance
- Verify D1-D9 rubric scoring matches the autonomous agent's scoring on the same designs
