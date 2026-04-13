"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { parseEntityYaml, type ParsedEntity } from "@/lib/yaml-parser";

interface YamlUploaderProps {
  onEntityParsed: (entity: ParsedEntity) => void;
}

export function YamlUploader({ onEntityParsed }: YamlUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEntity, setParsedEntity] = useState<ParsedEntity | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
        setParsedEntity(null);
        setError("Please upload a YAML file (.yaml or .yml)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content !== "string") {
            throw new Error("File contents could not be read as text.");
          }

          const entity = parseEntityYaml(content);
          setParsedEntity(entity);
          onEntityParsed(entity);
        } catch {
          setParsedEntity(null);
          setError("Failed to parse YAML file. Please check the format.");
        }
      };
      reader.readAsText(file);
    },
    [onEntityParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${
            dragActive
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 hover:border-gray-400"
          }
        `}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".yaml,.yml";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${
            dragActive ? "text-indigo-400" : "text-gray-500"
          }`}
        />
        <p className="text-lg text-gray-300 mb-2">
          Drop your entity YAML file here
        </p>
        <p className="text-sm text-gray-500">or click to browse</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Entity summary */}
      {parsedEntity && (
        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Entity Summary: {parsedEntity.name}
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 uppercase text-xs tracking-wider">
                Themes
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {parsedEntity.themes.map((t) => (
                  <span
                    key={t}
                    className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-gray-400 uppercase text-xs tracking-wider">
                Key Concepts
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {parsedEntity.keyConcepts.map((c) => (
                  <span
                    key={c}
                    className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded text-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-gray-400 uppercase text-xs tracking-wider">
                Available Tiers
              </span>
              <div className="mt-1 flex gap-1">
                {parsedEntity.tiers.map((t) => (
                  <span
                    key={t}
                    className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-gray-400 uppercase text-xs tracking-wider">
                Dimensions
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(parsedEntity.dimensionSummary).map(
                  ([dim, count]) => (
                    <span
                      key={dim}
                      className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs"
                    >
                      {dim}: {count}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
