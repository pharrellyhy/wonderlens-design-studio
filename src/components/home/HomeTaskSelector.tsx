import { FileSearch, Library, WandSparkles } from "lucide-react";

import { TaskCard } from "./TaskCard";

export const HOME_TASKS = [
  {
    title: "Review Existing Activities",
    description:
      "Inspect generated packages, batch-review output, check asset dependencies, and edit when needed.",
    cta: "Import activity bundles",
    href: "/review",
    icon: FileSearch,
    tone: "emerald",
  },
  {
    title: "Generate From Entity Mapping",
    description:
      "Create new variants from an entity YAML with the current studio generation workflow.",
    cta: "Upload entity YAML",
    href: "/generate",
    icon: WandSparkles,
    tone: "indigo",
  },
  {
    title: "Library",
    description:
      "Open saved runs and continue work on previously generated designs.",
    cta: "View saved runs",
    href: "/library",
    icon: Library,
    tone: "slate",
  },
] as const;

export function HomeTaskSelector() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Choose a Studio Task
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
          Start with package review, generate new activity variants, or return
          to saved work.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {HOME_TASKS.map((task) => (
          <TaskCard key={task.href} {...task} />
        ))}
      </div>
    </main>
  );
}
