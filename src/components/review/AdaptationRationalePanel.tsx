import { GitBranch } from "lucide-react";

import type { ActivityReviewMetadata } from "@/lib/review-metadata";

export function AdaptationRationalePanel({
  metadata,
}: {
  metadata: ActivityReviewMetadata;
}) {
  const adaptation = metadata.adaptation;

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900/60">
      <div className="border-b border-gray-800 p-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <GitBranch className="h-4 w-4 text-purple-300" />
          Adaptation Rationale
        </h2>
      </div>
      <div className="space-y-3 p-3 text-sm">
        {metadata.sourceSections.adaptationRationale ? (
          <p className="whitespace-pre-wrap leading-6 text-gray-300">
            {metadata.sourceSections.adaptationRationale}
          </p>
        ) : (
          <p className="text-gray-500">Adaptation rationale not provided.</p>
        )}
        {adaptation && (
          <dl className="grid gap-2 border-t border-gray-800 pt-3 text-xs">
            <div>
              <dt className="text-gray-500">Canonical mechanic</dt>
              <dd className="text-gray-200">
                {adaptation.canonicalMechanic ?? "not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Readiness</dt>
              <dd className="text-gray-200">
                {adaptation.readiness ?? "not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Assumptions</dt>
              <dd className="text-gray-200">
                {adaptation.assumptions.length > 0
                  ? adaptation.assumptions.join("; ")
                  : "none"}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}
