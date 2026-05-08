import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { RubricIssue, RubricScores } from "@/lib/design-schema";

// ---------------------------------------------------------------------------
// Deterministic rubric pre-checks
// ---------------------------------------------------------------------------
//
// These checks run BEFORE the LLM-based rubric evaluation. When a
// deterministic check fails, the corresponding dimension is marked `fail`
// without calling the LLM for that dimension, and an issue is injected so
// the fix pass has something to act on.
//
// Keep this module framework-free: pure functions over `ActivityBundle`, no
// Next.js, no filesystem, no LLM provider.

// ---------------------------------------------------------------------------
// D4 — IB Completeness: closing step must name at least one core IB key concept
// ---------------------------------------------------------------------------

export interface D4CheckResult {
  pass: boolean;
  reason?: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase();
}

/**
 * Verify the bundle's `prod` closing step carries a non-empty
 * `conceptReinforcement` whose text contains a case-insensitive,
 * word-boundary match of at least one entry in
 * `prod.basicInfo.coreIbKeyConcepts`.
 *
 * Known limitation: morphological variants ("change" vs "changing") are not
 * handled — only word-boundary matches count. Stemming is out of scope for v1.
 */
export function checkD4Deterministic(bundle: ActivityBundle): D4CheckResult {
  const closing = bundle.prod.steps.find((step) => step.type === "closing");

  if (!closing) {
    return {
      pass: false,
      reason: "D4 pre-check failed: bundle has no closing step.",
    };
  }

  const reinforcement = closing.conceptReinforcement?.trim() ?? "";
  if (reinforcement.length === 0) {
    return {
      pass: false,
      reason:
        "D4 pre-check failed: closing step is missing conceptReinforcement (required to explicitly name at least one core IB key concept).",
    };
  }

  const concepts = bundle.prod.basicInfo.coreIbKeyConcepts.filter(
    (c) => c.trim().length > 0,
  );

  if (concepts.length === 0) {
    return {
      pass: false,
      reason:
        "D4 pre-check failed: bundle has no coreIbKeyConcepts to reinforce in the closing step.",
    };
  }

  const haystack = normalize(reinforcement);
  const matched = concepts.some((concept) => {
    const normalized = normalize(concept.trim());
    if (normalized.length === 0) return false;
    return new RegExp(`\\b${escapeRegex(normalized)}\\b`, "u").test(haystack);
  });

  if (!matched) {
    return {
      pass: false,
      reason: `D4 pre-check failed: closing step's conceptReinforcement does not mention any core IB key concept (expected one of: ${concepts.join(", ")}).`,
    };
  }

  return { pass: true };
}

// ---------------------------------------------------------------------------
// Apply the D4 deterministic override to an LLM-produced evaluate result
// ---------------------------------------------------------------------------

export function applyD4Override(
  scores: RubricScores,
  issues: RubricIssue[],
  bundle: ActivityBundle,
): { scores: RubricScores; issues: RubricIssue[] } {
  const check = checkD4Deterministic(bundle);
  if (check.pass) {
    return { scores, issues };
  }

  const nextScores: RubricScores = { ...scores, d4: "fail" };
  const filteredIssues = issues.filter(
    (issue) => issue.dimension.toLowerCase() !== "d4",
  );
  const nextIssues: RubricIssue[] = [
    ...filteredIssues,
    {
      dimension: "d4",
      description: check.reason ?? "D4 pre-check failed.",
    },
  ];

  return { scores: nextScores, issues: nextIssues };
}
