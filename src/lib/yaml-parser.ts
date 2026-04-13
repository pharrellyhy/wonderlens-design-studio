import yaml from "js-yaml";

export interface EntityAttribute {
  attribute: string;
  value: string;
  topics?: string[];
}

export interface TierGuidance {
  appearance?: EntityAttribute[];
  senses?: EntityAttribute[];
  structure?: EntityAttribute[];
  function?: EntityAttribute[];
  context?: EntityAttribute[];
  emotions?: string[];
  imagination?: string[];
  narrative?: string[];
  reasoning?: string[];
  relationship?: string[];
}

export interface ParsedEntity {
  name: string;
  themes: string[];
  keyConcepts: string[];
  relatedConcepts: string[];
  tiers: string[];
  dimensionSummary: Record<string, number>;
  rawYaml: string;
}

const TIER_MAP: Record<string, string> = {
  tier_0: "T0",
  tier_1: "T1",
  tier_2: "T2",
};

const DIMENSION_NAMES = [
  "appearance",
  "senses",
  "structure",
  "function",
  "context",
  "emotions",
  "imagination",
  "narrative",
  "reasoning",
  "relationship",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractConceptIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter(isRecord)
    .map((item) => item.concept_id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

function extractThemeIds(primary: unknown, secondary: unknown): string[] {
  const themes: string[] = [];

  if (isRecord(primary) && typeof primary.theme_id === "string") {
    themes.push(primary.theme_id);
  }

  if (Array.isArray(secondary)) {
    for (const t of secondary) {
      if (isRecord(t) && typeof t.theme_id === "string") {
        themes.push(t.theme_id);
      }
    }
  }

  return themes;
}

export function parseEntityYaml(yamlContent: string): ParsedEntity {
  const parsedYaml = yaml.load(yamlContent);

  // The YAML files are arrays of entities — pick the first one
  let entity: Record<string, unknown>;

  if (Array.isArray(parsedYaml) && parsedYaml.length > 0 && isRecord(parsedYaml[0])) {
    entity = parsedYaml[0];
  } else if (isRecord(parsedYaml)) {
    // Fallback: if it's a single object at top level, use it directly
    // Or if it has a single key wrapping the entity, unwrap it
    const keys = Object.keys(parsedYaml);
    if (keys.length === 1 && isRecord(parsedYaml[keys[0]])) {
      entity = parsedYaml[keys[0]] as Record<string, unknown>;
    } else {
      entity = parsedYaml;
    }
  } else {
    throw new Error("YAML must contain an entity mapping (object or array of objects).");
  }

  // Extract entity name
  const name =
    (typeof entity.entity_name === "string" && entity.entity_name) ||
    (typeof entity.entity_id === "string" && entity.entity_id) ||
    (typeof entity.entity === "string" && entity.entity) ||
    "Unknown Entity";

  // Extract themes
  const themes = extractThemeIds(entity.primary_theme, entity.secondary_themes);

  // Extract key concepts
  const keyConcepts = [
    ...extractConceptIds(entity.primary_key_concepts),
    ...extractConceptIds(entity.secondary_key_concepts),
  ];

  // Extract related concepts
  const relatedConcepts = extractConceptIds(entity.candidate_related_concepts);

  // Extract tier guidance
  const tierGuidanceRaw = isRecord(entity.tier_guidance) ? entity.tier_guidance : {};

  const tiers: string[] = [];
  const dimensionSummary: Record<string, number> = {};

  for (const [yamlKey, tierLabel] of Object.entries(TIER_MAP)) {
    const tierData = tierGuidanceRaw[yamlKey];
    if (!isRecord(tierData)) continue;

    tiers.push(tierLabel);

    // Dimensions are under tierData.dimensions
    const dimensions = isRecord(tierData.dimensions) ? tierData.dimensions : tierData;

    for (const dim of DIMENSION_NAMES) {
      const dimData = dimensions[dim];
      if (Array.isArray(dimData) && dimData.length > 0) {
        dimensionSummary[dim] = (dimensionSummary[dim] ?? 0) + dimData.length;
      }
    }
  }

  return {
    name,
    themes,
    keyConcepts,
    relatedConcepts,
    tiers,
    dimensionSummary,
    rawYaml: yamlContent,
  };
}
