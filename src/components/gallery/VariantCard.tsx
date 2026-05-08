"use client";

import { ArrowLeftRight, Award, Crosshair, Layers } from "lucide-react";

import {
  TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR,
  type ActivityBundle,
} from "@/lib/activity-bundle-schema";
import {
  RUBRIC_DIMENSIONS,
  RUBRIC_DIMENSION_COUNT,
  RUBRIC_DIMENSION_KEYS,
  type RubricScores,
} from "@/lib/design-schema";
import { CategoryPill } from "@/components/common/CategoryPill";
import { ModePill } from "@/components/common/ModePill";
import { PillarPill } from "@/components/common/PillarPill";

interface VariantCardProps {
  id: string;
  status: "pending" | "complete" | "failed";
  category: string;
  gameStyle: string;
  bundle?: ActivityBundle;
  rubricScores?: RubricScores;
  error?: string;
  parentDesignId?: string;
  hasOpposite: boolean;
  oppositeBusy: boolean;
  onClick: () => void;
  onGenerateOpposite: (designId: string) => void;
}

function gameStyleTagClass(category: string): string {
  return category === "cat1"
    ? "bg-indigo-900/50 text-indigo-300"
    : "bg-green-900/50 text-green-300";
}

export function VariantCard({
  id,
  status,
  category,
  gameStyle,
  bundle,
  rubricScores,
  error,
  parentDesignId,
  hasOpposite,
  oppositeBusy,
  onClick,
  onGenerateOpposite,
}: VariantCardProps) {
  const gameStyleClass = gameStyleTagClass(category);
  const generationMode = bundle?.generationMode;
  const lowerPillar = bundle
    ? TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR[bundle.tagBlock.pillar]
    : null;

  // ── Pending placeholder ────────────────────────────────────────────────
  if (status === "pending" || (status === "complete" && !bundle)) {
    return (
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 min-h-[220px] flex flex-col">
        <div className="flex gap-1.5 flex-wrap mb-4">
          <CategoryPill category={category} useLabel />
          <span className={`px-2 py-0.5 rounded text-xs ${gameStyleClass}`}>
            {gameStyle}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative w-10 h-10 mb-3">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-400 border-r-indigo-400/60 animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">Generating…</p>
          <p className="text-gray-600 text-xs mt-1">
            Multi-pass quality pipeline
          </p>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────
  if (status === "failed" || !bundle || !rubricScores) {
    return (
      <div className="bg-gray-800 border border-red-800/60 rounded-xl p-5 min-h-[220px] flex flex-col">
        <div className="flex gap-1.5 flex-wrap mb-3">
          <CategoryPill category={category} useLabel />
          <span className={`px-2 py-0.5 rounded text-xs ${gameStyleClass}`}>
            {gameStyle}
          </span>
        </div>
        <p className="text-red-400 text-sm font-semibold mb-1">
          Generation failed
        </p>
        <p className="text-red-300/80 text-xs leading-relaxed whitespace-pre-wrap">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────
  const passCount = Object.values(rubricScores).filter(
    (score) => score === "pass",
  ).length;
  const allPass = passCount === RUBRIC_DIMENSION_COUNT;

  const sig = bundle.tagBlock.activity_signature;
  const focalAttribute = sig.focal_attribute;
  const exploration = `${sig.mechanic} × ${sig.observation_angle}`;
  const rewardHook = bundle.tagBlock.progression.reward_hook ?? "—";

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border-2 border-transparent hover:border-blue-600 rounded-xl p-5 cursor-pointer transition-all"
    >
      {/* Tags */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-1.5 flex-wrap">
          <CategoryPill category={category} useLabel />
          <span className={`px-2 py-0.5 rounded text-xs ${gameStyleClass}`}>
            {gameStyle}
          </span>
          {generationMode && <ModePill mode={generationMode} />}
          {lowerPillar && <PillarPill pillar={lowerPillar} />}
          {parentDesignId && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium bg-orange-900/50 text-orange-300"
              title="Generated as opposite category of another variant in this gallery"
            >
              opposite
            </span>
          )}
        </div>
        <span
          className={`text-xs font-semibold ${
            allPass ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {passCount}/{RUBRIC_DIMENSION_COUNT} PASS
        </span>
      </div>

      {/* Title + description */}
      <h4 className="text-white font-semibold mb-2">
        {bundle.prod.basicInfo.activityName}
      </h4>
      <p className="text-gray-400 text-sm leading-relaxed mb-3">
        {bundle.prod.overview.briefDescription}
      </p>

      {/* TagBlock signature highlights */}
      <div className="text-xs text-gray-500 space-y-1.5">
        <div className="flex items-start gap-2">
          <Crosshair className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-400/70" />
          <span>
            <span className="text-gray-400 font-medium">Focal: </span>
            {focalAttribute}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Layers className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400/70" />
          <span>
            <span className="text-gray-400 font-medium">Cell: </span>
            {exploration}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Award className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400/70" />
          <span>
            <span className="text-gray-400 font-medium">Reward: </span>
            {rewardHook}
          </span>
        </div>
      </div>

      {/* Rubric score bar */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {RUBRIC_DIMENSION_KEYS.map((dim) => (
          <span
            key={dim}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
              rubricScores[dim] === "pass"
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
            title={RUBRIC_DIMENSIONS[dim]}
          >
            {dim}
          </span>
        ))}
      </div>

      {/* Action row */}
      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (hasOpposite || oppositeBusy) return;
            onGenerateOpposite(id);
          }}
          disabled={hasOpposite || oppositeBusy}
          title={
            hasOpposite
              ? "This variant already has an opposite in the gallery"
              : oppositeBusy
                ? "Opposite generation in progress"
                : "Generate the opposite-category counterpart"
          }
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-300 disabled:hover:border-gray-700 transition-colors"
        >
          <ArrowLeftRight className="w-3 h-3" />
          {oppositeBusy ? "Generating..." : "Generate opposite"}
        </button>
      </div>
    </div>
  );
}
