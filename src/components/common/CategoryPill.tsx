import { CATEGORY_LABELS } from "@/lib/design-schema";

interface CategoryPillProps {
  category: string;
  // When true, render the human-readable label from CATEGORY_LABELS
  // ("Cat 1 — In-Device" etc.). When false, render the raw key ("cat1").
  // Library views show the short key; the gallery shows the long label.
  useLabel?: boolean;
  className?: string;
}

// Shared category pill — indigo for cat1, green for cat5. Used across the
// gallery card, library table, and library grid. Keeps colors consistent
// even when one call site decides to render the long label vs the short key.
export function CategoryPill({
  category,
  useLabel = false,
  className = "",
}: CategoryPillProps) {
  const colorClass =
    category === "cat1"
      ? "bg-indigo-900/50 text-indigo-300"
      : "bg-green-900/50 text-green-300";

  let display = category;
  if (useLabel && category in CATEGORY_LABELS) {
    display = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
  }

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass} ${className}`}
    >
      {display}
    </span>
  );
}
