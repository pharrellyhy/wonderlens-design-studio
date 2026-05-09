import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";

import type { ReviewDiagnostic } from "@/lib/review-diagnostics";

const STATUS_CLASS: Record<ReviewDiagnostic["status"], string> = {
  pass: "border-green-900/70 bg-green-950/20 text-green-200",
  needs_review: "border-amber-900/70 bg-amber-950/20 text-amber-200",
  needs_product_decision: "border-orange-900/70 bg-orange-950/20 text-orange-200",
  blocked: "border-red-900/70 bg-red-950/20 text-red-200",
  not_provided: "border-gray-800 bg-gray-950/40 text-gray-300",
};

function iconFor(status: ReviewDiagnostic["status"]) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "blocked") return <AlertTriangle className="h-4 w-4" />;
  return <CircleHelp className="h-4 w-4" />;
}

export function DiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: ReviewDiagnostic[];
}) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900/60">
      <div className="border-b border-gray-800 p-3">
        <h2 className="text-sm font-semibold text-white">
          Review Diagnostics
        </h2>
      </div>
      <div className="space-y-2 p-3">
        {diagnostics.map((diagnostic) => (
          <article
            key={diagnostic.id}
            className={`rounded-md border p-3 text-sm ${STATUS_CLASS[diagnostic.status]}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">{iconFor(diagnostic.status)}</span>
              <div>
                <h3 className="font-medium text-white">{diagnostic.title}</h3>
                <p className="mt-1 leading-5 text-current/80">
                  {diagnostic.message}
                </p>
                {diagnostic.evidence && diagnostic.evidence.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-current/70">
                    {diagnostic.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
