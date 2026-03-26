import { create } from "zustand";
import type { GameDesign, RubricScores } from "@/lib/design-schema";
import type { ParsedEntity } from "@/lib/yaml-parser";

export interface DesignVariant {
  id: string;
  design: GameDesign;
  rubricScores: RubricScores;
  isGenerating: boolean;
  error?: string;
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
  setActiveDesign: (id: string, design: GameDesign, scores: RubricScores) => void;

  // Update a field in the active design by path
  updateField: (path: string, value: unknown) => void;

  // Generation job tracking
  generationJobId: string | null;
  setGenerationJobId: (id: string | null) => void;

  // UI state
  activeSection: string;
  setActiveSection: (section: string) => void;
  setRubricScores: (scores: RubricScores) => void;
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

export const useDesignStore = create<DesignStore>((set) => ({
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
  setActiveDesign: (id, design, scores) =>
    set({ activeDesignId: id, activeDesign: design, rubricScores: scores }),

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

  activeSection: "basicInfo",
  setActiveSection: (section) => set({ activeSection: section }),
  setRubricScores: (scores) => set({ rubricScores: scores }),
}));
