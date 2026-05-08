"use client";

import { Compass, Grid3x3, KeyRound } from "lucide-react";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";

interface DashboardPreviewProps {
  bundle: ActivityBundle;
}

export function DashboardPreview({ bundle }: DashboardPreviewProps) {
  const d = bundle.dashboard;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-xs text-amber-200/80">
        Dashboard is a derived preview. <code>session</code> values mirror{" "}
        <code>tagBlock.activity_signature</code> + runtime placeholders;{" "}
        <code>contributesTo</code> is computed from those plus{" "}
        <code>tagBlock.atl_skills</code> and{" "}
        <code>tagBlock.key_concepts</code>.
      </div>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h4 className="text-amber-300 text-sm font-semibold mb-3">Session</h4>
        <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-300">
          <KV k="axis" v={d.session.axis} />
          <KV k="angle" v={d.session.angle} />
          <KV k="mechanic" v={d.session.mechanic} />
          <KV k="entity_role" v={d.session.entityRole} />
          <KV k="focal_attribute" v={d.session.focalAttribute} />
          <KV k="entry_rung" v={d.session.entryRung} />
          <KV k="exit_rung" v={d.session.exitRung} />
          <KV k="outcome" v={d.session.outcome} />
        </div>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h4 className="text-amber-300 text-sm font-semibold mb-3">
          Contributes To
        </h4>
        <div className="space-y-3 text-xs text-gray-300">
          <div className="flex items-start gap-3">
            <Compass className="w-3.5 h-3.5 mt-0.5 text-indigo-300" />
            <div>
              <div className="text-gray-400 uppercase tracking-wider text-[10px]">
                curiosity_radial
              </div>
              <div>
                {d.contributesTo.curiosityRadial.axis} ·{" "}
                {d.contributesTo.curiosityRadial.angle}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Grid3x3 className="w-3.5 h-3.5 mt-0.5 text-emerald-300" />
            <div>
              <div className="text-gray-400 uppercase tracking-wider text-[10px]">
                exploration_matrix
              </div>
              <div>{d.contributesTo.explorationMatrix.cell}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <KeyRound className="w-3.5 h-3.5 mt-0.5 text-rose-300" />
            <div className="flex-1">
              <div className="text-gray-400 uppercase tracking-wider text-[10px]">
                key_concepts_exposure
              </div>
              <ul className="mt-1 space-y-0.5">
                {Object.entries(d.contributesTo.keyConceptsExposure).map(
                  ([concept, exposure]) =>
                    exposure ? (
                      <li key={concept}>
                        {concept} · angle: {exposure.angle}
                      </li>
                    ) : null,
                )}
              </ul>
            </div>
          </div>
          <div>
            <div className="text-gray-400 uppercase tracking-wider text-[10px]">
              atl_skills_trail
            </div>
            <ul className="mt-1 list-disc pl-5">
              {d.contributesTo.atlSkillsTrail.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <>
      <div className="text-gray-500">
        <code>{k}</code>
      </div>
      <div className="text-gray-200">{v}</div>
    </>
  );
}
