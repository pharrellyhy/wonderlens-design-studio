import { create } from "zustand";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { ImportedBundleResult } from "@/lib/bundle-import";
import type {
  DialogueBlock,
  GenerationMode,
  RubricIssue,
  RubricScores,
} from "@/lib/design-schema";
import type { ParsedEntity } from "@/lib/yaml-parser";

export interface DesignVariant {
  id: string;
  category: string;
  gameStyle: string;
  status: "pending" | "complete" | "failed";
  bundle?: ActivityBundle;
  rubricScores?: RubricScores;
  error?: string;
  parentDesignId?: string;
}

export type ReviewStatus =
  | "unreviewed"
  | "needs_product_decision"
  | "ready_to_edit";

interface DesignStore {
  // Upload state
  parsedEntity: ParsedEntity | null;
  setParsedEntity: (entity: ParsedEntity | null) => void;

  // Variant gallery state
  variants: DesignVariant[];
  setVariants: (variants: DesignVariant[]) => void;
  addVariant: (variant: DesignVariant) => void;
  updateVariant: (id: string, update: Partial<DesignVariant>) => void;

  // Editor state
  activeBundle: ActivityBundle | null;
  activeDesignId: string | null;
  rubricScores: RubricScores | null;
  rubricIssues: RubricIssue[];
  /**
   * False until the LLM rubric has actually scored this bundle in this
   * session. Disambiguates "no evaluation yet" from "evaluated and failing
   * everything" — the importer seeds rubricScores to all-fail by design,
   * which would otherwise look identical to a real 0/10 score.
   */
  rubricEvaluated: boolean;
  setActiveBundle: (
    id: string,
    bundle: ActivityBundle,
    scores: RubricScores,
    evaluated?: boolean,
  ) => void;
  setRubricIssues: (issues: RubricIssue[]) => void;

  updateField: (path: string, value: unknown) => void;
  addBridgeVariant: (
    stepIndex: number,
    variant: "warmStart" | "coldStart",
  ) => void;
  addRound: (stepIndex: number) => void;

  // Generation job tracking
  generationJobId: string | null;
  setGenerationJobId: (id: string | null) => void;

  generationMode: GenerationMode;
  setGenerationMode: (mode: GenerationMode) => void;

  parentsWithOpposite: string[];
  setParentsWithOpposite: (ids: string[]) => void;
  addParentWithOpposite: (id: string) => void;

  importedBundles: ImportedBundleResult[];
  setImportedBundles: (bundles: ImportedBundleResult[]) => void;
  clearImportedBundles: () => void;
  reviewStatuses: Record<string, ReviewStatus>;
  setReviewStatus: (activityId: string, status: ReviewStatus) => void;

  activeSection: string;
  setActiveSection: (section: string) => void;
  setRubricScores: (scores: RubricScores) => void;

  resetSession: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setNestedValue(
  currentValue: unknown,
  pathSegments: string[],
  nextValue: unknown,
): unknown {
  const [segment, ...remainingSegments] = pathSegments;

  if (!segment) {
    return nextValue;
  }

  if (Array.isArray(currentValue)) {
    const index = Number(segment);
    const nextArray = [...currentValue];
    nextArray[index] = setNestedValue(
      nextArray[index],
      remainingSegments,
      nextValue,
    );
    return nextArray;
  }

  const nextObject = isRecord(currentValue) ? { ...currentValue } : {};
  nextObject[segment] = setNestedValue(
    nextObject[segment],
    remainingSegments,
    nextValue,
  );
  return nextObject;
}

function createEmptyDialogueBlock(): DialogueBlock {
  return {
    aiSays: "",
    childResponses: { ideal: "", unexpected: "", silent: "" },
    aiFollowUps: { ideal: "", unexpected: "", silent: "" },
    screenDescription: "",
  };
}

function cloneBundle(bundle: ActivityBundle): ActivityBundle {
  return JSON.parse(JSON.stringify(bundle)) as ActivityBundle;
}

// ---------------------------------------------------------------------------
// Cross-doc mirror — keep recap/dashboard previews fresh as the user edits
// tagBlock.activity_signature fields.
//
// The schema's superRefine enforces these mirrors at validate time; the
// editor surfaces recap/dashboard as read-only previews. Without this
// mirror, the previews would silently go stale every time the user changes
// the canonical observation_angle / mechanic / entity_role / focal_attribute
// — and re-evaluate would surface I8/I9/I10 violations from the user's
// perspective ("I never edited those!").
// ---------------------------------------------------------------------------

function mirrorTagBlockSignatureChange(
  bundle: ActivityBundle,
  path: string,
  value: unknown,
): ActivityBundle {
  // We only mirror string-valued single-leaf changes; bulk replacements of
  // activity_signature itself are out of scope (the user is doing surgery
  // and is expected to fix recap/dashboard manually).
  if (typeof value !== "string") return bundle;

  const next: ActivityBundle = JSON.parse(JSON.stringify(bundle));
  const sig = next.tagBlock.activity_signature;
  switch (path) {
    case "tagBlock.activity_signature.observation_angle":
      next.recap.payloadDefaults.whatWeNoticed =
        value as typeof sig.observation_angle;
      next.dashboard.session.angle = value as typeof sig.observation_angle;
      next.dashboard.contributesTo.curiosityRadial.angle =
        value as typeof sig.observation_angle;
      next.dashboard.contributesTo.explorationMatrix.cell = `${sig.mechanic} × ${value}`;
      for (const entry of Object.values(
        next.dashboard.contributesTo.keyConceptsExposure,
      )) {
        if (entry) entry.angle = value as typeof sig.observation_angle;
      }
      next.spec.identity.observationAngle = value as typeof sig.observation_angle;
      return next;
    case "tagBlock.activity_signature.mechanic":
      next.dashboard.session.mechanic = value as typeof sig.mechanic;
      next.dashboard.contributesTo.explorationMatrix.cell = `${value} × ${sig.observation_angle}`;
      next.spec.identity.mechanic = value as typeof sig.mechanic;
      return next;
    case "tagBlock.activity_signature.entity_role":
      next.recap.payloadDefaults.entityRole = value as typeof sig.entity_role;
      next.dashboard.session.entityRole = value as typeof sig.entity_role;
      next.spec.identity.entityRole = value as typeof sig.entity_role;
      return next;
    case "tagBlock.activity_signature.focal_attribute":
      next.dashboard.session.focalAttribute = value;
      return next;
    case "tagBlock.progression.topic_axis":
      next.dashboard.session.axis = value as typeof next.tagBlock.progression.topic_axis;
      next.dashboard.contributesTo.curiosityRadial.axis =
        value as typeof next.tagBlock.progression.topic_axis;
      return next;
    case "tagBlock.pillar":
      next.spec.identity.pillar = value as typeof next.tagBlock.pillar;
      return next;
    case "tagBlock.game_style":
      next.spec.identity.gameStyle = value;
      next.prod.basicInfo.gameStyle = value;
      return next;
    default:
      return bundle;
  }
}

function isProtectedDerivedPath(path: string): boolean {
  return (
    path === "recap" ||
    path === "dashboard" ||
    path.startsWith("recap.") ||
    path.startsWith("dashboard.")
  );
}

export const useDesignStore = create<DesignStore>()((set) => ({
  parsedEntity: null,
  setParsedEntity: (entity) => set({ parsedEntity: entity }),

  variants: [],
  setVariants: (variants) => set({ variants }),
  addVariant: (variant) =>
    set((state) => ({ variants: [...state.variants, variant] })),
  updateVariant: (id, update) =>
    set((state) => ({
      variants: state.variants.map((v) =>
        v.id === id ? { ...v, ...update } : v,
      ),
    })),

  activeBundle: null,
  activeDesignId: null,
  rubricScores: null,
  rubricIssues: [],
  rubricEvaluated: false,
  setActiveBundle: (id, bundle, scores, evaluated = true) =>
    set({
      activeDesignId: id,
      activeBundle: bundle,
      rubricScores: scores,
      rubricIssues: [],
      rubricEvaluated: evaluated,
    }),
  setRubricIssues: (issues) => set({ rubricIssues: issues }),

  updateField: (path, value) =>
    set((state) => {
      if (!state.activeBundle) return state;
      if (isProtectedDerivedPath(path)) {
        // Recap and dashboard are derived previews — block direct writes
        // and surface a warning so callers notice. Mirror updates from
        // tagBlock changes flow through the explicit mirror branch below.
        console.warn(
          `[design-store] Refusing to write derived path '${path}'. Edit the corresponding tagBlock field instead.`,
        );
        return state;
      }
      const updated = setNestedValue(
        state.activeBundle,
        path.split(/\.|\[|\]/).filter(Boolean),
        value,
      ) as ActivityBundle;
      return {
        activeBundle: mirrorTagBlockSignatureChange(updated, path, value),
      };
    }),
  addBridgeVariant: (stepIndex, variant) =>
    set((state) => {
      if (!state.activeBundle) return state;
      const step = state.activeBundle.prod.steps[stepIndex];
      if (!step || step.type !== "bridge" || step[variant]) return state;

      const activeBundle = cloneBundle(state.activeBundle);
      const nextStep = activeBundle.prod.steps[stepIndex];
      if (!nextStep || nextStep.type !== "bridge") return state;

      nextStep[variant] = createEmptyDialogueBlock();
      return { activeBundle };
    }),
  addRound: (stepIndex) =>
    set((state) => {
      if (!state.activeBundle) return state;
      const step = state.activeBundle.prod.steps[stepIndex];
      if (!step || step.type !== "rounds") return state;

      const activeBundle = cloneBundle(state.activeBundle);
      const nextStep = activeBundle.prod.steps[stepIndex];
      if (!nextStep || nextStep.type !== "rounds") return state;

      const rounds = nextStep.rounds ?? [];
      const nextRoundNumber =
        rounds.reduce(
          (highest, round) => Math.max(highest, round.roundNumber),
          0,
        ) + 1;
      nextStep.rounds = [
        ...rounds,
        { roundNumber: nextRoundNumber, dialogue: createEmptyDialogueBlock() },
      ];
      return { activeBundle };
    }),

  generationJobId: null,
  setGenerationJobId: (id) => set({ generationJobId: id }),

  generationMode: "mapping-informed",
  setGenerationMode: (mode) => set({ generationMode: mode }),

  parentsWithOpposite: [],
  setParentsWithOpposite: (ids) => set({ parentsWithOpposite: ids }),
  addParentWithOpposite: (id) =>
    set((state) =>
      state.parentsWithOpposite.includes(id)
        ? state
        : { parentsWithOpposite: [...state.parentsWithOpposite, id] },
    ),

  importedBundles: [],
  setImportedBundles: (bundles) => set({ importedBundles: bundles }),
  clearImportedBundles: () => set({ importedBundles: [], reviewStatuses: {} }),
  reviewStatuses: {},
  setReviewStatus: (activityId, status) =>
    set((state) => ({
      reviewStatuses: {
        ...state.reviewStatuses,
        [activityId]: status,
      },
    })),

  activeSection: "spec",
  setActiveSection: (section) => set({ activeSection: section }),
  // Updating scores from a real evaluate response always flips the
  // evaluated flag — that's the whole point of the call.
  setRubricScores: (scores) =>
    set({ rubricScores: scores, rubricEvaluated: true }),

  resetSession: () =>
    set({
      parsedEntity: null,
      variants: [],
      activeBundle: null,
      activeDesignId: null,
      rubricScores: null,
      rubricIssues: [],
      rubricEvaluated: false,
      generationJobId: null,
      generationMode: "mapping-informed",
      parentsWithOpposite: [],
      reviewStatuses: {},
      activeSection: "spec",
    }),
}));
