import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameDesign, RubricIssue, RubricScores } from "@/lib/design-schema";
import type { LLMProviderType } from "@/lib/llm/provider";
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
  rubricIssues: RubricIssue[];
  setActiveDesign: (id: string, design: GameDesign, scores: RubricScores) => void;
  setRubricIssues: (issues: RubricIssue[]) => void;

  // Update a field in the active design by path
  updateField: (path: string, value: unknown) => void;

  // Generation job tracking
  generationJobId: string | null;
  setGenerationJobId: (id: string | null) => void;

  // LLM config
  llmProvider: LLMProviderType;
  apiKeys: Record<LLMProviderType, string>;
  setLlmProvider: (provider: LLMProviderType) => void;
  setApiKey: (provider: LLMProviderType, apiKey: string) => void;

  // UI state
  activeSection: string;
  setActiveSection: (section: string) => void;
  setRubricScores: (scores: RubricScores) => void;

  // Reset everything tied to the current upload session.
  // Leaves persisted LLM config (llmProvider, apiKeys) untouched.
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

export const useDesignStore = create<DesignStore>()(
  persist(
    (set) => ({
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

      llmProvider: "anthropic",
      apiKeys: { openai: "", anthropic: "", "openai-compatible": "" },
      setLlmProvider: (provider) => set({ llmProvider: provider }),
      setApiKey: (provider, apiKey) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: apiKey },
        })),

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
          activeSection: "basicInfo",
        }),
    }),
    {
      name: "design-studio-store",
      version: 2,
      partialize: (state) => ({
        llmProvider: state.llmProvider,
        apiKeys: state.apiKeys,
      }),
      migrate: (persistedState, fromVersion) => {
        // v1 had a single `apiKey` string. Drop it: it bled across providers
        // and caused stale keys (e.g. an OpenAI key) to be sent when the user
        // switched to a different provider.
        const empty = { openai: "", anthropic: "", "openai-compatible": "" };
        if (fromVersion < 2 && isRecord(persistedState)) {
          const provider =
            (persistedState as { llmProvider?: LLMProviderType }).llmProvider ??
            "anthropic";
          return { llmProvider: provider, apiKeys: empty };
        }
        return persistedState as {
          llmProvider: LLMProviderType;
          apiKeys: Record<LLMProviderType, string>;
        };
      },
    }
  )
);
