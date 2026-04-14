import type {
  GameDesign,
  RubricIssue,
  RubricScores,
} from "@/lib/design-schema";

// ---------------------------------------------------------------------------
// Deterministic rubric pre-checks
// ---------------------------------------------------------------------------
//
// These checks run BEFORE the LLM-based rubric evaluation. When a
// deterministic check fails, the corresponding dimension is marked `fail`
// without calling the LLM for that dimension, and an issue is injected so
// the fix pass has something to act on.
//
// Keep this module framework-free: pure functions over `GameDesign`, no
// Next.js, no filesystem, no LLM provider.

// ---------------------------------------------------------------------------
// D4 — IB Completeness: closing step must name at least one coreKeyConcept
// ---------------------------------------------------------------------------

export interface D4CheckResult {
  pass: boolean;
  reason?: string;
}

/**
 * Escape regex metacharacters so a user-supplied concept string can be
 * embedded safely inside a `\b...\b` match.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize strings for comparison: NFKC Unicode normalization (so visually
 * identical glyphs compare equal) plus lowercasing.
 */
function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase();
}

/**
 * Deterministically verify that the design's `closing` step carries a
 * non-empty `conceptReinforcement` field whose text contains a
 * case-insensitive, word-boundary match of at least one entry in
 * `basicInfo.coreKeyConcepts`.
 *
 * Returns `{ pass: true }` on success. On failure, `reason` explains which
 * sub-check failed so the caller can surface it as a rubric issue for the fix
 * pass.
 *
 * Known limitation: morphological variants like "change" vs "changing" are
 * not handled — only exact word-boundary matches count. Stemming is out of
 * scope for v1.
 */
export function checkD4Deterministic(design: GameDesign): D4CheckResult {
  const closing = design.steps.find((step) => step.type === "closing");

  if (!closing) {
    return {
      pass: false,
      reason: "D4 pre-check failed: design has no closing step.",
    };
  }

  const reinforcement = closing.conceptReinforcement?.trim() ?? "";
  if (reinforcement.length === 0) {
    return {
      pass: false,
      reason:
        "D4 pre-check failed: closing step is missing conceptReinforcement (required to explicitly name at least one coreKeyConcept).",
    };
  }

  // Defensive: drop any empty/whitespace-only concept entries before matching.
  const concepts = design.basicInfo.coreKeyConcepts.filter(
    (c) => c.trim().length > 0,
  );

  if (concepts.length === 0) {
    return {
      pass: false,
      reason:
        "D4 pre-check failed: design has no coreKeyConcepts to reinforce in the closing step.",
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
      reason: `D4 pre-check failed: closing step's conceptReinforcement does not mention any coreKeyConcept (expected one of: ${concepts.join(", ")}).`,
    };
  }

  return { pass: true };
}

// ---------------------------------------------------------------------------
// Apply the D4 deterministic override to an LLM-produced evaluate result
// ---------------------------------------------------------------------------

/**
 * Given the scores/issues returned by the LLM evaluate pass, apply the D4
 * deterministic pre-check: if it fails, override `scores.d4` to `"fail"` and
 * append (or replace) a matching issue describing the failure. If it passes,
 * the inputs are returned unchanged.
 *
 * Does NOT mutate its arguments — returns new objects so callers can swap
 * them in without worrying about shared references.
 */
export function applyD4Override(
  scores: RubricScores,
  issues: RubricIssue[],
  design: GameDesign,
): { scores: RubricScores; issues: RubricIssue[] } {
  const check = checkD4Deterministic(design);
  if (check.pass) {
    return { scores, issues };
  }

  const nextScores: RubricScores = { ...scores, d4: "fail" };

  // Drop any existing d4 issue from the LLM (it may have passed d4 and so
  // added nothing, or it may have flagged something different) and inject our
  // deterministic reason so the fix pass targets the real problem.
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
