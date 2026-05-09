"use client";

import { useRouter } from "next/navigation";

import { YamlUploader } from "@/components/upload/YamlUploader";
import { useDesignStore } from "@/store/design-store";
import type { ParsedEntity } from "@/lib/yaml-parser";

export default function GeneratePage() {
  const router = useRouter();
  const setParsedEntity = useDesignStore((s) => s.setParsedEntity);
  const parsedEntity = useDesignStore((s) => s.parsedEntity);

  const handleEntityParsed = (entity: ParsedEntity) => {
    setParsedEntity(entity);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-white">
            Generate From Entity Mapping
          </h1>
          <p className="text-lg text-gray-400">
            Upload an entity YAML, choose the generation mode, then create
            design variants.
          </p>
        </div>

        <YamlUploader onEntityParsed={handleEntityParsed} />

        {parsedEntity && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => router.push(`/gallery/${parsedEntity.name}`)}
              className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Generate Design Variants →
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This will generate 2-4 design variants using AI. Estimated cost:
              $1-4 depending on provider.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
