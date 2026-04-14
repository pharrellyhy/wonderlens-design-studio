import { PILLAR_LABELS, type ExperiencePillar } from "@/lib/design-schema";

interface PillarPillProps {
  pillar: ExperiencePillar;
  className?: string;
}

const PILLAR_COLOR: Record<ExperiencePillar, string> = {
  mystery:     "bg-violet-900/50 text-violet-300",
  creation:    "bg-amber-900/50 text-amber-300",
  performance: "bg-pink-900/50 text-pink-300",
  discovery:   "bg-cyan-900/50 text-cyan-300",
  adventure:   "bg-emerald-900/50 text-emerald-300",
  nurture:     "bg-rose-900/50 text-rose-300",
};

// Shared experience-pillar pill — renders the pillar name (e.g. "Mystery")
// as a coloured tag with a tooltip showing the full pillar label. Used in the
// gallery card and the editor header.
export function PillarPill({ pillar, className = "" }: PillarPillProps) {
  const label = pillar[0].toUpperCase() + pillar.slice(1);
  const colorClass = PILLAR_COLOR[pillar];

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass} ${className}`}
      title={PILLAR_LABELS[pillar]}
    >
      {label}
    </span>
  );
}
