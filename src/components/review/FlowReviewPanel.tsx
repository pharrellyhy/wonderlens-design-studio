import type { ActivityBundle } from "@/lib/activity-bundle-schema";
import type { DialogueBlock, Step } from "@/lib/design-schema";

function childResponseSummary(dialogue: DialogueBlock): string {
  return [
    `Ideal: ${dialogue.childResponses.ideal}`,
    `Unexpected: ${dialogue.childResponses.unexpected}`,
    `Silent: ${dialogue.childResponses.silent}`,
  ]
    .filter((item) => !item.endsWith(": "))
    .join(" · ");
}

function DialogueReview({
  dialogue,
  label,
}: {
  dialogue: DialogueBlock;
  label?: string;
}) {
  return (
    <div className="rounded-md border border-gray-800 bg-gray-950/50 p-3">
      {label && <h4 className="mb-2 text-xs font-semibold text-gray-400">{label}</h4>}
      <p className="text-sm text-gray-200">{dialogue.aiSays}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">
        {childResponseSummary(dialogue)}
      </p>
      <p className="mt-2 rounded bg-gray-900 p-2 text-xs leading-5 text-cyan-200">
        Screen: {dialogue.screenDescription}
      </p>
    </div>
  );
}

function StepReview({ step }: { step: Step }) {
  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">
          Step {step.stepNumber}: {step.title}
        </h3>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
          {step.type}
        </span>
      </div>
      <div className="space-y-3">
        {step.coldStart && (
          <DialogueReview dialogue={step.coldStart} label="Cold start" />
        )}
        {step.warmStart && (
          <DialogueReview dialogue={step.warmStart} label="Warm start" />
        )}
        {step.dialogue && <DialogueReview dialogue={step.dialogue} />}
        {step.rounds && step.rounds.length > 0 && (
          <details open className="space-y-3">
            <summary className="cursor-pointer text-xs font-medium text-emerald-200">
              Step 3 rounds expanded
            </summary>
            <div className="mt-3 space-y-3">
              {step.rounds.map((round) => (
                <DialogueReview
                  key={round.roundNumber}
                  dialogue={round.dialogue}
                  label={`Round ${round.roundNumber}`}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

export function FlowReviewPanel({ bundle }: { bundle: ActivityBundle }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-white">Activity Flow Review</h2>
      {bundle.prod.steps.map((step) => (
        <StepReview key={`${step.stepNumber}-${step.title}`} step={step} />
      ))}
    </section>
  );
}
