"use client";

import { Award, Sparkles } from "lucide-react";

import type { ActivityBundle } from "@/lib/activity-bundle-schema";

interface RecapPreviewProps {
  bundle: ActivityBundle;
}

export function RecapPreview({ bundle }: RecapPreviewProps) {
  const r = bundle.recap;
  const pd = r.payloadDefaults;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/10 px-4 py-3 text-xs text-emerald-200/80">
        Recap is a derived preview — its values are kept in sync with{" "}
        <code>tagBlock.activity_signature</code> via the cross-doc bind. Edit
        the corresponding tagBlock field instead of trying to write here
        directly.
      </div>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="text-emerald-300 text-sm font-semibold">
            Rendered child card
          </h4>
        </div>
        <h5 className="text-white text-base font-semibold">
          {r.rendered.title}
        </h5>
        <p className="text-gray-300 text-sm mt-2">{r.rendered.line_1}</p>
        <p className="text-gray-300 text-sm mt-1">{r.rendered.line_2}</p>
        <p className="text-gray-300 text-sm mt-1">{r.rendered.line_3}</p>
        <div className="mt-4 flex items-center gap-3">
          <Award className="w-4 h-4 text-amber-300" />
          <span className="text-amber-300 text-sm">
            Badge: {r.rendered.badge}
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-3">Next: {r.rendered.next}</p>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h4 className="text-gray-300 text-sm font-semibold mb-2">
          Payload Defaults
        </h4>
        <table className="text-xs text-gray-300 w-full">
          <tbody>
            <Row label="entity" value={pd.entity} />
            <Row label="tier" value={pd.tier} />
            <Row label="age_years" value={pd.ageYears} />
            <Row label="what_we_noticed" value={pd.whatWeNoticed} />
            <Row label="what_we_did" value={pd.whatWeDid} />
            <Row label="entity_role" value={pd.entityRole} />
            <Row
              label="focal_attribute.token"
              value={pd.focalAttribute.token}
            />
            <Row
              label="focal_attribute.child_label"
              value={pd.focalAttribute.childLabel}
            />
            <Row
              label="focal_attribute.badge_emoji_none"
              value={String(pd.focalAttribute.badgeEmojiNone)}
            />
            <Row label="highlight_moment" value={pd.highlightMoment} />
            <Row
              label="difficulty_level"
              value={String(pd.difficultyLevel)}
            />
            <Row label="next_step_hint" value={pd.nextStepHint} />
            <Row
              label="caregiver_observed"
              value={pd.caregiverObserved}
            />
            <Row label="reward_badge" value={pd.rewardBadge} />
          </tbody>
        </table>
        {pd.finds && pd.finds.length > 0 && (
          <div className="mt-3">
            <p className="text-gray-400 text-xs mb-1">finds:</p>
            <ul className="text-xs text-gray-300 space-y-1 pl-4 list-disc">
              {pd.finds.map((find, i) => (
                <li key={i}>
                  {find.label} — <code>{find.photo}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-4 text-gray-500 align-top whitespace-nowrap">
        <code>{label}</code>
      </td>
      <td className="py-1 text-gray-200 align-top">{value}</td>
    </tr>
  );
}
