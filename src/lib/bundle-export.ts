import JSZip from "jszip";
import { dump as yamlDump } from "js-yaml";

import type {
  ActivityBundle,
  Recap,
  TagBlock,
} from "./activity-bundle-schema";
import type { DialogueBlock, Step } from "./design-schema";

// ============================================================================
// Constants — section headers spliced into tag_block.yaml
// ============================================================================

const SECTION_HEADERS = {
  identity: "# ─── §0 · IDENTITY ────────────────────────────────────",
  ibFrame: "# ─── §1 · IB FRAME ────────────────────────────────────",
  signature: "# ─── §2 · ACTIVITY SIGNATURE ───────────────────────────",
  matchability: "# ─── §3 · MATCHABILITY ─────────────────────────────────",
} as const;

const TIER_LABEL: Record<"T0" | "T1" | "T2", string> = {
  T0: "T0 (ages 2–4)",
  T1: "T1 (ages 4–6)",
  T2: "T2 (ages 6–8)",
};

const CATEGORY_LABEL: Record<"cat1" | "cat5", string> = {
  cat1: "Sustained Verbal Interaction (In-Device)",
  cat5: "Collection/Tracking Exploration (Out-of-Device)",
};

// ============================================================================
// 1. spec.md
// ============================================================================

export function renderSpecMarkdown(bundle: ActivityBundle): string {
  const { spec, tagBlock } = bundle;
  const sig = tagBlock.activity_signature;
  const lines: string[] = [];

  lines.push(`# ${spec.title}`);
  lines.push("");
  if (spec.subtitle) {
    lines.push(`> ${spec.subtitle}`);
    lines.push("");
  }

  lines.push("## Premise");
  lines.push("");
  lines.push(spec.premise);
  lines.push("");

  lines.push("## Target");
  lines.push("");
  lines.push(`- **IB axis:** ${spec.target.ibAxisPrimary}${spec.target.ibAxisSecondary ? ` + ${spec.target.ibAxisSecondary}` : ""}`);
  lines.push(`- **Primary rung:** ${TIER_LABEL[spec.target.primaryTier]}`);
  lines.push(`- **Tier elasticity:** ${spec.target.tierElasticity}`);
  lines.push(`- **Age tier:** ${spec.target.ageNotes}`);
  lines.push("");

  lines.push("## Pedagogical rationale");
  lines.push("");
  lines.push(spec.pedagogicalRationale);
  lines.push("");

  lines.push("## Selection trigger");
  lines.push("");
  lines.push(spec.selectionTrigger.description);
  lines.push("");
  lines.push("Drives off the entity `tier_guidance` attributes:");
  lines.push("");
  for (const attrId of spec.selectionTrigger.tierGuidanceAttributeIds) {
    lines.push(`- \`${attrId}\``);
  }
  if (spec.selectionTrigger.constellationNotes) {
    lines.push("");
    lines.push(spec.selectionTrigger.constellationNotes);
  }
  lines.push("");

  lines.push("## Experience pillar & game style");
  lines.push("");
  lines.push(`- **Pillar:** ${spec.identity.pillar}`);
  lines.push(`- **Game style:** \`${spec.identity.gameStyle}\``);
  lines.push(`- **Mechanic:** \`${spec.identity.mechanic}\``);
  lines.push(`- **Observation angle:** \`${spec.identity.observationAngle}\``);
  lines.push(`- **Entity role:** \`${spec.identity.entityRole}\`${sig.role_pivot_note ? ` (${sig.role_pivot_note})` : ""}`);

  return lines.join("\n") + "\n";
}

// ============================================================================
// 2. prod.md
// ============================================================================

export function renderProdMarkdown(bundle: ActivityBundle): string {
  const { prod } = bundle;
  const bi = prod.basicInfo;
  const lines: string[] = [];

  lines.push(`## ${bi.activityName}`);
  lines.push("");

  // ── A. Basic Info table ─────────────────────────────────────────────
  lines.push("### A. Basic Info");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Activity Name | ${bi.activityName} |`);
  lines.push(`| Activity Category | ${CATEGORY_LABEL[bi.activityCategory]} |`);
  lines.push(`| Recommended Tier | ${TIER_LABEL[bi.recommendedTier]} |`);
  lines.push(`| Core IB Key Concepts | ${bi.coreIbKeyConcepts.join(", ")} |`);
  lines.push(`| Related Concepts | ${bi.relatedConcepts.join(", ")} |`);
  lines.push(`| ATL Skills Focus | ${bi.atlSkillsFocus.join(", ")} |`);
  lines.push(`| Game Style | ${bi.gameStyle} |`);
  lines.push(`| Design Version | ${bi.designVersion} |`);
  lines.push(`| Last Updated | ${bi.lastUpdated} |`);
  lines.push("");

  // ── A.1 Entity Attributes Covered ───────────────────────────────────
  // Skip when the bundle has no specific tier_guidance attributes —
  // property-bound activities match via the property itself.
  if (prod.entityAttributesCovered.length > 0) {
    lines.push("### A.1 Entity Attributes Covered");
    lines.push("");
    lines.push("Attribute IDs from the entity mapping `tier_guidance` that this activity exercises. Consumed by the upstream matcher to route photographed entities to this game.");
    lines.push("");
    lines.push("```yaml");
    lines.push("entity_attributes_covered:");
    for (const attrId of prod.entityAttributesCovered) {
      lines.push(`  - ${attrId}`);
    }
    lines.push("```");
    lines.push("");
  }

  // ── A.2 Constellation Adaptation Notes ──────────────────────────────
  // Property-bound activities (entity_role: exemplar/reference) typically
  // omit constellation adaptation entirely; only render A.2 when the
  // bundle actually carries it.
  if (prod.constellationAdaptation) {
    lines.push("### A.2 Constellation Adaptation Notes");
    lines.push("");
    lines.push("Recipe for running this activity when the photographed entity is a constellation neighbor of the source entity. Adapt mechanically for a bridged entity per the Preserve / Swap / Watch lists below.");
    lines.push("");
    lines.push("**Preserve** — must not change across neighbors:");
    for (const item of prod.constellationAdaptation.preserve) {
      lines.push(`- ${item}`);
    }
    lines.push("");
    lines.push("**Swap** — re-phrase for the bridged entity:");
    for (const item of prod.constellationAdaptation.swap) {
      lines.push(`- ${item}`);
    }
    lines.push("");
    lines.push("**Watch** — gotchas to avoid:");
    for (const item of prod.constellationAdaptation.watch) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  // ── B. Activity Overview ────────────────────────────────────────────
  lines.push("### B. Activity Overview");
  lines.push("");
  lines.push(`- **① Brief Description**: ${prod.overview.briefDescription}`);
  lines.push("");
  lines.push("- **② Educational Purpose (KUD)**:");
  lines.push(`  - **K (Know)**: ${prod.kud.know.join("; ")}`);
  lines.push(`  - **U (Understand)**: ${prod.kud.understand.join("; ")}`);
  lines.push(`  - **D (Do)**: ${prod.kud.do.join("; ")}`);
  lines.push("");
  lines.push(`- **③ Design Highlight**: ${prod.overview.designHighlight}`);
  lines.push("");
  lines.push(`- **④ Typical Scenario**: ${prod.overview.typicalScenario}`);
  lines.push("");

  // ── C. Interaction Flow ─────────────────────────────────────────────
  lines.push("### C. Interaction Flow");
  lines.push("");
  lines.push(`> Recommended Tier: ${TIER_LABEL[bi.recommendedTier]}`);
  lines.push("");
  for (const step of prod.steps) {
    lines.push(...renderProdStep(step));
    lines.push("");
  }

  // Trim trailing blank line.
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.join("\n") + "\n";
}

function renderProdStep(step: Step): string[] {
  const lines: string[] = [];
  lines.push(`#### Step ${step.stepNumber}: ${step.title}`);
  lines.push("");

  if (step.type === "bridge") {
    // Author-facing bundle uses cold-start (or warm if cold absent) as the
    // canonical runtime opener. Warm-start variants are stored on the bundle
    // for tooling but the prod doc shows a single block to keep the flow
    // readable for reviewers.
    const block = step.coldStart ?? step.warmStart;
    if (block) {
      lines.push(...renderDialogueBlock(block));
    }
    return lines;
  }

  if (step.type === "rounds" && step.rounds && step.rounds.length > 0) {
    // Render every round fully. Editorial prose summaries for later rounds
    // (per the canonical author-written prod.md) are a future enhancement
    // requiring a per-round summary field on the schema.
    for (let i = 0; i < step.rounds.length; i++) {
      const round = step.rounds[i];
      if (i > 0) lines.push("");
      lines.push(`**Round ${round.roundNumber}**`);
      lines.push("");
      lines.push(...renderDialogueBlock(round.dialogue));
    }
    return lines;
  }

  if (step.dialogue) {
    lines.push(...renderDialogueBlock(step.dialogue));
  }

  if (step.type === "closing") {
    if (step.conceptReinforcement) {
      lines.push("");
      lines.push(`**Concept reinforcement:** ${step.conceptReinforcement}`);
    }
    if (step.tomorrowHook) {
      lines.push(`**Tomorrow's hook:** ${step.tomorrowHook}`);
    }
  }
  return lines;
}

function renderDialogueBlock(d: DialogueBlock): string[] {
  const lines: string[] = [];
  lines.push(`**AI says:** ${d.aiSays}`);
  lines.push("");
  lines.push("**Child responses:**");
  lines.push("");
  lines.push(`1. (Ideal) ${d.childResponses.ideal}`);
  lines.push(`2. (Unexpected) ${d.childResponses.unexpected}`);
  lines.push(`3. (No response) ${d.childResponses.silent}`);
  lines.push("");
  lines.push("**AI follow-up:**");
  lines.push("");
  lines.push(`1. ${d.aiFollowUps.ideal}`);
  lines.push(`2. ${d.aiFollowUps.unexpected}`);
  lines.push(`3. ${d.aiFollowUps.silent}`);
  lines.push("");
  lines.push(`**Screen:** ${d.screenDescription}`);
  return lines;
}

// ============================================================================
// 3. tag_block.yaml
// ============================================================================

export function renderTagBlockYaml(bundle: ActivityBundle): string {
  // js-yaml emits keys in object-insertion order. Building the dump payload
  // with the canonical key sequence lets section headers be spliced in by
  // simple top-level key matches below.
  const tb: TagBlock = bundle.tagBlock;
  const payload: Record<string, unknown> = {
    activity_id: tb.activity_id,
    version: tb.version,
    ...(tb.source_entity_exemplar !== undefined
      ? { source_entity_exemplar: tb.source_entity_exemplar }
      : {}),
    template_type: tb.template_type,
    pillar: tb.pillar,
    game_style: tb.game_style,

    entity: tb.entity,
    ...(tb.entity_class !== undefined ? { entity_class: tb.entity_class } : {}),
    entity_binding: tb.entity_binding,
    tier_range: tb.tier_range,
    ...(tb.category !== undefined ? { category: tb.category } : {}),
    ...(tb.attributes !== undefined ? { attributes: tb.attributes } : {}),
    key_concepts: tb.key_concepts,
    ...(tb.related_concepts !== undefined
      ? { related_concepts: tb.related_concepts }
      : {}),
    ...(tb.atl_skills !== undefined ? { atl_skills: tb.atl_skills } : {}),
    ...(tb.transdisciplinary_theme !== undefined
      ? { transdisciplinary_theme: tb.transdisciplinary_theme }
      : {}),
    ...(tb.kud !== undefined ? { kud: tb.kud } : {}),
    progression: tb.progression,
    caregiver_role: tb.caregiver_role,

    activity_signature: tb.activity_signature,

    matchability: tb.matchability,
  };

  const dumped = yamlDump(payload, { lineWidth: 120, noRefs: true });

  // Splice section headers in front of the four anchor keys. Anchors are
  // chosen so the file still parses if a header is missing or misordered —
  // the renderer is the one source of truth, but downstream tooling that
  // hand-edits the YAML stays robust.
  return spliceHeaders(dumped, [
    { key: "activity_id", header: SECTION_HEADERS.identity },
    { key: "entity", header: SECTION_HEADERS.ibFrame },
    { key: "activity_signature", header: SECTION_HEADERS.signature },
    { key: "matchability", header: SECTION_HEADERS.matchability },
  ]);
}

function spliceHeaders(
  yaml: string,
  inserts: Array<{ key: string; header: string }>,
): string {
  const out: string[] = [];
  const lines = yaml.split("\n");
  for (const line of lines) {
    const match = inserts.find((insert) => line.startsWith(`${insert.key}:`));
    if (match) {
      if (out.length > 0 && out[out.length - 1].trim() !== "") {
        out.push("");
      }
      out.push(match.header);
    }
    out.push(line);
  }
  return out.join("\n");
}

// ============================================================================
// 4. recap.template.yaml
// ============================================================================

export function renderRecapYaml(bundle: ActivityBundle): string {
  const r: Recap = bundle.recap;
  const pd = r.payloadDefaults;
  const payload: Record<string, unknown> = {
    recap_payload: {
      entity: pd.entity,
      tier: pd.tier,
      age_years: pd.ageYears,

      what_we_noticed: pd.whatWeNoticed,
      what_we_did: pd.whatWeDid,
      entity_role: pd.entityRole,

      focal_attribute: {
        token: pd.focalAttribute.token,
        child_label: pd.focalAttribute.childLabel,
        badge_emoji_none: pd.focalAttribute.badgeEmojiNone,
      },

      highlight_moment: pd.highlightMoment,

      ...(pd.finds !== undefined && pd.finds.length > 0
        ? { finds: pd.finds }
        : {}),

      difficulty_level: pd.difficultyLevel,
      next_step_hint: pd.nextStepHint,

      caregiver_observed: pd.caregiverObserved,
      reward_badge: pd.rewardBadge,
    },
    rendered: {
      title: r.rendered.title,
      line_1: r.rendered.line_1,
      line_2: r.rendered.line_2,
      line_3: r.rendered.line_3,
      badge: r.rendered.badge,
      next: r.rendered.next,
    },
  };

  const dumped = yamlDump(payload, { lineWidth: 120, noRefs: true });
  return [
    "# Child recap payload shape for this game.",
    "# At runtime, {placeholders} are filled with session-specific values.",
    dumped.trimEnd(),
    "",
  ].join("\n");
}

// ============================================================================
// 5. dashboard.template.yaml
// ============================================================================

export function renderDashboardYaml(bundle: ActivityBundle): string {
  const d = bundle.dashboard;
  const payload: Record<string, unknown> = {
    dashboard_fragment: {
      session: {
        axis: d.session.axis,
        angle: d.session.angle,
        mechanic: d.session.mechanic,
        entity_role: d.session.entityRole,
        focal_attribute: d.session.focalAttribute,
        entry_rung: d.session.entryRung,
        exit_rung: d.session.exitRung,
        outcome: d.session.outcome,
      },
      contributes_to: {
        curiosity_radial: {
          axis: d.contributesTo.curiosityRadial.axis,
          angle: d.contributesTo.curiosityRadial.angle,
        },
        exploration_matrix: {
          cell: d.contributesTo.explorationMatrix.cell,
        },
        key_concepts_exposure: Object.fromEntries(
          Object.entries(d.contributesTo.keyConceptsExposure).map(
            ([concept, exposure]) => [concept, { angle: exposure.angle }],
          ),
        ),
        atl_skills_trail: d.contributesTo.atlSkillsTrail,
      },
    },
  };

  const dumped = yamlDump(payload, { lineWidth: 120, noRefs: true });
  return [
    "# Parent dashboard FRAGMENT produced by this game.",
    "# This is what gets merged into the device-scoped rollup at session end.",
    dumped.trimEnd(),
    "",
  ].join("\n");
}

// ============================================================================
// bundleToZip — packages all 5 files under a `<activityId>/` root folder
// ============================================================================

export interface BundleZipResult {
  bytes: Uint8Array;
  filename: string;
}

export async function bundleToZip(
  bundle: ActivityBundle,
): Promise<BundleZipResult> {
  const zip = new JSZip();
  const root = zip.folder(bundle.activityId);
  if (!root) {
    // JSZip returns null only on empty/invalid folder names. The activityId
    // regex on activityBundleSchema rules that out, so this is paranoia.
    throw new Error(
      `Failed to create zip root folder for activityId '${bundle.activityId}'`,
    );
  }
  root.file("spec.md", renderSpecMarkdown(bundle));
  root.file("prod.md", renderProdMarkdown(bundle));
  root.file("tag_block.yaml", renderTagBlockYaml(bundle));
  root.file("recap.template.yaml", renderRecapYaml(bundle));
  root.file("dashboard.template.yaml", renderDashboardYaml(bundle));

  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
  return { bytes, filename: `${bundle.activityId}.zip` };
}
