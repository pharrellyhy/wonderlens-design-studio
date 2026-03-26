# CLAUDE.md

This file provides guidance to Claude Code when working with the WonderLens Design Studio codebase.

## Behavioral Rules

- **DO NOT** mention Claude as code generator or code co-author in commits, comments, or docs
- **Plan before you code** — before starting any implementation work, write a design plan or implementation plan in `docs/plans/` first. No code changes until a plan document exists and covers the approach
- **Do not auto-commit or push** — never automatically commit or push after finishing a feature or task; only commit/push when explicitly asked

## Project Overview

WonderLens Design Studio is a cloud-hosted SaaS web application where educators and content creators upload entity YAML files, receive AI-generated game design variants, and refine them through a structured visual editor with per-field AI assistance and D1-D9 quality scoring. The goal is higher quality game designs through human-AI collaboration, accessible to non-technical users.

**User flow:** Upload YAML → Variant Gallery (2-4 AI-generated designs) → Design Studio Editor (three-panel layout) → Export (spec.md / prod.md)

**Two activity categories:**
- **Category 1** (In-Device Verbal): game styles — voice_acting, storytelling_chain, prediction_game, helper_hotline
- **Category 5** (Out-of-Device Collection): game styles — comparison_chart, naming_story

**Tech stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Prisma (PostgreSQL), NextAuth.js, Zod, pluggable LLM (Anthropic + OpenAI SDKs)

## Quick Start

```bash
npm install
npm run dev       # Next.js dev server on port 3000
npm run build     # Production build
npm run lint      # ESLint
```

## Architecture

### AI Generation Pipeline (Multi-Pass)
1. **Pass 1 — Generate**: System prompt (`program.md` + `templates.md` + `entity_guidance.md`) + entity YAML → structured JSON design
2. **Pass 2 — Self-Evaluate**: Run 9D rubric → dimension scores (pass/fail) + issues
3. **Pass 3 — Fix**: Targeted LLM fixes for failing dimensions
4. **Pass 4 — Re-Evaluate**: Confirm fixes (max 3 iterations)

For variant generation, this pipeline runs 2-4 times with different category × game style parameters. Generation is async (background jobs, SSE/polling for progress).

### Pluggable LLM Layer
- Abstract `LLMProvider` interface in `src/lib/llm/provider.ts`
- Adapters: `src/lib/llm/openai.ts`, `src/lib/llm/anthropic.ts`
- User configures provider + API key in app settings

### Frontend Screens
1. **Upload** (`src/app/page.tsx`) — Drag & drop YAML, entity summary preview
2. **Variant Gallery** (`src/app/gallery/[entityId]/page.tsx`) — AI-generated design cards with rubric scores
3. **Design Studio** (`src/app/editor/[designId]/page.tsx`) — Three-panel editor (navigation, editor, scorecard)
4. **Export** — Preview and download as spec.md / prod.md

### Editor Three-Panel Layout
- **Left**: Navigation tree (Basic Info → Overview & KUD → Creative Variables → Steps 1-5)
- **Center**: Inline-editable fields organized by section, per-field "Ask AI" regeneration
- **Right**: D1-D9 scorecard, rubric re-run, AI comment box, export

## Key File Locations

| Purpose | Location |
|---------|----------|
| Landing / upload page | `src/app/page.tsx` |
| Variant gallery | `src/app/gallery/[entityId]/page.tsx` |
| Design studio editor | `src/app/editor/[designId]/page.tsx` |
| App layout | `src/app/layout.tsx` |
| AI generation endpoint | `src/app/api/generate/` |
| Rubric evaluation endpoint | `src/app/api/evaluate/` |
| Per-field regeneration | `src/app/api/regenerate/` |
| Markdown export | `src/app/api/export/` |
| YAML upload + parse | `src/app/api/upload/` |
| YAML uploader component | `src/components/upload/YamlUploader.tsx` |
| Variant card component | `src/components/gallery/VariantCard.tsx` |
| Editor navigation panel | `src/components/editor/NavigationPanel.tsx` |
| Inline editable field | `src/components/editor/EditableField.tsx` |
| Dialogue block component | `src/components/editor/DialogueBlock.tsx` |
| Scorecard panel | `src/components/editor/ScorecardPanel.tsx` |
| LLM provider interface | `src/lib/llm/provider.ts` |
| OpenAI adapter | `src/lib/llm/openai.ts` |
| Anthropic adapter | `src/lib/llm/anthropic.ts` |
| YAML parser | `src/lib/yaml-parser.ts` |
| Design types + Zod schemas | `src/lib/design-schema.ts` |
| Zustand editor state | `src/store/design-store.ts` |
| Domain knowledge files | `data/` (program.md, templates.md, entity_guidance.md, game_styles.md, transform.md, conversation_bridge.md) |
| Design spec | `docs/superpowers/specs/2026-03-26-design-studio-design.md` |
| Design/implementation plans | `docs/plans/` |

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/upload` | Parse uploaded YAML entity file, return entity summary |
| `POST /api/generate` | Start async generation job — returns jobId, runs multi-pass pipeline |
| `GET /api/generate/[jobId]/status` | Poll generation progress (or SSE) |
| `POST /api/evaluate` | Run 9D rubric against a design, return dimension scores |
| `POST /api/regenerate` | Per-field AI regeneration — send comment + field path, get updated content |
| `POST /api/export` | Convert design JSON to spec.md / prod.md markdown |

## Code Style

- **TypeScript** strict mode — all files use `.ts` / `.tsx`
- **Type annotations** required on all functions, props, and state
- **Components:** PascalCase (e.g., `EditableField`, `VariantCard`)
- **Functions/Variables:** camelCase (e.g., `parseYaml`, `designStore`)
- **Constants:** UPPERCASE_WITH_UNDERSCORES
- **Interfaces/Types:** PascalCase, prefixed with purpose (e.g., `GameDesign`, `DialogueBlock`)
- Use Zod for runtime validation of API inputs/outputs and design data
- Use Zustand for client-side state management
- Prefer Next.js App Router conventions (server components by default, `"use client"` only when needed)
- Use specific error types, not bare `catch` with no handling
- **All imports at the top of the file** — never import inside functions or conditional blocks

## Commit Messages

Use conventional commit format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

```
feat(editor): add inline field editing
fix(gallery): handle generation timeout
refactor(llm): extract provider interface
```

Keep first line under 50 characters. Use present tense.

## Session Handoff

After completing changes, update `HANDOFF.md` with a detailed entry covering:
- **Problem**: what issue or need prompted the change
- **Solution**: what was done and why
- **Edits**: files modified with key edit descriptions (line references, code context)
- **NOT Changed**: important things deliberately left untouched
- **Verification**: commands to validate the changes

Formatting rules:
- Each entry gets an `---` horizontal rule separator
- New entries go at the top (below the header)
- Keep only the **last 10 entries**; delete older entries from the bottom when adding new ones
- Maintain the `Last updated: YYYY-MM-DD` date in the header

## Auto-Compact Instructions

When the conversation context is automatically compacted, the summary **must** preserve the following in order of priority:

1. **Current task list** — every task's ID, status (pending/in-progress/completed), and any blocking dependencies
2. **Active plan** — which plan file in `docs/plans/` is being followed and which step is currently in progress
3. **Uncommitted work** — files that have been modified but not yet committed, and the intent behind each change
4. **Key decisions made** — any design choices, trade-offs, or user preferences established during the session
5. **Blockers and open questions** — anything unresolved that needs attention before proceeding

After compaction, immediately run `TaskList` to verify task state, and re-read the active plan in `docs/plans/` before resuming work. Do not re-do completed tasks or re-explore code that was already understood.

## MCP Guidelines

Always use context7 when you need code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library id and get library docs without being explicitly asked.

## Important Constraints

- Pluggable LLM — abstract `LLMProvider` interface; MVP ships with OpenAI and Anthropic adapters
- Generation is async: background jobs tracked via `GenerationJob`, progressive variant rendering
- Max 1 active generation job per user; queue additional requests
- Internal data format is JSON (via `GameDesign` TypeScript interface + Zod); markdown only on export
- Multi-pass pipeline: Generate → Evaluate → Fix → Re-Evaluate (max 3 iterations)
- D1-D9 rubric uses pass/fail scoring per dimension
- Domain knowledge lives in `data/` (program.md, templates.md, entity_guidance.md, game_styles.md, transform.md, conversation_bridge.md) — copied from the autodesign repo
- Never commit `.env` files, API keys, or secrets
- Database: PostgreSQL via Prisma ORM
- Auth: NextAuth.js (email + OAuth)
- Deployment target: Vercel
