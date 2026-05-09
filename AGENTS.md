# AGENTS.md

Project-specific instructions for agents working in `wonderlens-design-studio`.
These rules override global guidance when they are more specific.

## 1) Scope and Priority

- Scope: this file applies to the repository root and all subdirectories unless a deeper `AGENTS.md` exists.
- Priority: system/developer/user direct instructions first, then this file, then global defaults.
- Goal: make small, verifiable changes with minimal risk to the upload, generation, editing, rubric, and export flows.

## 2) Project Snapshot

- Project: WonderLens Design Studio, a human-in-the-loop web app for generating, reviewing, refining, and exporting activity designs.
- Source of truth: `docs/superpowers/specs/2026-03-26-design-studio-design.md` defines the intended product flow, architecture, and implementation phases.
- Primary user flow: upload entity YAML, review generated design variants, edit a selected design in the studio, re-run rubric checks, and export spec/prod markdown.
- Product shape: three major product surfaces matter most:
  - Upload and entity parsing
  - Variant generation and gallery review
  - Design Studio editing, rubric scoring, and export
- Architecture direction: Next.js App Router application with API routes for upload, generation, evaluation, regeneration, and export.
- AI/runtime direction: pluggable LLM provider layer behind a shared interface, with structured JSON as the internal design format and markdown generated only at export time.

Current repo state:
- `src/app/` contains the app routes for upload, gallery, editor, settings, and API endpoints.
- `src/components/` contains upload, gallery, and editor UI components.
- `src/lib/` contains schema, YAML parsing, prompt helpers, and LLM provider code.
- `src/store/` contains client editing state.
- `data/` contains prompt and domain-reference markdown files used to guide generation and export.
- Prisma, auth wiring, background jobs, and deployment concerns are described in the spec but may be partially scaffolded or not fully implemented in the current workspace.

Key files/locations:
- Build spec: `docs/superpowers/specs/2026-03-26-design-studio-design.md`
- App routes: `src/app/`
- API routes: `src/app/api/`
- Editor UI: `src/components/editor/`
- Upload UI: `src/components/upload/`
- Gallery UI: `src/components/gallery/`
- LLM layer: `src/lib/llm/`
- Design schema: `src/lib/design-schema.ts`
- YAML parsing: `src/lib/yaml-parser.ts`
- Prompt/reference data: `data/program.md`, `data/templates.md`, `data/entity_guidance.md`, `data/game_styles.md`, `data/conversation_bridge.md`, `data/transform.md`

## 3) Non-Negotiable Constraints

- Do not mention Claude or any model as a code generator/co-author in commits, comments, or docs.
- Do not edit secrets or local credentials (`.env`, API keys, OAuth secrets, cloud credentials) unless explicitly asked.
- Do not perform opportunistic refactors, dependency upgrades, or broad formatting sweeps.
- Treat `docs/superpowers/specs/2026-03-26-design-studio-design.md` as the primary project brief when code and docs diverge.
- Preserve the human-in-the-loop workflow from the spec:
  - Upload YAML
  - Generate 2-4 variants
  - Open one variant in the editor
  - Allow manual and AI-assisted refinement
  - Re-score quality
  - Export spec/prod markdown
- Preserve the internal data model shape: the editor works on structured design JSON, not raw markdown.
- Preserve the Design Studio editor structure from the spec:
  - Left navigation tree
  - Center inline editor
  - Right rubric and AI sidebar
- Preserve per-section AI assistance: comments and targeted regeneration should stay scoped to the field or section being edited unless the user explicitly asks for broader behavior.
- Preserve D1-D9 rubric scoring as a first-class quality signal. Re-scoring may be non-blocking, but it should remain visible and usable.
- Preserve export behavior driven by `data/transform.md`; exported markdown should be a transformation of structured design data, not a separate parallel source of truth.
- Preserve pluggable LLM-provider boundaries. Do not hardwire app behavior to a single vendor when touching provider code.
- Keep upload parsing and entity summaries aligned with the spec's expected entity attributes and tier/context handling.
- Never revert user changes you did not make.

## 4) TypeScript and React Style

- Target modern TypeScript for application code.
- Prefer explicit types for public functions, component props, and shared data structures.
- Use PascalCase for React components, types, and interfaces; camelCase for functions and variables; UPPERCASE_WITH_UNDERSCORES for constants.
- Prefer Zod-backed validation or typed helpers where runtime data shape matters.
- Avoid `any` unless there is a documented, narrow reason.
- Keep imports at the top of the file and group them consistently.
- Keep server and client concerns explicit. Do not move server-only logic into client components without a reason.
- Keep components focused; extract shared editor or gallery behavior only when reuse is real and local.

## 5) How to Work

1. Read the relevant code paths and the design-studio spec first; state assumptions if behavior is unclear.
2. Make the smallest change that solves the request.
3. Validate immediately with the narrowest useful check.
4. Stop on failing checks, summarize root cause, then fix incrementally.
5. Show concise diffs and list exactly what was verified.
6. Use a git worktree for code changes by default, and switch into that worktree before editing files or running implementation commands. The exception is doc-only or config-only edits, which may be made in the current checkout when appropriate.
7. When creating a git worktree, place it under `.worktrees/` at the project root using the convention `.worktrees/{feat,docs,fix,refactor,style,test,chore}/<worktree-name>`.
8. When working in plan mode or discussing design / implementation plans, write the plan to `docs/plans/` before making code changes. Use the project plan naming convention and make the plan detailed enough for a fresh session to execute.

## 6) Canonical Commands

Run from repo root unless noted. Verify the referenced script or path exists before relying on it.

```bash
# Inspect repo state
rg --files

# Start the app
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

Validation policy:
- Markdown/docs-only changes: verify with targeted file review and `git diff -- AGENTS.md` or the changed docs.
- Changed TypeScript/React files: run the narrowest relevant lint check first. If the change is localizable, prefer `npx eslint <path>` over whole-project lint.
- Changed app-route, API-route, or shared-schema files: run the smallest relevant lint check, then use `npm run build` when route integration, type flow, or server/client boundaries may be affected.
- Changed prompt/reference data: manually verify the touched content against the spec and the consuming code paths; run an additional app check only if code behavior changed too.
- If required tooling is not yet scaffolded for the touched area, document that clearly and perform manual verification against the spec and touched files.
- Stop on first failure; summarize root cause before broadening scope.

## 7) Change-Specific Guardrails

- Upload and YAML parsing changes:
  - Preserve the upload-first flow and entity confirmation step.
  - Keep parsed entity summaries aligned with the spec's expected fields such as entity name, dimensions, attributes, and IB themes.
- Variant generation changes:
  - Preserve 2-4 variant generation across supported category and game-style combinations.
  - Preserve progressive feedback for generation status and partial-failure handling where that behavior exists or is being implemented.
  - Keep multi-pass generation, evaluation, and fix workflows conceptually intact unless the user explicitly changes the architecture.
- Editor changes:
  - Preserve the three-panel editing layout and inline editing model.
  - Preserve the step structure, including the bridge split and round-based editing model described in the spec.
  - Keep field-level comments and targeted AI regeneration scoped and reviewable.
- Rubric and quality changes:
  - Keep D1-D9 scoring visible and understandable.
  - Do not silently collapse rubric detail into a single opaque score.
- Export changes:
  - Preserve both spec and prod export targets.
  - Keep export formatting aligned with `data/transform.md`, including condensed round handling and removal of editor-only metadata from exported output.
- LLM/provider changes:
  - Keep the `LLMProvider` abstraction stable.
  - Preserve support for provider-specific adapters behind the shared interface.
  - Do not hardcode user secrets or machine-specific provider configuration into source files.
- Data and prompt changes:
  - Prefer updating the reference files in `data/` instead of scattering domain constraints across the UI.
  - Keep prompt and template changes aligned with the structured design schema used by the app.

## 8) Documentation and Session State

Update docs when behavior, operator workflow, or implementation status changes:

- `README.md`: project overview, run instructions, and current architecture once the file exists or is created.
- `docs/superpowers/specs/2026-03-26-design-studio-design.md`: only update when the project brief itself changes.
- `HANDOFF.md`: add or update a session entry when work meaningfully changes project state or execution status.

`HANDOFF.md` entry format (when the file exists or is created):
- Include: Problem, Solution, Edits, NOT Changed, Verification.
- New entries go at the top, below the header, separated by `---`.
- Keep only the last 10 entries.
- Maintain the `Last updated: YYYY-MM-DD` header date.

Keep docs concise and factual; avoid aspirational text not reflected in code.

## 9) External Docs and Uncertainty

- Use Context7 for library and framework API uncertainty before coding.
- Prefer official docs and repo source over memory when APIs are version-sensitive.
- When Design Studio behavior is unclear, check the spec before inferring architecture from partial scaffold files.
- If API uncertainty remains, build a minimal reproducible check locally and report the result.

## 10) Completion Checklist

Before declaring completion:

1. Confirm only intended files changed.
2. Run the smallest relevant verification available for the touched files and capture outcomes.
3. Confirm the change still matches the Design Studio spec or explicitly note any deliberate divergence.
4. Summarize:
   - files changed
   - checks run (with pass/fail)
   - remaining risks or follow-ups
