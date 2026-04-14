import { create } from "zustand";
import type {
  GameDesign,
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
  design?: GameDesign;
  rubricScores?: RubricScores;
  error?: string;
  // When set, this variant was generated as the opposite category of
  // another variant in the same gallery. Populated client-side at dispatch
  // time — the in-memory VariantResult pushed by the poller does not carry
  // parent info, so we stitch it in via `addVariant(..., { parentDesignId })`.
  parentDesignId?: string;
}

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
  activeDesign: GameDesign | null;
  activeDesignId: string | null;
  rubricScores: RubricScores | null;
  rubricIssues: RubricIssue[];
  setActiveDesign: (id: string, design: GameDesign, scores: RubricScores) => void;
  setRubricIssues: (issues: RubricIssue[]) => void;

  // Update a field in the active design by path
  updateField: (path: string, value: unknown) => void;

  // Generation job tracking
  generationJobId: string | null;
  setGenerationJobId: (id: string | null) => void;

  // Generation mode (mapping-informed vs freeform). Session-only — not
  // persisted so it defaults fresh each visit. Threaded into POST /api/generate.
  generationMode: GenerationMode;
  setGenerationMode: (mode: GenerationMode) => void;

  // Set of parent designIds that already have a persisted opposite on disk.
  // Populated on gallery mount via GET /api/runs/opposites and updated when
  // an opposite-generation job completes. Disables the "Generate opposite"
  // button on cards whose parent is already in this set.
  parentsWithOpposite: string[];
  setParentsWithOpposite: (ids: string[]) => void;
  addParentWithOpposite: (id: string) => void;

  // UI state
  activeSection: string;
  setActiveSection: (section: string) => void;
  setRubricScores: (scores: RubricScores) => void;

  // Reset everything tied to the current upload session.
  resetSession: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setNestedValue(
  currentValue: unknown,
  pathSegments: string[],
  nextValue: unknown
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
      nextValue
    );
    return nextArray;
  }

  const nextObject = isRecord(currentValue) ? { ...currentValue } : {};
  nextObject[segment] = setNestedValue(
    nextObject[segment],
    remainingSegments,
    nextValue
  );
  return nextObject;
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
        v.id === id ? { ...v, ...update } : v
      ),
    })),

  activeDesign: null,
  activeDesignId: null,
  rubricScores: null,
  rubricIssues: [],
  setActiveDesign: (id, design, scores) =>
    set({
      activeDesignId: id,
      activeDesign: design,
      rubricScores: scores,
      rubricIssues: [],
    }),
  setRubricIssues: (issues) => set({ rubricIssues: issues }),

  updateField: (path, value) =>
    set((state) => {
      if (!state.activeDesign) return state;
      return {
        activeDesign: setNestedValue(
          state.activeDesign,
          path.split("."),
          value
        ) as GameDesign,
      };
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

  activeSection: "basicInfo",
  setActiveSection: (section) => set({ activeSection: section }),
  setRubricScores: (scores) => set({ rubricScores: scores }),

  resetSession: () =>
    set({
      parsedEntity: null,
      variants: [],
      activeDesign: null,
      activeDesignId: null,
      rubricScores: null,
      rubricIssues: [],
      generationJobId: null,
      generationMode: "mapping-informed",
      parentsWithOpposite: [],
      activeSection: "basicInfo",
    }),
}));
