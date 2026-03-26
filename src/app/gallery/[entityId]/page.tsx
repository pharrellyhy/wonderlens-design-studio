"use client";

import { useRouter } from "next/navigation";
import { VariantCard } from "@/components/gallery/VariantCard";
import { useDesignStore } from "@/store/design-store";

export default function GalleryPage() {
  const router = useRouter();
  const parsedEntity = useDesignStore((s) => s.parsedEntity);
  const variants = useDesignStore((s) => s.variants);
  const setActiveDesign = useDesignStore((s) => s.setActiveDesign);

  if (!parsedEntity) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            No entity loaded. Please upload a YAML file first.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const handleSelectVariant = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant) {
      setActiveDesign(variantId, variant.design, variant.rubricScores);
      router.push(`/editor/${variantId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {parsedEntity.name} — Generated Variants
            </h1>
            <p className="text-gray-500 text-sm">
              Entity: {parsedEntity.name} |{" "}
              {parsedEntity.tiers.join(", ")} |{" "}
              {variants.length} variants generated
            </p>
          </div>
          <div className="flex gap-3">
            <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-xs">
              ✓ YAML parsed
            </span>
            <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-1.5 rounded-md text-sm">
              ⟳ Regenerate All
            </button>
          </div>
        </div>
      </header>

      {/* Variant grid */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {variants.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 animate-pulse">🔄</div>
            <p className="text-gray-400 text-lg">
              Generating design variants...
            </p>
            <p className="text-gray-600 text-sm mt-2">
              This may take a few minutes. Each variant goes through a
              multi-pass quality pipeline.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((variant) => (
              <VariantCard
                key={variant.id}
                design={variant.design}
                rubricScores={variant.rubricScores}
                isGenerating={variant.isGenerating}
                error={variant.error}
                onClick={() => handleSelectVariant(variant.id)}
              />
            ))}
          </div>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Click a variant to open it in the Design Studio →
        </p>
      </main>
    </div>
  );
}
