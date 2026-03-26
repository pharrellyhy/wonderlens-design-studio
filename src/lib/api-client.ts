import type { GameDesign, GenerationJob, RubricScores, RubricIssue } from "./design-schema";
import type { LLMProviderType } from "./llm/provider";
import type { ParsedEntity } from "./yaml-parser";

// ── Param / Result interfaces ───────────────────────────────────────────────

export interface GenerateParams {
  entityYaml: string;
  variantConfigs?: Array<{ category: string; gameStyle: string }>;
  llmProvider: LLMProviderType;
  apiKey: string;
}

export interface EvaluateParams {
  design: GameDesign;
  llmProvider: LLMProviderType;
  apiKey: string;
}

export interface EvaluationResult {
  rubricScores: RubricScores;
  issues: RubricIssue[];
}

export interface RegenerateParams {
  design: GameDesign;
  fieldPath: string;
  comment: string;
  llmProvider: LLMProviderType;
  apiKey: string;
}

export interface ExportParams {
  design: GameDesign;
  format: "spec" | "prod" | "both";
}

export interface ExportResult {
  specMd?: string;
  prodMd?: string;
}

// ── Helper ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const body = await response.json();
      errorMessage = body.error ?? body.message ?? response.statusText;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ── API functions ───────────────────────────────────────────────────────────

export async function uploadYaml(file: File): Promise<ParsedEntity> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<ParsedEntity>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export async function startGeneration(params: GenerateParams): Promise<string> {
  const data = await apiFetch<{ jobId: string }>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  return data.jobId;
}

export async function pollGenerationStatus(jobId: string): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/api/generate/${jobId}/status`);
}

export async function evaluateDesign(params: EvaluateParams): Promise<EvaluationResult> {
  return apiFetch<EvaluationResult>("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function regenerateField(params: RegenerateParams): Promise<unknown> {
  const data = await apiFetch<{ updatedValue: unknown }>("/api/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  return data.updatedValue;
}

export async function exportDesign(params: ExportParams): Promise<ExportResult> {
  return apiFetch<ExportResult>("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
