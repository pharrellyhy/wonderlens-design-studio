import Link from "next/link";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface TaskCardProps {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: ComponentType<LucideProps>;
  tone: "emerald" | "indigo" | "slate";
}

const TONE_CLASSES: Record<TaskCardProps["tone"], string> = {
  emerald: "border-emerald-800/70 bg-emerald-950/20 text-emerald-200",
  indigo: "border-indigo-800/70 bg-indigo-950/20 text-indigo-200",
  slate: "border-gray-800 bg-gray-900/50 text-gray-200",
};

export function TaskCard({
  title,
  description,
  cta,
  href,
  icon: Icon,
  tone,
}: TaskCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-lg border p-5 transition-colors hover:border-gray-500 ${TONE_CLASSES[tone]}`}
    >
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-current/20 bg-black/20">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
          <span className="mt-4 inline-flex text-sm font-medium text-current group-hover:text-white">
            {cta}
          </span>
        </div>
      </div>
    </Link>
  );
}
