import { z } from "zod";

// ── Dialogue Block ──────────────────────────────────────────────────────────

export const childResponsesSchema = z.object({
  ideal: z.string(),
  unexpected: z.string(),
  silent: z.string(),
});

export const dialogueBlockSchema = z.object({
  aiSays: z.string(),
  childResponses: childResponsesSchema,
  aiFollowUps: childResponsesSchema,
  screenDescription: z.string(),
});

export type DialogueBlock = z.infer<typeof dialogueBlockSchema>;

// ── Round ───────────────────────────────────────────────────────────────────

export const roundSchema = z.object({
  roundNumber: z.number(),
  dialogue: dialogueBlockSchema,
});

export type Round = z.infer<typeof roundSchema>;

// ── Step ────────────────────────────────────────────────────────────────────

export const stepTypeSchema = z.enum([
  "bridge",
  "rules",
  "rounds",
  "celebration",
  "closing",
]);

export const stepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  type: stepTypeSchema,
  // For type === 'bridge': warm + cold start variants
  warmStart: dialogueBlockSchema.optional(),
  coldStart: dialogueBlockSchema.optional(),
  // For all other types: single dialogue block
  dialogue: dialogueBlockSchema.optional(),
  // For type === 'rounds'
  rounds: z.array(roundSchema).optional(),
  // For type === 'closing': one-line reinforcement naming at least one
  // coreKeyConcept, plus a one-line teaser for the next session.
  // Optional on the base schema (mirrors the warmStart/coldStart pattern used
  // for bridge steps); the evaluate pipeline enforces them for closing steps
  // via a deterministic D4 pre-check in `src/lib/rubric-checks.ts`.
  conceptReinforcement: z.string().optional(),
  tomorrowHook: z.string().optional(),
});

export type Step = z.infer<typeof stepSchema>;

// ── Game Design ─────────────────────────────────────────────────────────────

export const categorySchema = z.enum(["cat1", "cat5"]);
export type Category = z.infer<typeof categorySchema>;
export const tierSchema = z.enum(["T0", "T1", "T2"]);

export const generationModeSchema = z.enum(["freeform", "mapping-informed"]);
export type GenerationMode = z.infer<typeof generationModeSchema>;

export const experiencePillarSchema = z.enum([
  "mystery",
  "creation",
  "performance",
  "discovery",
  "adventure",
  "nurture",
]);
export type ExperiencePillar = z.infer<typeof experiencePillarSchema>;

// ── Game style + pillar constants ────────────────────────────────────────────

export const GAME_STYLES = {
  cat1: [
    "mystery_lens",
    "inventor_workshop",
    "voice_stage",
    "prediction_lab",
    "time_traveler",
    "care_station",
  ],
  cat5: [
    "mystery_trail",
    "mix_lab",
    "ensemble_show",
    "field_experiment",
    "quest_collector",
    "rescue_team",
  ],
} as const;

export const PILLAR_STYLES: Record<ExperiencePillar, { cat1: string; cat5: string }> = {
  mystery:     { cat1: "mystery_lens",      cat5: "mystery_trail" },
  creation:    { cat1: "inventor_workshop", cat5: "mix_lab" },
  performance: { cat1: "voice_stage",       cat5: "ensemble_show" },
  discovery:   { cat1: "prediction_lab",    cat5: "field_experiment" },
  adventure:   { cat1: "time_traveler",     cat5: "quest_collector" },
  nurture:     { cat1: "care_station",      cat5: "rescue_team" },
};

export const PILLAR_LABELS: Record<ExperiencePillar, string> = {
  mystery:     "Mystery — I figured it out!",
  creation:    "Creation — I made this!",
  performance: "Performance — They loved it!",
  discovery:   "Discovery — Was I right?!",
  adventure:   "Adventure — Look how far we went!",
  nurture:     "Nurture — I helped!",
};

export const ALL_PILLARS = Object.keys(PILLAR_STYLES) as ExperiencePillar[];

// Reverse index: game style → owning pillar. Built once at module load so
// styleToPillar is an O(1) lookup instead of scanning PILLAR_STYLES each call.
const STYLE_TO_PILLAR: Record<string, ExperiencePillar> = Object.fromEntries(
  ALL_PILLARS.flatMap((pillar) => [
    [PILLAR_STYLES[pillar].cat1, pillar],
    [PILLAR_STYLES[pillar].cat5, pillar],
  ]),
);

export function styleToPillar(style: string): ExperiencePillar | null {
  return STYLE_TO_PILLAR[style] ?? null;
}

// ── Rubric Scores ───────────────────────────────────────────────────────────

export const rubricScoreSchema = z.enum(["pass", "fail"]);

export const rubricScoresSchema = z.object({
  d1: rubricScoreSchema,
  d2: rubricScoreSchema,
  d3: rubricScoreSchema,
  d4: rubricScoreSchema,
  d5: rubricScoreSchema,
  d6: rubricScoreSchema,
  d7: rubricScoreSchema,
  d8: rubricScoreSchema,
  d9: rubricScoreSchema,
  d10: rubricScoreSchema,
});

export type RubricScores = z.infer<typeof rubricScoresSchema>;

// ── Rubric Issue ───────────────────────────────────────────────────────────

export const rubricIssueSchema = z.object({
  dimension: z.string(),
  description: z.string(),
});

export type RubricIssue = z.infer<typeof rubricIssueSchema>;

// ── Rubric dimension labels ─────────────────────────────────────────────────

export const RUBRIC_DIMENSIONS = {
  d1: "V1 Technical Compliance",
  d2: "Hook & Transition",
  d3: "Edge Case Coverage",
  d4: "IB Completeness",
  d5: "Tier Appropriateness",
  d6: "Dialogue Specificity",
  d7: "Screen & UI Completeness",
  d8: "Entity Mapping Alignment",
  d9: "Game Feel",
  d10: "Pillar Fidelity",
} as const;

export const RUBRIC_DIMENSION_DESCRIPTIONS: Record<
  keyof typeof RUBRIC_DIMENSIONS,
  string
> = {
  d1: "Step count matches the category template, round count is in range, and all required fields are present.",
  d2: "Step 1 (bridge) references specific entity attributes, warm start builds on prior context, and the transition into the game flows naturally.",
  d3: "All three response paths (ideal, unexpected, silent) are distinct and appropriate; silent responses include encouraging re-engagement.",
  d4: "Core IB key concepts are genuinely woven into the activity, and the closing step's conceptReinforcement explicitly names at least one coreKeyConcept.",
  d5: "Language complexity, sentence length, and cognitive demands match the target tier (T0/T1/T2).",
  d6: "AI utterances are warm, age-appropriate, specific, and varied; no repetitive phrasing across rounds.",
  d7: "Every step has a specific screenDescription a UI designer could implement; key UI affordances are named.",
  d8: "Creative variables (metaphor, role, game mechanic) connect meaningfully to the entity's attributes and dimensions.",
  d9: "The design creates genuine uncertainty with a satisfying resolution; the child experiences real stakes, not just structured Q&A.",
  d10: "A blind reader could identify the experience pillar (Mystery / Creation / Performance / Discovery / Adventure / Nurture) from this design alone; the emotional arc matches the pillar's promise.",
};

export const RUBRIC_DIMENSION_KEYS = Object.keys(RUBRIC_DIMENSIONS) as Array<
  keyof typeof RUBRIC_DIMENSIONS
>;

export const RUBRIC_DIMENSION_COUNT = RUBRIC_DIMENSION_KEYS.length;

// ── Category + tier labels ───────────────────────────────────────────────────

export const CATEGORY_LABELS = {
  cat1: "Sustained Verbal Interaction (In-Device)",
  cat5: "Collection/Tracking Exploration (Out-of-Device)",
} as const;

export const TIER_LABELS = {
  T0: "T0 (ages 2–4)",
  T1: "T1 (ages 4–6)",
  T2: "T2 (ages 6–8)",
} as const;
