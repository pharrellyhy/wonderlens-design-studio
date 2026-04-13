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
});

export type Step = z.infer<typeof stepSchema>;

// ── Game Design ─────────────────────────────────────────────────────────────

export const categorySchema = z.enum(["cat1", "cat5"]);
export const tierSchema = z.enum(["T0", "T1", "T2"]);
export const synthesisTypeSchema = z.enum(["narrative", "classification"]);

export const gameDesignSchema = z.object({
  basicInfo: z.object({
    activityName: z.string(),
    category: categorySchema,
    tier: tierSchema,
    triggerEntity: z.string(),
    triggerScene: z.string(),
    coreKeyConcepts: z.array(z.string()),
    relatedConcepts: z.array(z.string()),
    atlSkills: z.array(z.string()),
    gameStyle: z.string(),
    ibTheme: z.string(),
  }),
  creativeVariables: z.object({
    metaphor: z.string(),
    roleTitle: z.string(),
    gameMechanic: z.string(),
    scenarioType: z.string(),
    targetResponseType: z.string(),
    escalationAxis: z.string(),
    // Cat 5 only
    visualFeature: z.string().optional(),
    collectionCriterion: z.string().optional(),
    synthesisType: synthesisTypeSchema.optional(),
    stuckHint: z.string().optional(),
    reflectiveQuestion: z.string().optional(),
  }),
  overview: z.object({
    briefDescription: z.string(),
    kud: z.object({
      know: z.array(z.string()),
      understand: z.array(z.string()),
      do: z.array(z.string()),
    }),
    designHighlight: z.string(),
    typicalScenario: z.string(),
  }),
  steps: z.array(stepSchema),
  entityMapping: z.object({
    mappingSource: z.string(),
    anchorDimensions: z.array(z.string()),
    conversationAnchorDimensions: z.array(z.string()),
    themes: z.array(z.string()),
    keyConcepts: z.array(z.string()),
  }),
});

export type GameDesign = z.infer<typeof gameDesignSchema>;

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
});

export type RubricScores = z.infer<typeof rubricScoresSchema>;

// ── Rubric Issue ───────────────────────────────────────────────────────────

export const rubricIssueSchema = z.object({
  dimension: z.string(),
  description: z.string(),
});

export type RubricIssue = z.infer<typeof rubricIssueSchema>;

// ── Variant Result ─────────────────────────────────────────────────────────

export const variantResultSchema = z.object({
  id: z.string(),
  design: gameDesignSchema.optional(),
  rubricScores: rubricScoresSchema,
  issues: z.array(rubricIssueSchema),
  category: z.string(),
  gameStyle: z.string(),
  status: z.enum(["complete", "failed"]),
  error: z.string().optional(),
});

export type VariantResult = z.infer<typeof variantResultSchema>;

// ── Generation Job ─────────────────────────────────────────────────────────

export const generationJobSchema = z.object({
  id: z.string(),
  status: z.enum([
    "queued",
    "generating",
    "evaluating",
    "fixing",
    "complete",
    "failed",
  ]),
  currentVariant: z.number(),
  totalVariants: z.number(),
  variants: z.array(variantResultSchema),
  error: z.string().optional(),
  createdAt: z.number(),
});

export type GenerationJob = z.infer<typeof generationJobSchema>;

// ── Rubric dimension labels ─────────────────────────────────────────────────

export const RUBRIC_DIMENSIONS = {
  d1: "Technical Constraints",
  d2: "Hook Rule",
  d3: "Transition Naturalness",
  d4: "Edge Case Handling",
  d5: "IB Alignment",
  d6: "Tier Appropriateness",
  d7: "Dialogue Quality",
  d8: "Screen Descriptions",
  d9: "Entity Mapping Alignment",
} as const;

// ── Game style options ──────────────────────────────────────────────────────

export const GAME_STYLES = {
  cat1: [
    "voice_acting",
    "storytelling_chain",
    "prediction_game",
    "helper_hotline",
  ],
  cat5: ["comparison_chart", "naming_story"],
} as const;

export const CATEGORY_LABELS = {
  cat1: "Sustained Verbal Interaction (In-Device)",
  cat5: "Collection/Tracking Exploration (Out-of-Device)",
} as const;

export const TIER_LABELS = {
  T0: "T0 (ages 2–4)",
  T1: "T1 (ages 4–6)",
  T2: "T2 (ages 6–8)",
} as const;
