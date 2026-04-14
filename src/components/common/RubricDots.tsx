import {
  RUBRIC_DIMENSIONS,
  type RubricScores,
} from "@/lib/design-schema";

interface RubricDotsProps {
  rubric: RubricScores;
  className?: string;
}

const RUBRIC_KEYS = Object.keys(RUBRIC_DIMENSIONS) as Array<
  keyof typeof RUBRIC_DIMENSIONS
>;

// Shared D1–D10 dot strip — ten green/red circles for the rubric pass/fail
// state, with hover titles. Used by the library table and grid; the gallery
// card uses its own labelled-pill variant (D1, D2, ...) so it isn't shared.
export function RubricDots({ rubric, className = "" }: RubricDotsProps) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {RUBRIC_KEYS.map((k) => (
        <span
          key={k}
          title={`${k.toUpperCase()} — ${RUBRIC_DIMENSIONS[k]}: ${rubric[k]}`}
          className={`block w-2.5 h-2.5 rounded-full ${
            rubric[k] === "pass" ? "bg-green-500/80" : "bg-red-500/80"
          }`}
        />
      ))}
    </div>
  );
}
