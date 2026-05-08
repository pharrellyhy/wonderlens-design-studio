"use client";

import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileText,
  Hand,
  type LucideIcon,
  LayoutGrid,
  PartyPopper,
  RefreshCw,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { Step } from "@/lib/design-schema";

interface NavigationPanelProps {
  bundle: ActivityBundle;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function getStepIcon(stepType: Step["type"]): LucideIcon {
  switch (stepType) {
    case "bridge":
      return ArrowRight;
    case "rules":
      return BookOpen;
    case "rounds":
      return RefreshCw;
    case "celebration":
      return PartyPopper;
    case "closing":
      return Hand;
  }
}

export interface SectionEntry {
  id: string;
  label: string;
  indent: number;
  Icon?: LucideIcon;
  group?: string;
}

function stepLabel(step: Step): string {
  if (step.type !== "rounds") {
    return `Step ${step.stepNumber}: ${step.title}`;
  }

  const roundCount = step.rounds?.length ?? 0;
  const roundLabel = roundCount === 1 ? "1 round" : `${roundCount} rounds`;
  const title = step.title
    .replace(/\s*\(\s*\d+\s+rounds?\s*\)\s*$/i, "")
    .trim();
  return `Step ${step.stepNumber}: ${title} (${roundLabel})`;
}

export function buildNavigationSections(bundle: ActivityBundle): SectionEntry[] {
  const sections: SectionEntry[] = [
    {
      id: "spec",
      label: "Authoring Spec",
      indent: 0,
      Icon: FileText,
      group: "Spec",
    },
    {
      id: "prod-basic",
      label: "Basic Info",
      indent: 0,
      Icon: ClipboardList,
      group: "Prod",
    },
    {
      id: "prod-overview",
      label: "Overview & KUD",
      indent: 0,
      Icon: Target,
      group: "Prod",
    },
    {
      id: "prod-attributes",
      label: "Entity Attributes (A.1)",
      indent: 0,
      Icon: LayoutGrid,
      group: "Prod",
    },
    {
      id: "prod-constellation",
      label: "Constellation (A.2)",
      indent: 0,
      Icon: Sparkles,
      group: "Prod",
    },
  ];

  for (const step of bundle.prod.steps) {
    sections.push({
      id: `step-${step.stepNumber}`,
      label: stepLabel(step),
      indent: 0,
      Icon: getStepIcon(step.type),
      group: "Prod · Steps",
    });

    if (step.type === "bridge") {
      if (step.warmStart) {
        sections.push({
          id: `step-${step.stepNumber}-warm`,
          label: "Warm Start",
          indent: 1,
          group: "Prod · Steps",
        });
      }
      if (step.coldStart) {
        sections.push({
          id: `step-${step.stepNumber}-cold`,
          label: "Cold Start",
          indent: 1,
          group: "Prod · Steps",
        });
      }
    }

    if (step.type === "rounds" && step.rounds) {
      for (const round of step.rounds) {
        sections.push({
          id: `step-${step.stepNumber}-round-${round.roundNumber}`,
          label: `Round ${round.roundNumber}`,
          indent: 1,
          group: "Prod · Steps",
        });
      }
    }
  }

  sections.push(
    {
      id: "tagBlock",
      label: "Tag Block",
      indent: 0,
      Icon: Tag,
      group: "TagBlock",
    },
    {
      id: "recap-preview",
      label: "Recap (preview)",
      indent: 0,
      Icon: FileText,
      group: "Derived",
    },
    {
      id: "dashboard-preview",
      label: "Dashboard (preview)",
      indent: 0,
      Icon: LayoutGrid,
      group: "Derived",
    },
  );

  return sections;
}

export function NavigationPanel({
  bundle,
  activeSection,
  onSectionChange,
}: NavigationPanelProps) {
  const sections = buildNavigationSections(bundle);

  // Group section entries by their `group` label so the panel renders
  // a small sticky header per section family. Order is preserved from the
  // source array.
  const grouped: Array<{ name: string; items: SectionEntry[] }> = [];
  for (const entry of sections) {
    const groupName = entry.group ?? "";
    const last = grouped[grouped.length - 1];
    if (!last || last.name !== groupName) {
      grouped.push({ name: groupName, items: [entry] });
    } else {
      last.items.push(entry);
    }
  }

  return (
    <div className="w-60 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white text-sm font-semibold truncate">
          {bundle.prod.basicInfo.activityName}
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          {bundle.prod.basicInfo.activityCategory === "cat1" ? "Cat 1" : "Cat 5"}{" "}
          · {bundle.tagBlock.game_style} ·{" "}
          {bundle.prod.basicInfo.recommendedTier}
        </p>
      </div>

      <div className="py-2">
        {grouped.map((group) => (
          <div key={group.name} className="mb-2">
            {group.name && (
              <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-gray-600">
                {group.name}
              </div>
            )}
            {group.items.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.Icon;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`
                    w-full text-left text-sm py-2 inline-flex items-center gap-2 transition-colors
                    ${section.indent === 1 ? "pl-10 text-xs" : "pl-4"}
                    ${
                      isActive
                        ? "bg-indigo-900/30 border-l-[3px] border-indigo-500 text-white"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-l-[3px] border-transparent"
                    }
                  `}
                >
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? "text-indigo-400" : "text-gray-500"
                      }`}
                    />
                  )}
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
