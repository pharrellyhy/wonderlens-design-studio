import { ClipboardList } from "lucide-react";

import type { ImportedBundleResult } from "@/lib/bundle-import";
import { ModePill } from "@/components/common/ModePill";
import { PillarPill } from "@/components/common/PillarPill";
import { TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR } from "@/lib/activity-bundle-schema";

export function ReviewSummaryPanel({
  result,
}: {
  result: ImportedBundleResult;
}) {
  const bundle = result.bundle;
  const signature = bundle.tagBlock.activity_signature;
  const lowerPillar =
    TAG_BLOCK_PILLAR_TO_EXPERIENCE_PILLAR[bundle.tagBlock.pillar];

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-white">
            <ClipboardList className="h-5 w-5 text-indigo-300" />
            {bundle.prod.basicInfo.activityName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{bundle.activityId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ModePill mode={bundle.generationMode} />
          <PillarPill pillar={lowerPillar} />
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Mechanic
          </dt>
          <dd className="mt-1 text-gray-200">{signature.mechanic}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Category / Tier
          </dt>
          <dd className="mt-1 text-gray-200">
            {bundle.prod.basicInfo.activityCategory} ·{" "}
            {bundle.prod.basicInfo.recommendedTier}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Asset Policy
          </dt>
          <dd className="mt-1 text-gray-200">
            {result.reviewMetadata.assetPolicy}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Focal Attribute
          </dt>
          <dd className="mt-1 text-gray-200">{signature.focal_attribute}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Blockers
          </dt>
          <dd className="mt-1 text-gray-200">
            {result.diagnostics.filter((item) => item.status === "blocked").length}{" "}
            blockers
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Scorecard
          </dt>
          <dd className="mt-1 text-gray-200">
            {result.rubricEvaluated ? "found" : "not evaluated"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
