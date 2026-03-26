"use client";

import type { GameDesign } from "@/lib/design-schema";

interface NavigationPanelProps {
  design: GameDesign;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function getStepIcon(stepType: GameDesign["steps"][number]["type"]): string {
  switch (stepType) {
    case "bridge":
      return "🌉";
    case "rules":
      return "📖";
    case "rounds":
      return "🔄";
    case "celebration":
      return "🎉";
    case "closing":
      return "👋";
  }
}

export function NavigationPanel({
  design,
  activeSection,
  onSectionChange,
}: NavigationPanelProps) {
  const sections = [
    { id: "basicInfo", label: "📋 Basic Info", indent: 0 },
    { id: "overview", label: "🎯 Overview & KUD", indent: 0 },
    { id: "creativeVariables", label: "🎨 Creative Variables", indent: 0 },
  ];

  // Add steps
  for (const step of design.steps) {
    sections.push({
      id: `step-${step.stepNumber}`,
      label: `${getStepIcon(step.type)} Step ${step.stepNumber}: ${step.title}`,
      indent: 0,
    });

    // Sub-items for bridge (warm/cold)
    if (step.type === "bridge") {
      sections.push({
        id: `step-${step.stepNumber}-warm`,
        label: "Step 1a: Warm Start",
        indent: 1,
      });
      sections.push({
        id: `step-${step.stepNumber}-cold`,
        label: "Step 1b: Cold Start",
        indent: 1,
      });
    }

    // Sub-items for rounds
    if (step.type === "rounds" && step.rounds) {
      for (const round of step.rounds) {
        sections.push({
          id: `step-${step.stepNumber}-round-${round.roundNumber}`,
          label: `Round ${round.roundNumber}`,
          indent: 1,
        });
      }
    }
  }

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white text-sm font-semibold truncate">
          {design.basicInfo.activityName}
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          {design.basicInfo.category === "cat1" ? "Cat 1" : "Cat 5"} ·{" "}
          {design.basicInfo.gameStyle} · {design.basicInfo.tier}
        </p>
      </div>

      {/* Navigation items */}
      <div className="py-2">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`
                w-full text-left text-sm py-2 transition-colors
                ${section.indent === 1 ? "pl-10 text-xs" : "pl-4"}
                ${
                  isActive
                    ? "bg-indigo-900/30 border-l-[3px] border-indigo-500 text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-l-[3px] border-transparent"
                }
              `}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
