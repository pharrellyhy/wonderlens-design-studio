export type AssetPolicy =
  | "no_assets"
  | "optional_support"
  | "required_prebuilt"
  | "runtime_generated"
  | "blocked";

export interface AssetRequirement {
  assetId: string;
  assetType: string;
  requiredness: "required" | "optional" | "fallback";
  generationTiming:
    | "pre_generated"
    | "runtime_generated"
    | "display_existing"
    | "none";
  useStep: string;
  purpose?: string;
  promptEn?: string;
  source?: string;
  displayBehavior?: string;
  fallbackBehavior?: string;
  safetyConstraints?: string[];
}

export interface AdaptationReviewMetadata {
  inputMode?: "mapping_informed" | "parameterized" | "concept_only";
  canonicalMechanic?: string;
  readiness?:
    | "ready_to_generate"
    | "generate_with_assumptions"
    | "blocked_until_product_decision";
  triggerCondition?: string;
  mappingUse?: string;
  productCapabilityFlags: string[];
  scaffoldFit?: "strong" | "acceptable" | "weak";
  assumptions: string[];
}

export interface ActivityReviewMetadata {
  adaptation?: AdaptationReviewMetadata;
  assetPolicy: AssetPolicy | "unknown";
  assets: AssetRequirement[];
  sourceSections: {
    adaptationRationale?: string;
    assetBrief?: string;
  };
}

const ASSET_POLICIES = new Set<AssetPolicy>([
  "no_assets",
  "optional_support",
  "required_prebuilt",
  "runtime_generated",
  "blocked",
]);

const INPUT_MODES = new Set<NonNullable<AdaptationReviewMetadata["inputMode"]>>([
  "mapping_informed",
  "parameterized",
  "concept_only",
]);

const READINESS_VALUES = new Set<
  NonNullable<AdaptationReviewMetadata["readiness"]>
>([
  "ready_to_generate",
  "generate_with_assumptions",
  "blocked_until_product_decision",
]);

const SCAFFOLD_FIT_VALUES = new Set<
  NonNullable<AdaptationReviewMetadata["scaffoldFit"]>
>(["strong", "acceptable", "weak"]);

const REQUIREDNESS_VALUES = new Set<AssetRequirement["requiredness"]>([
  "required",
  "optional",
  "fallback",
]);

const GENERATION_TIMING_VALUES = new Set<AssetRequirement["generationTiming"]>([
  "pre_generated",
  "runtime_generated",
  "display_existing",
  "none",
]);

const EMPTY_REQUIREDNESS = "" as AssetRequirement["requiredness"];
const EMPTY_GENERATION_TIMING = "" as AssetRequirement["generationTiming"];

export function parseActivityReviewMetadata(
  specMarkdown: string,
): ActivityReviewMetadata {
  const adaptationRationale = extractMarkdownSection(
    specMarkdown,
    "Adaptation Rationale",
  );
  const assetBrief = extractMarkdownSection(specMarkdown, "Asset Brief");

  return {
    adaptation: adaptationRationale
      ? parseAdaptationRationale(adaptationRationale)
      : undefined,
    assetPolicy: parseAssetPolicy(assetBrief),
    assets: assetBrief ? parseAssets(assetBrief) : [],
    sourceSections: {
      ...(adaptationRationale ? { adaptationRationale } : {}),
      ...(assetBrief ? { assetBrief } : {}),
    },
  };
}

function parseAdaptationRationale(
  body: string,
): AdaptationReviewMetadata {
  const inputMode = parseEnum(field(body, "Input mode"), INPUT_MODES);
  const readiness = parseEnum(field(body, "Readiness"), READINESS_VALUES);
  const scaffoldFit = parseEnum(field(body, "Scaffold fit"), SCAFFOLD_FIT_VALUES);

  return {
    ...(inputMode ? { inputMode } : {}),
    canonicalMechanic: field(body, "Canonical mechanic"),
    ...(readiness ? { readiness } : {}),
    triggerCondition: field(body, "Trigger condition"),
    mappingUse: field(body, "Mapping use"),
    productCapabilityFlags: splitList(field(body, "Product capability flags")),
    ...(scaffoldFit ? { scaffoldFit } : {}),
    assumptions: nestedList(body, "Assumptions", field(body, "Assumptions")),
  };
}

function parseAssetPolicy(body: string | undefined): AssetPolicy | "unknown" {
  if (!body) return "unknown";
  const raw = field(body, "Asset policy");
  return parseEnum(raw, ASSET_POLICIES) ?? "unknown";
}

function parseAssets(body: string): AssetRequirement[] {
  const chunks = splitAssetChunks(body);
  return chunks.map(({ assetId, body: chunkBody }) => ({
    assetId,
    assetType: field(chunkBody, "Asset type") ?? "",
    requiredness:
      parseEnum(field(chunkBody, "Requiredness"), REQUIREDNESS_VALUES) ??
      EMPTY_REQUIREDNESS,
    generationTiming:
      parseEnum(field(chunkBody, "Generation timing"), GENERATION_TIMING_VALUES) ??
      EMPTY_GENERATION_TIMING,
    useStep: field(chunkBody, "Use step") ?? "",
    purpose: field(chunkBody, "Purpose"),
    promptEn: field(chunkBody, "Prompt_en") ?? field(chunkBody, "Prompt en"),
    source: field(chunkBody, "Source"),
    displayBehavior: field(chunkBody, "Display behavior"),
    fallbackBehavior: field(chunkBody, "Fallback behavior"),
    safetyConstraints: splitList(field(chunkBody, "Safety constraints")),
  }));
}

function extractMarkdownSection(
  markdown: string,
  heading: string,
): string | undefined {
  const re = new RegExp(
    `^##\\s+${escapeRe(heading)}[ \\t]*\\r?\\n([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`,
    "im",
  );
  const match = re.exec(markdown);
  const body = match?.[1]?.trim();
  return body ? body : undefined;
}

function splitAssetChunks(body: string): Array<{ assetId: string; body: string }> {
  const chunks: Array<{ assetId: string; body: string }> = [];
  const re = /^###\s+Asset:\s*([a-zA-Z0-9_-]+)\s*$/gim;
  const matches = [...body.matchAll(re)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    const start = (match.index ?? 0) + match[0].length;
    const end = next?.index ?? body.length;
    chunks.push({
      assetId: match[1].trim(),
      body: body.slice(start, end).trim(),
    });
  }

  return chunks;
}

function field(body: string, label: string): string | undefined {
  const re = new RegExp(
    `^-\\s+\\*\\*${labelPattern(label)}:?\\*\\*:?\\s*(.+?)\\s*$`,
    "im",
  );
  const match = re.exec(body);
  return match?.[1]?.trim().replace(/`/g, "") || undefined;
}

function nestedList(
  body: string,
  label: string,
  inlineValue: string | undefined,
): string[] {
  const labelRe = new RegExp(
    `^-\\s+\\*\\*${labelPattern(label)}:?\\*\\*:?`,
    "i",
  );
  const lines = body.split("\n");
  const labelIndex = lines.findIndex((line) => labelRe.test(line.trim()));
  if (labelIndex >= 0) {
    const nested: string[] = [];
    for (const line of lines.slice(labelIndex + 1)) {
      if (/^-\s+\*\*.+\*\*/.test(line.trim()) || /^#{2,}\s+/.test(line)) {
        break;
      }
      const match = /^\s{2,}-\s+(.+?)\s*$/.exec(line);
      if (match) nested.push(match[1].trim());
    }
    if (nested.length > 0) return nested;
  }
  return splitList(inlineValue);
}

function labelPattern(label: string): string {
  return label.toLowerCase().replace(/[_\s]+/g, "[_\\s]+");
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEnum<T extends string>(
  value: string | undefined,
  allowed: ReadonlySet<T>,
): T | undefined {
  if (!value) return undefined;
  return allowed.has(value as T) ? (value as T) : undefined;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
