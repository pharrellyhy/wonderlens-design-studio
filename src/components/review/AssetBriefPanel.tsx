import { Image as ImageIcon } from "lucide-react";

import type { ActivityReviewMetadata } from "@/lib/review-metadata";

export function AssetBriefPanel({
  metadata,
}: {
  metadata: ActivityReviewMetadata;
}) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900/60">
      <div className="border-b border-gray-800 p-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <ImageIcon className="h-4 w-4 text-cyan-300" />
          Asset Brief
        </h2>
      </div>
      <div className="p-3">
        {metadata.assets.length === 0 ? (
          <p className="text-sm text-gray-500">Asset brief not provided.</p>
        ) : (
          <div className="space-y-3">
            {metadata.assets.map((asset) => (
              <article
                key={asset.assetId}
                className="rounded-md border border-gray-800 bg-gray-950/50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-white">{asset.assetId}</h3>
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                    {asset.generationTiming}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-gray-400">
                  <div>
                    <dt className="text-gray-500">prompt_en</dt>
                    <dd className="text-gray-200">
                      {asset.promptEn ?? "not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Use step</dt>
                    <dd className="text-gray-200">{asset.useStep}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Display</dt>
                    <dd className="text-gray-200">
                      {asset.displayBehavior ?? "not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Fallback</dt>
                    <dd className="text-gray-200">
                      {asset.fallbackBehavior ?? "not provided"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
