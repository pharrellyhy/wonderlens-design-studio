# Mode Comparison Helper on Upload Page

## Context
The upload page (`src/components/upload/YamlUploader.tsx`) has a two-button
toggle for `mapping-informed` vs `freeform` generation mode. The only guidance
surfaced today is a one-line tooltip via `MODE_TOOLTIPS`. Users don't have
enough context to pick confidently on their first run.

## Goal
Render a persistent side-by-side comparison beneath the toggle that explains
when to use each mode, so new users can self-serve the decision without
reading docs.

## Design

### Placement
Directly below the existing radiogroup, before the entity summary card.
Wrapped in a `<section>` with the same `mt-4` rhythm as surrounding blocks.

### Layout
Two columns (`grid grid-cols-1 sm:grid-cols-2 gap-3`), each rendered from a
small static data array so the copy lives next to the code that uses it.
Each column contains:
- Header row: mode label + "rule of thumb" subtitle
- Short bullet list: 3–4 "use when" bullets
- Active-mode emphasis: the currently-selected mode's column gets a slightly
  brighter border (`border-indigo-600`) to confirm the user's choice

### Copy
**Mapping-informed — for delivery**
- Entity has a curated mapping block with themes + dimensions you trust
- You need the design to connect to specific curriculum dimensions
- Reproducible, comparable outputs across a unit
- Rich conversation anchor dimensions worth bridging from

**Freeform — for ideation**
- YAML is sparse, new, or the mapping hasn't been curated yet
- You're exploring creative directions and want the LLM to surprise you
- First-draft or brainstorming pass, not production-ready
- Tier guidance is approximate

### Styling
Consistent with the existing `bg-gray-800 border border-gray-700 rounded-xl`
card pattern used by the entity summary. Use smaller padding (`p-4`) and
slightly muted text (`text-gray-400`) so the comparison doesn't compete with
the drop zone or the entity summary.

## Files to change
- `src/components/upload/YamlUploader.tsx` — add a `MODE_COMPARISON` constant
  and a `<ModeComparison />` inline section rendered between the toggle and
  the entity summary. Keep it inline (no new shared component) since it has
  a single call site.

## Do NOT
- Do NOT collapse it into a disclosure / tooltip — user explicitly asked for
  the comparison to be on the page
- Do NOT replace the existing tooltips; they stay for hover affordance
- Do NOT refactor the toggle markup

## Verification
- tsc + lint clean
- Drop zone + toggle + comparison + entity summary stack cleanly at both
  mobile (single column) and desktop (two column)
