"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Palette, Sparkles, Target } from "lucide-react";
import { useDesignStore } from "@/store/design-store";
import { evaluateDesign, regenerateField, exportDesign } from "@/lib/api-client";
import { NavigationPanel } from "@/components/editor/NavigationPanel";
import { ScorecardPanel } from "@/components/editor/ScorecardPanel";
import { EditableField } from "@/components/editor/EditableField";
import { DialogueBlockEditor } from "@/components/editor/DialogueBlock";
import { ModePill } from "@/components/common/ModePill";
import {
  CATEGORY_LABELS,
  TIER_LABELS,
  GAME_STYLES,
} from "@/lib/design-schema";

export default function EditorPage() {
  const router = useRouter();
  const activeDesign = useDesignStore((s) => s.activeDesign);
  const rubricScores = useDesignStore((s) => s.rubricScores);
  const rubricIssues = useDesignStore((s) => s.rubricIssues);
  const activeSection = useDesignStore((s) => s.activeSection);
  const setActiveSection = useDesignStore((s) => s.setActiveSection);
  const updateField = useDesignStore((s) => s.updateField);
  const llmProvider = useDesignStore((s) => s.llmProvider);
  const apiKey = useDesignStore((s) => s.apiKeys[s.llmProvider]);
  const setRubricScores = useDesignStore((s) => s.setRubricScores);
  const setRubricIssues = useDesignStore((s) => s.setRubricIssues);

  const [isEvaluating, setIsEvaluating] = useState(false);

  if (!activeDesign || !rubricScores) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            No design loaded. Please select a variant first.
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

  const handleFieldChange = (path: string, value: string) => {
    updateField(path, value);
  };

  const handleAskAI = async (path: string, comment: string) => {
    if (!apiKey || !activeDesign) return;
    try {
      const updatedValue = await regenerateField({
        design: activeDesign,
        fieldPath: path,
        comment: comment || "Please improve this",
        llmProvider,
        apiKey,
      });
      updateField(path, updatedValue);
    } catch (error) {
      console.error("Failed to regenerate field:", error);
    }
  };

  const handleRerunRubric = async () => {
    if (!activeDesign) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateDesign({
        design: activeDesign,
        llmProvider,
        apiKey,
      });
      setRubricScores(result.rubricScores);
      setRubricIssues(result.issues);
    } catch (error) {
      console.error("Failed to evaluate design:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRegenerateWithFeedback = async (feedback: string) => {
    if (!apiKey || !activeDesign) return;
    try {
      const updatedValue = await regenerateField({
        design: activeDesign,
        fieldPath: "",
        comment: feedback,
        llmProvider,
        apiKey,
      });
      if (typeof updatedValue === "object" && updatedValue !== null) {
        updateField("", updatedValue);
      }
    } catch (error) {
      console.error("Failed to regenerate with feedback:", error);
    }
  };

  const handleExport = async () => {
    if (!activeDesign) return;
    try {
      const result = await exportDesign({
        design: activeDesign,
        format: "both",
      });
      const baseName = activeDesign.basicInfo.activityName
        .replace(/\s+/g, "_")
        .toLowerCase();

      if (result.specMd) {
        const blob = new Blob([result.specMd], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}_spec.md`;
        a.click();
        URL.revokeObjectURL(url);
      }

      if (result.prodMd) {
        const blob = new Blob([result.prodMd], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}_prod.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export design:", error);
    }
  };

  // Layout: the global app shell in `src/app/layout.tsx` is `body` →
  // sticky <nav> + a `flex-1 flex flex-col` wrapper for {children}. Using
  // `flex-1 min-h-0` here makes the editor consume exactly the viewport
  // space below the nav (without a calc()), and `min-h-0` lets the inner
  // overflow-y-auto panel actually scroll instead of pushing the page
  // taller than the viewport. h-screen was previously bleeding past the
  // bottom because nav-height + 100vh > 100vh.
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
            {activeDesign.basicInfo.activityName}
          </h1>
          <ModePill mode={activeDesign.basicInfo.generationMode} />
        </div>
        <div className="w-32" /> {/* Spacer for centering */}
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Navigation */}
        <NavigationPanel
          design={activeDesign}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Center: Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info */}
          {activeSection === "basicInfo" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  Basic Info
                </h3>
                <button
                  onClick={() => handleAskAI("basicInfo", "")}
                  className="inline-flex items-center gap-1.5 bg-indigo-900/50 text-indigo-300 border border-indigo-700 px-3 py-1.5 rounded-md text-xs hover:bg-indigo-900/70 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI to improve this section
                </button>
              </div>

              <div className="space-y-4">
                <EditableField
                  label="Activity Name"
                  value={activeDesign.basicInfo.activityName}
                  fieldPath="basicInfo.activityName"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <label className="text-gray-400 text-xs uppercase tracking-wider">
                      Activity Category
                    </label>
                    <select
                      value={activeDesign.basicInfo.category}
                      onChange={(e) =>
                        handleFieldChange("basicInfo.category", e.target.value)
                      }
                      className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <label className="text-gray-400 text-xs uppercase tracking-wider">
                      Recommended Tier
                    </label>
                    <select
                      value={activeDesign.basicInfo.tier}
                      onChange={(e) =>
                        handleFieldChange("basicInfo.tier", e.target.value)
                      }
                      className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm"
                    >
                      {Object.entries(TIER_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <label className="text-gray-400 text-xs uppercase tracking-wider">
                    Game Style
                  </label>
                  <select
                    value={activeDesign.basicInfo.gameStyle}
                    onChange={(e) =>
                      handleFieldChange("basicInfo.gameStyle", e.target.value)
                    }
                    className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm"
                  >
                    {GAME_STYLES[activeDesign.basicInfo.category].map(
                      (style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <EditableField
                  label="IB Theme"
                  value={activeDesign.basicInfo.ibTheme}
                  fieldPath="basicInfo.ibTheme"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />

                <EditableField
                  label="Trigger Entity"
                  value={activeDesign.basicInfo.triggerEntity}
                  fieldPath="basicInfo.triggerEntity"
                  onChange={handleFieldChange}
                />

                <EditableField
                  label="Trigger Scene"
                  value={activeDesign.basicInfo.triggerScene}
                  fieldPath="basicInfo.triggerScene"
                  onChange={handleFieldChange}
                />
              </div>
            </div>
          )}

          {/* Overview & KUD */}
          {activeSection === "overview" && (
            <div>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <Target className="w-5 h-5 text-indigo-400" />
                Overview & KUD
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Brief Description"
                  value={activeDesign.overview.briefDescription}
                  fieldPath="overview.briefDescription"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Design Highlight"
                  value={activeDesign.overview.designHighlight}
                  fieldPath="overview.designHighlight"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
                <EditableField
                  label="Typical Scenario"
                  value={activeDesign.overview.typicalScenario}
                  fieldPath="overview.typicalScenario"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                  multiline
                />
              </div>
            </div>
          )}

          {/* Creative Variables */}
          {activeSection === "creativeVariables" && (
            <div>
              <h3 className="inline-flex items-center gap-2 text-white text-lg font-semibold mb-4">
                <Palette className="w-5 h-5 text-indigo-400" />
                Creative Variables
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Metaphor"
                  value={activeDesign.creativeVariables.metaphor}
                  fieldPath="creativeVariables.metaphor"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Role Title"
                  value={activeDesign.creativeVariables.roleTitle}
                  fieldPath="creativeVariables.roleTitle"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Game Mechanic"
                  value={activeDesign.creativeVariables.gameMechanic}
                  fieldPath="creativeVariables.gameMechanic"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Scenario Type"
                  value={activeDesign.creativeVariables.scenarioType}
                  fieldPath="creativeVariables.scenarioType"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Target Response Type"
                  value={activeDesign.creativeVariables.targetResponseType}
                  fieldPath="creativeVariables.targetResponseType"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />
                <EditableField
                  label="Escalation Axis"
                  value={activeDesign.creativeVariables.escalationAxis}
                  fieldPath="creativeVariables.escalationAxis"
                  onChange={handleFieldChange}
                  onAskAI={handleAskAI}
                />

                {/* Cat 5 only fields */}
                {activeDesign.basicInfo.category === "cat5" && (
                  <>
                    <EditableField
                      label="Visual Feature"
                      value={
                        activeDesign.creativeVariables.visualFeature ?? ""
                      }
                      fieldPath="creativeVariables.visualFeature"
                      onChange={handleFieldChange}
                      onAskAI={handleAskAI}
                    />
                    <EditableField
                      label="Collection Criterion"
                      value={
                        activeDesign.creativeVariables.collectionCriterion ?? ""
                      }
                      fieldPath="creativeVariables.collectionCriterion"
                      onChange={handleFieldChange}
                      onAskAI={handleAskAI}
                    />
                    <EditableField
                      label="Stuck Hint"
                      value={
                        activeDesign.creativeVariables.stuckHint ?? ""
                      }
                      fieldPath="creativeVariables.stuckHint"
                      onChange={handleFieldChange}
                      onAskAI={handleAskAI}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Steps */}
          {activeDesign.steps.map((step, stepIndex) => {
            const stepId = `step-${step.stepNumber}`;
            const isStepActive =
              activeSection === stepId ||
              activeSection.startsWith(`${stepId}-`);

            if (!isStepActive) return null;

            return (
              <div key={stepId}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">
                    Step {step.stepNumber}: {step.title}
                  </h3>
                  <button
                    onClick={() => handleAskAI(stepId, "")}
                    className="inline-flex items-center gap-1.5 bg-indigo-900/50 text-indigo-300 border border-indigo-700 px-3 py-1.5 rounded-md text-xs hover:bg-indigo-900/70 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ask AI to improve this step
                  </button>
                </div>

                {/* Bridge: warm + cold */}
                {step.type === "bridge" && (
                  <div className="space-y-6">
                    {(activeSection === stepId ||
                      activeSection === `${stepId}-warm`) &&
                      step.warmStart && (
                        <div>
                          <h4 className="text-indigo-300 text-sm font-semibold mb-3">
                            Step 1a — Warm Start (post-conversation)
                          </h4>
                          <DialogueBlockEditor
                            dialogue={step.warmStart}
                            basePath={`steps.${stepIndex}.warmStart`}
                            onChange={handleFieldChange}
                            onAskAI={handleAskAI}
                          />
                        </div>
                      )}
                    {(activeSection === stepId ||
                      activeSection === `${stepId}-cold`) &&
                      step.coldStart && (
                        <div>
                          <h4 className="text-blue-300 text-sm font-semibold mb-3">
                            Step 1b — Cold Start (standalone)
                          </h4>
                          <DialogueBlockEditor
                            dialogue={step.coldStart}
                            basePath={`steps.${stepIndex}.coldStart`}
                            onChange={handleFieldChange}
                            onAskAI={handleAskAI}
                          />
                        </div>
                      )}
                  </div>
                )}

                {/* Rounds */}
                {step.type === "rounds" && step.rounds && (
                  <div className="space-y-8">
                    {step.rounds.map((round) => {
                      const roundId = `${stepId}-round-${round.roundNumber}`;
                      if (
                        activeSection !== stepId &&
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
                            basePath={`steps.${stepIndex}.rounds.${round.roundNumber - 1}.dialogue`}
                            onChange={handleFieldChange}
                            onAskAI={handleAskAI}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Regular step dialogue */}
                {step.type !== "bridge" &&
                  step.type !== "rounds" &&
                  step.dialogue && (
                    <DialogueBlockEditor
                      dialogue={step.dialogue}
                      basePath={`steps.${stepIndex}.dialogue`}
                      onChange={handleFieldChange}
                      onAskAI={handleAskAI}
                    />
                  )}

                {/* Closing-only fields: concept reinforcement + tomorrow hook */}
                {step.type === "closing" && (
                  <div className="mt-6 space-y-4">
                    <EditableField
                      label="Concept Reinforcement"
                      value={step.conceptReinforcement ?? ""}
                      fieldPath={`steps.${stepIndex}.conceptReinforcement`}
                      onChange={handleFieldChange}
                      onAskAI={handleAskAI}
                      multiline
                    />
                    <EditableField
                      label="Tomorrow Hook"
                      value={step.tomorrowHook ?? ""}
                      fieldPath={`steps.${stepIndex}.tomorrowHook`}
                      onChange={handleFieldChange}
                      onAskAI={handleAskAI}
                      multiline
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Scorecard */}
        <ScorecardPanel
          scores={rubricScores}
          issues={rubricIssues}
          onRerunRubric={handleRerunRubric}
          onRegenerateWithFeedback={handleRegenerateWithFeedback}
          onExport={handleExport}
          isEvaluating={isEvaluating}
        />
      </div>
    </div>
  );
}
