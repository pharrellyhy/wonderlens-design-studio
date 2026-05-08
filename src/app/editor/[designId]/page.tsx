"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  LayoutGrid,
  Plus,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";

import { useDesignStore } from "@/store/design-store";
import {
  evaluateDesign,
  exportDesign,
  regenerateField,
} from "@/lib/api-client";
import {
  TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR,
} from "@/lib/activity-bundle-schema";
import { NavigationPanel } from "@/components/editor/NavigationPanel";
import { ScorecardPanel } from "@/components/editor/ScorecardPanel";
import { EditableField } from "@/components/editor/EditableField";
import { DialogueBlockEditor } from "@/components/editor/DialogueBlock";
import { TagBlockPanel } from "@/components/editor/TagBlockPanel";
import { RecapPreview } from "@/components/editor/RecapPreview";
import { DashboardPreview } from "@/components/editor/DashboardPreview";
import { ModePill } from "@/components/common/ModePill";
import { PillarPill } from "@/components/common/PillarPill";

export default function EditorPage() {
  const router = useRouter();
  const activeBundle = useDesignStore((s) => s.activeBundle);
  const rubricScores = useDesignStore((s) => s.rubricScores);
  const rubricIssues = useDesignStore((s) => s.rubricIssues);
  const rubricEvaluated = useDesignStore((s) => s.rubricEvaluated);
  const activeSection = useDesignStore((s) => s.activeSection);
  const setActiveSection = useDesignStore((s) => s.setActiveSection);
  const updateField = useDesignStore((s) => s.updateField);
  const setRubricScores = useDesignStore((s) => s.setRubricScores);
  const setRubricIssues = useDesignStore((s) => s.setRubricIssues);
  const addBridgeVariant = useDesignStore((s) => s.addBridgeVariant);
  const addRound = useDesignStore((s) => s.addRound);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const autoEvalFiredRef = useRef(false);

  // Auto-trigger rubric evaluation when an unrated bundle is loaded
  // (typically: the user just dropped a ZIP/folder via ExistingDesignImporter
  // and the importer seeded all-fail by design). Hook MUST live before any
  // early return — its ordering across renders is what React relies on.
  useEffect(() => {
    if (!activeBundle) return;
    if (rubricEvaluated) return;
    if (isEvaluating) return;
    if (autoEvalFiredRef.current) return;
    autoEvalFiredRef.current = true;
    void (async () => {
      setIsEvaluating(true);
      setEvalError(null);
      try {
        const result = await evaluateDesign({ bundle: activeBundle });
        setRubricScores(result.rubricScores);
        setRubricIssues(result.issues);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Evaluation failed";
        console.error("Failed to evaluate bundle on auto-trigger:", error);
        setEvalError(message);
      } finally {
        setIsEvaluating(false);
      }
    })();
  }, [
    activeBundle,
    rubricEvaluated,
    isEvaluating,
    setRubricScores,
    setRubricIssues,
  ]);

  if (!activeBundle || !rubricScores) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            No bundle loaded. Please select a variant first.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const handleStringFieldChange = (path: string, value: string) =>
    updateField(path, value);

  const handleAskAI = async (path: string, comment: string) => {
    if (!activeBundle) return;
    try {
      const updatedValue = await regenerateField({
        bundle: activeBundle,
        fieldPath: path,
        comment: comment || "Please improve this",
      });
      updateField(path, updatedValue);
    } catch (error) {
      console.error("Failed to regenerate field:", error);
    }
  };

  const handleRerunRubric = async () => {
    if (!activeBundle) return;
    setIsEvaluating(true);
    setEvalError(null);
    try {
      const result = await evaluateDesign({ bundle: activeBundle });
      setRubricScores(result.rubricScores);
      setRubricIssues(result.issues);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Evaluation failed";
      console.error("Failed to evaluate bundle:", error);
      setEvalError(message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRegenerateWithFeedback = async (feedback: string) => {
    if (!activeBundle) return;
    try {
      const updatedValue = await regenerateField({
        bundle: activeBundle,
        fieldPath: "",
        comment: feedback,
      });
      if (typeof updatedValue === "object" && updatedValue !== null) {
        updateField("", updatedValue);
      }
    } catch (error) {
      console.error("Failed to regenerate with feedback:", error);
    }
  };

  const handleExport = async () => {
    if (!activeBundle) return;
    setExportError(null);
    try {
      const { blob, filename } = await exportDesign({ bundle: activeBundle });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Export failed";
      console.error("Failed to export bundle:", error);
      setExportError(message);
    }
  };

  const lowerPillar =
    TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR[activeBundle.tagBlock.pillar];

  // ── Section index helpers ────────────────────────────────────────────────
  const isStepSection = activeSection.startsWith("step-");
  const stepNumber = isStepSection
    ? Number(activeSection.split("-")[1])
    : null;
  const activeStep = stepNumber
    ? activeBundle.prod.steps.find((s) => s.stepNumber === stepNumber)
    : null;
  const activeStepIndex = activeStep
    ? activeBundle.prod.steps.indexOf(activeStep)
    : -1;
  const handleAddBridgeVariant = (variant: "warmStart" | "coldStart") => {
    if (!activeStep || activeStepIndex < 0) return;
    addBridgeVariant(activeStepIndex, variant);
    setActiveSection(
      `step-${activeStep.stepNumber}-${variant === "warmStart" ? "warm" : "cold"}`,
    );
  };
  const handleAddRound = () => {
    if (!activeStep || activeStepIndex < 0 || activeStep.type !== "rounds") {
      return;
    }
    const nextRoundNumber =
      (activeStep.rounds ?? []).reduce(
        (highest, round) => Math.max(highest, round.roundNumber),
        0,
      ) + 1;
    addRound(activeStepIndex);
    setActiveSection(`step-${activeStep.stepNumber}-round-${nextRoundNumber}`);
  };

  return (
    <div className="flex-1 min-h-0 bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-white">
            {activeBundle.prod.basicInfo.activityName}
          </h1>
          <ModePill mode={activeBundle.generationMode} />
          <PillarPill pillar={lowerPillar} />
        </div>
        <div className="w-32" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <NavigationPanel
          bundle={activeBundle}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {exportError && (
            <div className="mb-4 rounded-md border border-red-700 bg-red-900/30 p-3 text-sm text-red-300">
              Export failed: {exportError}
            </div>
          )}

          {/* SPEC */}
          {activeSection === "spec" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <FileText className="w-5 h-5 text-indigo-400" /> Authoring Spec
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Title"
                  value={activeBundle.spec.title}
                  fieldPath="spec.title"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Subtitle"
                  value={activeBundle.spec.subtitle ?? ""}
                  fieldPath="spec.subtitle"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Premise"
                  value={activeBundle.spec.premise}
                  fieldPath="spec.premise"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Pedagogical Rationale"
                  value={activeBundle.spec.pedagogicalRationale}
                  fieldPath="spec.pedagogicalRationale"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="IB Axis (primary)"
                  value={activeBundle.spec.target.ibAxisPrimary}
                  fieldPath="spec.target.ibAxisPrimary"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="IB Axis (secondary)"
                  value={activeBundle.spec.target.ibAxisSecondary ?? ""}
                  fieldPath="spec.target.ibAxisSecondary"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Tier elasticity"
                  value={activeBundle.spec.target.tierElasticity}
                  fieldPath="spec.target.tierElasticity"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Age Notes"
                  value={activeBundle.spec.target.ageNotes}
                  fieldPath="spec.target.ageNotes"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Selection Trigger — Description"
                  value={activeBundle.spec.selectionTrigger.description}
                  fieldPath="spec.selectionTrigger.description"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Selection Trigger — Constellation Notes"
                  value={
                    activeBundle.spec.selectionTrigger.constellationNotes ?? ""
                  }
                  fieldPath="spec.selectionTrigger.constellationNotes"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
              </div>
            </section>
          )}

          {/* PROD — BASIC INFO */}
          {activeSection === "prod-basic" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <ClipboardList className="w-5 h-5 text-indigo-400" /> Basic Info
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Activity Name"
                  value={activeBundle.prod.basicInfo.activityName}
                  fieldPath="prod.basicInfo.activityName"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Design Version"
                  value={activeBundle.prod.basicInfo.designVersion}
                  fieldPath="prod.basicInfo.designVersion"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Last Updated"
                  value={activeBundle.prod.basicInfo.lastUpdated}
                  fieldPath="prod.basicInfo.lastUpdated"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Related Concepts (comma-sep)"
                  value={activeBundle.prod.basicInfo.relatedConcepts.join(
                    ", ",
                  )}
                  fieldPath="prod.basicInfo.relatedConcepts"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\s*,\s*/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                      )
                  }
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="ATL Skills Focus (comma-sep)"
                  value={activeBundle.prod.basicInfo.atlSkillsFocus.join(", ")}
                  fieldPath="prod.basicInfo.atlSkillsFocus"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\s*,\s*/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                      )
                  }
                  onAskAI={handleAskAI}
                />
                <p className="text-xs text-gray-500">
                  Game style, category, recommended tier, and core IB key
                  concepts are managed in the Tag Block panel — they mirror
                  across spec/prod/tagBlock.
                </p>
              </div>
            </section>
          )}

          {/* PROD — OVERVIEW + KUD */}
          {activeSection === "prod-overview" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <Target className="w-5 h-5 text-indigo-400" /> Overview & KUD
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Brief Description"
                  value={activeBundle.prod.overview.briefDescription}
                  fieldPath="prod.overview.briefDescription"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Design Highlight"
                  value={activeBundle.prod.overview.designHighlight}
                  fieldPath="prod.overview.designHighlight"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Typical Scenario"
                  value={activeBundle.prod.overview.typicalScenario}
                  fieldPath="prod.overview.typicalScenario"
                  onChange={handleStringFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="K (Know) — semicolon-separated"
                  value={activeBundle.prod.kud.know.join("; ")}
                  fieldPath="prod.kud.know"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\s*;\s*/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="U (Understand) — semicolon-separated"
                  value={activeBundle.prod.kud.understand.join("; ")}
                  fieldPath="prod.kud.understand"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\s*;\s*/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="D (Do) — semicolon-separated"
                  value={activeBundle.prod.kud.do.join("; ")}
                  fieldPath="prod.kud.do"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\s*;\s*/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onAskAI={handleAskAI}
                  multiline
                />
              </div>
            </section>
          )}

          {/* PROD — A.1 ENTITY ATTRIBUTES */}
          {activeSection === "prod-attributes" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <LayoutGrid className="w-5 h-5 text-indigo-400" /> Entity
                Attributes Covered (A.1)
              </h3>
              <EditableField
                label="Attribute IDs (one per line)"
                value={activeBundle.prod.entityAttributesCovered.join("\n")}
                fieldPath="prod.entityAttributesCovered"
                onChange={(path, value) =>
                  updateField(
                    path,
                    value
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                onAskAI={handleAskAI}
                multiline
              />
            </section>
          )}

          {/* PROD — A.2 CONSTELLATION ADAPTATION */}
          {activeSection === "prod-constellation" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Constellation
                Adaptation Notes (A.2)
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Preserve (one per line)"
                  value={(activeBundle.prod.constellationAdaptation?.preserve ?? []).join("\n")}
                  fieldPath="prod.constellationAdaptation.preserve"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\r?\n/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Swap (one per line)"
                  value={(activeBundle.prod.constellationAdaptation?.swap ?? []).join("\n")}
                  fieldPath="prod.constellationAdaptation.swap"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\r?\n/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Watch (one per line)"
                  value={(activeBundle.prod.constellationAdaptation?.watch ?? []).join("\n")}
                  fieldPath="prod.constellationAdaptation.watch"
                  onChange={(path, value) =>
                    updateField(
                      path,
                      value
                        .split(/\r?\n/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onAskAI={handleAskAI}
                  multiline
                />
              </div>
            </section>
          )}

          {/* PROD — STEPS */}
          {isStepSection && activeStep && activeStepIndex >= 0 && (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-semibold">
                  Step {activeStep.stepNumber}: {activeStep.title}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    handleAskAI(`prod.steps.${activeStepIndex}`, "")
                  }
                  className="inline-flex items-center gap-1.5 bg-indigo-900/50 text-indigo-300 border border-indigo-700 px-3 py-1.5 rounded-md text-xs hover:bg-indigo-900/70 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI to improve this step
                </button>
              </div>

              {activeStep.type === "bridge" && (
                <div className="space-y-6">
                  {(!activeStep.warmStart || !activeStep.coldStart) && (
                    <div className="flex flex-wrap gap-2">
                      {!activeStep.warmStart && (
                        <button
                          type="button"
                          onClick={() => handleAddBridgeVariant("warmStart")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-700 bg-indigo-950/30 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-900/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Warm Start
                        </button>
                      )}
                      {!activeStep.coldStart && (
                        <button
                          type="button"
                          onClick={() => handleAddBridgeVariant("coldStart")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-blue-700 bg-blue-950/30 px-3 py-1.5 text-xs text-blue-200 transition-colors hover:bg-blue-900/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Cold Start
                        </button>
                      )}
                    </div>
                  )}
                  {(activeSection === `step-${activeStep.stepNumber}` ||
                    activeSection === `step-${activeStep.stepNumber}-warm`) &&
                    activeStep.warmStart && (
                      <div>
                        <h4 className="text-indigo-300 text-sm font-semibold mb-3">
                          Warm Start (post-conversation)
                        </h4>
                        <DialogueBlockEditor
                          dialogue={activeStep.warmStart}
                          basePath={`prod.steps.${activeStepIndex}.warmStart`}
                          onChange={handleStringFieldChange}
                          onAskAI={handleAskAI}
                        />
                      </div>
                    )}
                  {(activeSection === `step-${activeStep.stepNumber}` ||
                    activeSection === `step-${activeStep.stepNumber}-cold`) &&
                    activeStep.coldStart && (
                      <div>
                        <h4 className="text-blue-300 text-sm font-semibold mb-3">
                          Cold Start (standalone)
                        </h4>
                        <DialogueBlockEditor
                          dialogue={activeStep.coldStart}
                          basePath={`prod.steps.${activeStepIndex}.coldStart`}
                          onChange={handleStringFieldChange}
                          onAskAI={handleAskAI}
                        />
                      </div>
                    )}
                </div>
              )}

              {activeStep.type === "rounds" && (
                <div className="space-y-8">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddRound}
                      className="inline-flex items-center gap-1.5 rounded-md border border-purple-700 bg-purple-950/30 px-3 py-1.5 text-xs text-purple-200 transition-colors hover:bg-purple-900/50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Round
                    </button>
                  </div>
                  {(activeStep.rounds ?? []).map((round, roundIndex) => {
                    const roundId = `step-${activeStep.stepNumber}-round-${round.roundNumber}`;
                    if (
                      activeSection !== `step-${activeStep.stepNumber}` &&
                      activeSection !== roundId
                    )
                      return null;

                    return (
                      <div key={roundId}>
                        <h4 className="text-purple-300 text-sm font-semibold mb-3">
                          Round {round.roundNumber}
                        </h4>
                        <DialogueBlockEditor
                          dialogue={round.dialogue}
                          basePath={`prod.steps.${activeStepIndex}.rounds.${roundIndex}.dialogue`}
                          onChange={handleStringFieldChange}
                          onAskAI={handleAskAI}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {activeStep.type !== "bridge" &&
                activeStep.type !== "rounds" &&
                activeStep.dialogue && (
                  <DialogueBlockEditor
                    dialogue={activeStep.dialogue}
                    basePath={`prod.steps.${activeStepIndex}.dialogue`}
                    onChange={handleStringFieldChange}
                    onAskAI={handleAskAI}
                  />
                )}

              {activeStep.type === "closing" && (
                <div className="mt-6 space-y-4">
                  <EditableField
                    label="Concept Reinforcement"
                    value={activeStep.conceptReinforcement ?? ""}
                    fieldPath={`prod.steps.${activeStepIndex}.conceptReinforcement`}
                    onChange={handleStringFieldChange}
                    onAskAI={handleAskAI}
                    multiline
                  />
                  <EditableField
                    label="Tomorrow Hook"
                    value={activeStep.tomorrowHook ?? ""}
                    fieldPath={`prod.steps.${activeStepIndex}.tomorrowHook`}
                    onChange={handleStringFieldChange}
                    onAskAI={handleAskAI}
                  />
                </div>
              )}
            </section>
          )}

          {/* TAG BLOCK */}
          {activeSection === "tagBlock" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <Tag className="w-5 h-5 text-indigo-400" /> Tag Block
              </h3>
              <TagBlockPanel
                bundle={activeBundle}
                onChange={(path, value) => updateField(path, value)}
                onAskAI={handleAskAI}
              />
            </section>
          )}

          {/* RECAP PREVIEW */}
          {activeSection === "recap-preview" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <FileText className="w-5 h-5 text-emerald-400" /> Recap (preview)
              </h3>
              <RecapPreview bundle={activeBundle} />
            </section>
          )}

          {/* DASHBOARD PREVIEW */}
          {activeSection === "dashboard-preview" && (
            <section>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <LayoutGrid className="w-5 h-5 text-amber-400" /> Dashboard
                (preview)
              </h3>
              <DashboardPreview bundle={activeBundle} />
            </section>
          )}
        </div>

        <ScorecardPanel
          scores={rubricScores}
          issues={rubricIssues}
          evaluated={rubricEvaluated}
          evalError={evalError}
          onRerunRubric={handleRerunRubric}
          onRegenerateWithFeedback={handleRegenerateWithFeedback}
          onExport={handleExport}
          isEvaluating={isEvaluating}
        />
      </div>
    </div>
  );
}
