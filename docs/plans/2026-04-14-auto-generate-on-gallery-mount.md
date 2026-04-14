# Auto-Generate on Gallery Mount

## Context

With provider + API key removed from the UI (prior plan), the only
pre-generation decision left is `generationMode`, which is already chosen
on the upload page via `YamlUploader`. Clicking "Generate Variants" on
the gallery after landing there adds one extra click with no decision
behind it.

## Goal

When the user lands on `/gallery/[entityId]` with a parsed entity and no
existing variants, kick off generation automatically. Keep the "Regenerate
All" button in the header for intentional re-runs (e.g., after the user
changes the Mode dropdown).

## Design

### Auto-trigger effect

Add a `useEffect` in `src/app/gallery/[entityId]/page.tsx` that runs after
`parsedEntity` is available and:

- `variants.length === 0`
- `generationJobId === null`

It calls `handleGenerate()` once.

StrictMode fires effects twice in dev. Guard with a `useRef<boolean>`
(`autoKickedRef`) that flips `true` on the first real run and short-circuits
subsequent passes. Not needed in prod, but prevents a duplicate job in dev.

Dependencies: `[parsedEntity, variants.length, generationJobId, handleGenerate]`.
The effect only fires when all prerequisites line up; existing variants
(from navigating back from the editor) or an in-flight job block the
auto-trigger.

### Button consolidation

The gallery currently has two buttons that both call `handleGenerate`:

1. Header "Regenerate All" (with refresh icon)
2. Settings bar "Generate Variants" (indigo primary button)

Since (a) we now auto-generate on mount and (b) the header button is the
obvious re-run affordance, remove the settings bar's "Generate Variants"
button entirely. The settings bar ends up with just the Mode dropdown.

Keep the header "Regenerate All" button as-is — it's the affordance users
need when they change Mode and want to re-run.

### Empty-settings-bar guard

If the Mode dropdown ends up alone in the settings bar, the visual is fine
(left-aligned with the `flex-1` spacer). No layout change needed.

## Files to change

- `src/app/gallery/[entityId]/page.tsx` — add the auto-trigger effect +
  the ref guard; remove the "Generate Variants" button from the settings
  bar

## Do NOT

- Do NOT remove the Mode dropdown — user still needs to change it for
  re-runs
- Do NOT remove "Regenerate All" from the header — explicit re-run is
  still useful
- Do NOT auto-trigger on every mount (back-from-editor must not
  re-generate)
- Do NOT auto-trigger when a job is already in flight

## Verification

- `npx tsc --noEmit` clean
- `npm run lint` clean
- Hot path: upload YAML → gallery auto-starts generation → 4 variants
  populate → open one → navigate back → gallery still shows the 4
  variants (NO second auto-run)
- Change Mode dropdown → click "Regenerate All" → new set of variants
  with the new mode
- In dev mode (StrictMode), confirm only ONE generation job is created
  on mount
