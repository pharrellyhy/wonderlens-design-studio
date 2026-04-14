import type { GenerationMode } from "@/lib/design-schema";

interface ModePillProps {
  mode: GenerationMode | string;
  className?: string;
}

// Shared mode pill — renders the blue "mapping" / grey "freeform" tag used
// across the gallery card, library table/grid, and editor header. Single
// source of truth for the styling so visual drift doesn't creep back in.
export function ModePill({ mode, className = "" }: ModePillProps) {
  const isMapping = mode === "mapping-informed";
  const colorClass = isMapping
    ? "bg-blue-900/60 text-blue-300"
    : "bg-gray-700 text-gray-300";
  const label = isMapping ? "mapping" : "freeform";
  const title = isMapping
    ? "Generated with tier guidance + entity dimensions"
    : "Generated freeform; tier guidance is a loose preference";

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass} ${className}`}
      title={title}
    >
      {label}
    </span>
  );
}
