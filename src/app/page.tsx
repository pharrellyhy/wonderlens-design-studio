"use client";

import { useRouter } from "next/navigation";
import { YamlUploader } from "@/components/upload/YamlUploader";
import { useDesignStore } from "@/store/design-store";
import type { ParsedEntity } from "@/lib/yaml-parser";

export default function Home() {
  const router = useRouter();
  const setParsedEntity = useDesignStore((s) => s.setParsedEntity);

  const handleEntityParsed = (entity: ParsedEntity) => {
    setParsedEntity(entity);
  };

  const parsedEntity = useDesignStore((s) => s.parsedEntity);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            WonderLens Design Studio
          </h1>
          <div /> {/* Spacer for layout balance */}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">
            Create a Game Design
          </h2>
          <p className="text-gray-400 text-lg">
            Upload an entity YAML mapping file to generate interactive game
            designs
          </p>
        </div>

        <YamlUploader onEntityParsed={handleEntityParsed} />

        {/* Generate button */}
        {parsedEntity && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push(`/gallery/${parsedEntity.name}`)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Generate Design Variants →
            </button>
            <p className="text-gray-500 text-sm mt-2">
              This will generate 2-4 design variants using AI. Estimated cost:
              $1-4 depending on provider.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
