import { z } from "zod";

import {
  PILLAR_STYLES,
  categorySchema,
  dialogueBlockSchema,
  experiencePillarSchema,
  generationModeSchema,
  rubricIssueSchema,
  rubricScoresSchema,
  stepSchema,
  tierSchema,
  type Category,
  type ExperiencePillar,
} from "./design-schema";

// ============================================================================
// Closed enums (mirror activities/_schema/tag_block.schema.json)
//
// Every enum below is one of the canonical vocabularies enforced both by the
// JSON Schema and by Zod here. The drift test under
// `__tests__/tag-block-schema-drift.test.ts` reads the JSON Schema at runtime
// and asserts each list matches.
// ============================================================================

export const observationAngleSchema = z.enum([
  "color",
  "shape",
  "size",
  "quantity",
  "texture",
  "material",
  "pattern",
  "function",
  "origin",
  "behavior",
  "emotion",
  "state",
]);
export type ObservationAngle = z.infer<typeof observationAngleSchema>;

export const mechanicSchema = z.enum([
  "enumerate",
  "compare",
  "collect",
  "sort",
  "deduce",
  "voice",
  "build",
  "predict",
  "narrate",
  "care",
]);
export type Mechanic = z.infer<typeof mechanicSchema>;

export const entityRoleSchema = z.enum([
  "subject",
  "exemplar",
  "catalyst",
  "reference",
]);
export type EntityRole = z.infer<typeof entityRoleSchema>;

export const ibKeyConceptSchema = z.enum([
  "Form",
  "Function",
  "Causation",
  "Change",
  "Connection",
  "Perspective",
  "Responsibility",
]);
export type IbKeyConcept = z.infer<typeof ibKeyConceptSchema>;

export const topicAxisSchema = z.enum([
  "form",
  "function",
  "causation",
  "change",
  "connection",
  "perspective",
  "responsibility",
]);
export type TopicAxis = z.infer<typeof topicAxisSchema>;

export const tagBlockPillarSchema = z.enum([
  "Discovery",
  "Performance",
  "Mystery",
  "Creation",
  "Adventure",
  "Connection",
]);
export type TagBlockPillar = z.infer<typeof tagBlockPillarSchema>;

export const entityBindingSchema = z.enum([
  "bound",
  "parameterized",
  "agnostic",
]);
export type EntityBinding = z.infer<typeof entityBindingSchema>;

export const templateTypeSchema = z.enum(["cat1", "cat5"]);
export type TemplateType = z.infer<typeof templateTypeSchema>;

export const caregiverRoleSchema = z.enum([
  "scaffold",
  "co-explorer",
  "observer",
]);
export type CaregiverRole = z.infer<typeof caregiverRoleSchema>;

// ── Pillar capitalisation bridge ───────────────────────────────────────────
//
// `experiencePillarSchema` (lowercase) is the studio's internal pillar name
// used for game-style routing in PILLAR_STYLES. `tagBlockPillarSchema`
// (TitleCase) mirrors the on-disk vocabulary defined by the JSON Schema and
// `docs/activity_vocabulary.md`. Most pillars match modulo case; the only
// non-trivial pair is `nurture` ↔ `Connection` — the studio uses "Nurture" as
// an experience pillar name, but the canonical activity vocabulary names that
// pillar "Connection". Confirm against docs/activity_vocabulary.md before
// shipping.

export const EXPERIENCE_PILLAR_TO_TAG_BLOCK_PILLAR: Record<
  ExperiencePillar,
  TagBlockPillar
> = {
  mystery: "Mystery",
  creation: "Creation",
  performance: "Performance",
  discovery: "Discovery",
  adventure: "Adventure",
  // TODO(2026-05-07): confirm `nurture → Connection` against
  // docs/activity_vocabulary.md before ungating Phase 4.
  nurture: "Connection",
};

export const TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR: Record<
  TagBlockPillar,
  ExperiencePillar
> = Object.fromEntries(
  (Object.entries(EXPERIENCE_PILLAR_TO_TAG_BLOCK_PILLAR) as Array<
    [ExperiencePillar, TagBlockPillar]
  >).map(([lo, hi]) => [hi, lo]),
) as Record<TagBlockPillar, ExperiencePillar>;

// ============================================================================
// activity_id pattern (shared)
// ============================================================================

export const activityIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]+$/, "activity_id must be lowercase snake_case");

// ============================================================================
// 1. spec — authoring intent
// ============================================================================

export const specIdentitySchema = z.object({
  pillar: tagBlockPillarSchema,
  gameStyle: z.string().min(1),
  mechanic: mechanicSchema,
  observationAngle: observationAngleSchema,
  entityRole: entityRoleSchema,
});

export const specTargetSchema = z.object({
  ibAxisPrimary: z.string().min(1),
  ibAxisSecondary: z.string().optional(),
  primaryTier: tierSchema,
  tierElasticity: z.string().min(1),
  ageNotes: z.string().min(1),
});

export const specSelectionTriggerSchema = z.object({
  description: z.string().min(1),
  tierGuidanceAttributeIds: z.array(z.string().min(1)).min(1),
  constellationNotes: z.string().optional(),
});

export const specSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  premise: z.string().min(1),
  target: specTargetSchema,
  pedagogicalRationale: z.string().min(1),
  selectionTrigger: specSelectionTriggerSchema,
  identity: specIdentitySchema,
});

export type Spec = z.infer<typeof specSchema>;

// ============================================================================
// 2. prod — runtime dialogue + flow
// ============================================================================

export const constellationAdaptationSchema = z.object({
  preserve: z.array(z.string().min(1)),
  swap: z.array(z.string().min(1)),
  watch: z.array(z.string().min(1)),
});

export const prodBasicInfoSchema = z.object({
  activityName: z.string().min(1),
  activityCategory: templateTypeSchema,
  recommendedTier: tierSchema,
  coreIbKeyConcepts: z.array(ibKeyConceptSchema).min(1),
  relatedConcepts: z.array(z.string()),
  atlSkillsFocus: z.array(z.string()),
  gameStyle: z.string().min(1),
  designVersion: z.string().min(1),
  // ISO date YYYY-MM-DD
  lastUpdated: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "lastUpdated must be YYYY-MM-DD"),
});

export const prodOverviewSchema = z.object({
  briefDescription: z.string().min(1),
  designHighlight: z.string().min(1),
  typicalScenario: z.string().min(1),
});

export const prodKudSchema = z.object({
  know: z.array(z.string().min(1)).min(1),
  understand: z.array(z.string().min(1)).min(1),
  do: z.array(z.string().min(1)).min(1),
});

export const prodSchema = z.object({
  basicInfo: prodBasicInfoSchema,
  // May be empty for property-bound activities — those match via the
  // property itself rather than a specific tier_guidance attribute.
  entityAttributesCovered: z.array(z.string().min(1)),
  // Optional — entity-bound activities ship constellation adaptation notes;
  // property-bound activities (where the entity is an exemplar of a property)
  // generally don't.
  constellationAdaptation: constellationAdaptationSchema.optional(),
  overview: prodOverviewSchema,
  kud: prodKudSchema,
  steps: z.array(stepSchema).min(1),
});

export type Prod = z.infer<typeof prodSchema>;

// ============================================================================
// 3. tagBlock — structured metadata (Zod port of tag_block.schema.json)
//
// Uses .loose() to mirror `additionalProperties: true`. Field names match the
// JSON Schema (snake_case) so YAML round-trips byte-for-byte through js-yaml
// without a key-rewrite pass.
// ============================================================================

export const tierRangeSchema = z.object({
  primary: tierSchema,
  span: z.array(tierSchema).min(1),
  elasticity: z.string().min(1),
});

export const progressionSchema = z.object({
  topic_axis: topicAxisSchema,
  difficulty_level: z.number().int().min(1).max(3),
  next_step_hint: z.string().optional(),
  reward_hook: z.string().optional(),
});

export const bridgePrerequisitesSchema = z.object({
  primary: z.array(observationAngleSchema).min(1).max(3),
  secondary: z.array(z.string()).max(3).optional(),
});

export const activitySignatureSchema = z.object({
  observation_angle: observationAngleSchema,
  mechanic: mechanicSchema,
  entity_role: entityRoleSchema,
  focal_attribute: z.string().min(1),
  intro: z.string().min(1),
  bridge_prerequisites: bridgePrerequisitesSchema,
  preview_label: z.string().min(1),
  preview_prompt: z.string().min(1),
  role_pivot_note: z.string().default(""),
});

export const matchabilitySchema = z.object({
  entity_class_filter: z.array(z.string()),
  tier_support: z.strictObject({
    T0: z.boolean(),
    T1: z.boolean(),
    T2: z.boolean(),
  }),
});

export const kudYamlSchema = z.object({
  know: z.array(z.string()).optional(),
  understand: z.array(z.string()).optional(),
  do: z.array(z.string()).optional(),
});

export const tagBlockSchema = z
  .object({
    activity_id: activityIdSchema,
    version: z.number().int().min(1),
    source_entity_exemplar: z.string().optional(),
    template_type: templateTypeSchema,
    pillar: tagBlockPillarSchema,
    game_style: z.string().min(1),

    entity: z.string().min(1),
    entity_class: z.array(z.string()).optional(),
    entity_binding: entityBindingSchema,

    tier_range: tierRangeSchema,

    category: z.string().optional(),
    attributes: z.array(z.string()).optional(),

    key_concepts: z.array(ibKeyConceptSchema).min(1),
    related_concepts: z.array(z.string()).optional(),
    atl_skills: z.array(z.string()).optional(),
    transdisciplinary_theme: z.string().optional(),

    kud: kudYamlSchema.optional(),

    progression: progressionSchema,

    caregiver_role: z.array(caregiverRoleSchema).min(1),

    activity_signature: activitySignatureSchema,

    matchability: matchabilitySchema,
  })
  .loose();

export type TagBlock = z.infer<typeof tagBlockSchema>;

// ============================================================================
// 4. recap — child recap template (with placeholder strings)
// ============================================================================

export const recapFocalAttributeSchema = z.object({
  token: z.string().min(1),
  childLabel: z.string().min(1),
  badgeEmojiNone: z.boolean(),
});

export const recapFindSchema = z.object({
  label: z.string().min(1),
  photo: z.string().min(1),
});

export const recapPayloadDefaultsSchema = z.object({
  // These four carry runtime placeholder strings (e.g. "{runtime_entity}").
  entity: z.string().min(1),
  tier: z.string().min(1),
  ageYears: z.string().min(1),
  whatWeNoticed: observationAngleSchema,
  whatWeDid: z.string().min(1),
  entityRole: entityRoleSchema,
  focalAttribute: recapFocalAttributeSchema,
  highlightMoment: z.string().min(1),
  finds: z.array(recapFindSchema).optional(),
  difficultyLevel: z.number().int().min(1).max(3),
  nextStepHint: z.string().min(1),
  caregiverObserved: caregiverRoleSchema,
  rewardBadge: z.string().min(1),
});

export const recapRenderedSchema = z.object({
  title: z.string().min(1),
  line_1: z.string().min(1),
  line_2: z.string().min(1),
  line_3: z.string().min(1),
  badge: z.string().min(1),
  next: z.string().min(1),
});

export const recapSchema = z.object({
  payloadDefaults: recapPayloadDefaultsSchema,
  rendered: recapRenderedSchema,
});

export type Recap = z.infer<typeof recapSchema>;

// ============================================================================
// 5. dashboard — parent rollup fragment
// ============================================================================

export const dashboardSessionSchema = z.object({
  axis: topicAxisSchema,
  angle: observationAngleSchema,
  mechanic: mechanicSchema,
  entityRole: entityRoleSchema,
  focalAttribute: z.string().min(1),
  // Runtime placeholder strings, e.g. "{runtime_entry_rung}".
  entryRung: z.string().min(1),
  exitRung: z.string().min(1),
  outcome: z.string().min(1),
});

export const dashboardCuriosityRadialSchema = z.object({
  axis: topicAxisSchema,
  angle: observationAngleSchema,
});

export const dashboardExplorationMatrixSchema = z.object({
  cell: z.string().min(1),
});

export const dashboardKeyConceptExposureSchema = z.object({
  angle: observationAngleSchema,
});

export const dashboardContributesToSchema = z.object({
  curiosityRadial: dashboardCuriosityRadialSchema,
  explorationMatrix: dashboardExplorationMatrixSchema,
  // Sparse: only the activity's own key concepts appear here, not all 7
  // IB concepts. Mirrors `key_concepts_exposure` in the canonical YAML.
  keyConceptsExposure: z.partialRecord(
    ibKeyConceptSchema,
    dashboardKeyConceptExposureSchema,
  ),
  atlSkillsTrail: z.array(z.string()),
});

export const dashboardSchema = z.object({
  session: dashboardSessionSchema,
  contributesTo: dashboardContributesToSchema,
});

export type Dashboard = z.infer<typeof dashboardSchema>;

// ============================================================================
// ActivityBundle — top-level container with cross-doc invariants
// ============================================================================

export const activityBundleSchema = z
  .object({
    schemaVersion: z.literal(1),
    activityId: activityIdSchema,
    generationMode: generationModeSchema,
    spec: specSchema,
    prod: prodSchema,
    tagBlock: tagBlockSchema,
    recap: recapSchema,
    dashboard: dashboardSchema,
  })
  .superRefine((bundle, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    // I1 — activityId mirrors tag_block.activity_id.
    if (bundle.tagBlock.activity_id !== bundle.activityId) {
      issue(
        ["tagBlock", "activity_id"],
        `tagBlock.activity_id (${bundle.tagBlock.activity_id}) must equal bundle.activityId (${bundle.activityId})`,
      );
    }

    // I2 — prod and tagBlock agree on game_style.
    if (bundle.prod.basicInfo.gameStyle !== bundle.tagBlock.game_style) {
      issue(
        ["prod", "basicInfo", "gameStyle"],
        `prod.basicInfo.gameStyle (${bundle.prod.basicInfo.gameStyle}) must equal tagBlock.game_style (${bundle.tagBlock.game_style})`,
      );
    }

    // I3 — prod and tagBlock agree on category / template_type.
    if (
      bundle.prod.basicInfo.activityCategory !== bundle.tagBlock.template_type
    ) {
      issue(
        ["prod", "basicInfo", "activityCategory"],
        `prod.basicInfo.activityCategory (${bundle.prod.basicInfo.activityCategory}) must equal tagBlock.template_type (${bundle.tagBlock.template_type})`,
      );
    }

    // I4 — recommendedTier mirrors tier_range.primary.
    if (
      bundle.prod.basicInfo.recommendedTier !==
      bundle.tagBlock.tier_range.primary
    ) {
      issue(
        ["prod", "basicInfo", "recommendedTier"],
        `prod.basicInfo.recommendedTier (${bundle.prod.basicInfo.recommendedTier}) must equal tagBlock.tier_range.primary (${bundle.tagBlock.tier_range.primary})`,
      );
    }

    // I5 — spec.identity.pillar mirrors tagBlock.pillar.
    if (bundle.spec.identity.pillar !== bundle.tagBlock.pillar) {
      issue(
        ["spec", "identity", "pillar"],
        `spec.identity.pillar (${bundle.spec.identity.pillar}) must equal tagBlock.pillar (${bundle.tagBlock.pillar})`,
      );
    }

    // I6 — spec.identity.gameStyle mirrors tagBlock.game_style.
    if (bundle.spec.identity.gameStyle !== bundle.tagBlock.game_style) {
      issue(
        ["spec", "identity", "gameStyle"],
        `spec.identity.gameStyle (${bundle.spec.identity.gameStyle}) must equal tagBlock.game_style (${bundle.tagBlock.game_style})`,
      );
    }

    // I7 — spec.identity {mechanic, observationAngle, entityRole} mirror
    // tagBlock.activity_signature equivalents.
    const sig = bundle.tagBlock.activity_signature;
    if (bundle.spec.identity.mechanic !== sig.mechanic) {
      issue(
        ["spec", "identity", "mechanic"],
        `spec.identity.mechanic (${bundle.spec.identity.mechanic}) must equal tagBlock.activity_signature.mechanic (${sig.mechanic})`,
      );
    }
    if (bundle.spec.identity.observationAngle !== sig.observation_angle) {
      issue(
        ["spec", "identity", "observationAngle"],
        `spec.identity.observationAngle (${bundle.spec.identity.observationAngle}) must equal tagBlock.activity_signature.observation_angle (${sig.observation_angle})`,
      );
    }
    if (bundle.spec.identity.entityRole !== sig.entity_role) {
      issue(
        ["spec", "identity", "entityRole"],
        `spec.identity.entityRole (${bundle.spec.identity.entityRole}) must equal tagBlock.activity_signature.entity_role (${sig.entity_role})`,
      );
    }

    // I8 — recap.payloadDefaults.whatWeNoticed mirrors observation_angle.
    if (bundle.recap.payloadDefaults.whatWeNoticed !== sig.observation_angle) {
      issue(
        ["recap", "payloadDefaults", "whatWeNoticed"],
        `recap.payloadDefaults.whatWeNoticed (${bundle.recap.payloadDefaults.whatWeNoticed}) must equal tagBlock.activity_signature.observation_angle (${sig.observation_angle})`,
      );
    }

    // I9 — recap.payloadDefaults.entityRole mirrors activity_signature.entity_role.
    if (bundle.recap.payloadDefaults.entityRole !== sig.entity_role) {
      issue(
        ["recap", "payloadDefaults", "entityRole"],
        `recap.payloadDefaults.entityRole (${bundle.recap.payloadDefaults.entityRole}) must equal tagBlock.activity_signature.entity_role (${sig.entity_role})`,
      );
    }

    // I10 — dashboard.session mirrors tagBlock equivalents.
    const sess = bundle.dashboard.session;
    if (sess.angle !== sig.observation_angle) {
      issue(
        ["dashboard", "session", "angle"],
        `dashboard.session.angle (${sess.angle}) must equal tagBlock.activity_signature.observation_angle (${sig.observation_angle})`,
      );
    }
    if (sess.mechanic !== sig.mechanic) {
      issue(
        ["dashboard", "session", "mechanic"],
        `dashboard.session.mechanic (${sess.mechanic}) must equal tagBlock.activity_signature.mechanic (${sig.mechanic})`,
      );
    }
    if (sess.entityRole !== sig.entity_role) {
      issue(
        ["dashboard", "session", "entityRole"],
        `dashboard.session.entityRole (${sess.entityRole}) must equal tagBlock.activity_signature.entity_role (${sig.entity_role})`,
      );
    }
    if (sess.focalAttribute !== sig.focal_attribute) {
      issue(
        ["dashboard", "session", "focalAttribute"],
        `dashboard.session.focalAttribute (${sess.focalAttribute}) must equal tagBlock.activity_signature.focal_attribute (${sig.focal_attribute})`,
      );
    }
    if (sess.axis !== bundle.tagBlock.progression.topic_axis) {
      issue(
        ["dashboard", "session", "axis"],
        `dashboard.session.axis (${sess.axis}) must equal tagBlock.progression.topic_axis (${bundle.tagBlock.progression.topic_axis})`,
      );
    }

    // I11 — pillar/category/game_style triple is internally consistent.
    const lowerPillar = TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR[bundle.tagBlock.pillar];
    const expectedStyle =
      PILLAR_STYLES[lowerPillar][bundle.tagBlock.template_type as Category];
    if (bundle.tagBlock.game_style !== expectedStyle) {
      issue(
        ["tagBlock", "game_style"],
        `tagBlock.game_style (${bundle.tagBlock.game_style}) does not match the (pillar, template_type) → game_style mapping (expected ${expectedStyle} for pillar ${bundle.tagBlock.pillar} / category ${bundle.tagBlock.template_type})`,
      );
    }
  });

export type ActivityBundle = z.infer<typeof activityBundleSchema>;

// ============================================================================
// VariantResult / GenerationJob — bundle-shaped clones of the legacy types
// ============================================================================

export const variantResultSchema = z.object({
  id: z.string(),
  bundle: activityBundleSchema.optional(),
  rubricScores: rubricScoresSchema.optional(),
  issues: z.array(rubricIssueSchema).optional(),
  category: categorySchema,
  gameStyle: z.string(),
  status: z.enum(["pending", "complete", "failed"]),
  error: z.string().optional(),
});

export type VariantResult = z.infer<typeof variantResultSchema>;

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

// Re-export the dialogue/step primitives for downstream consumers that used to
// pull them from `design-schema.ts`. New code should import these from here.
export { dialogueBlockSchema, stepSchema, experiencePillarSchema };
