import JSZip from "jszip";
import { JSON_SCHEMA, load as yamlLoad } from "js-yaml";
import { z } from "zod";

import {
  activityBundleSchema,
  type ActivityBundle,
  type Dashboard,
  type Prod,
  type Recap,
  type Spec,
  type TagBlock,
} from "./activity-bundle-schema";
import {
  type DialogueBlock,
  type Round,
  type RubricScores,
  type Step,
} from "./design-schema";

// ============================================================================
// Public types
// ============================================================================

export interface ImportedBundleResult {
  bundle: ActivityBundle;
  rubricScores: RubricScores;
  /**
   * True when a `## Self-Evaluation Scorecard` table in spec.md provided
   * a verdict for every dimension. The editor uses this to skip the
   * auto-rubric-rerun and render the author's PASS/FAIL pills as soon as
   * the import lands.
   */
  rubricEvaluated: boolean;
  sourceFormat: "zip" | "files";
}

const ALL_FAIL_RUBRIC: RubricScores = {
  d1: "fail",
  d2: "fail",
  d3: "fail",
  d4: "fail",
  d5: "fail",
  d6: "fail",
  d7: "fail",
  d8: "fail",
  d9: "fail",
  d10: "fail",
};

const RUBRIC_DIMENSION_KEYS = [
  "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10",
] as const;
type RubricKey = (typeof RUBRIC_DIMENSION_KEYS)[number];

/**
 * Extract D1..D10 verdicts from a `## Self-Evaluation Scorecard` table in
 * spec.md. Returns the parsed scores plus a flag indicating whether all 10
 * dimensions were accounted for.
 *
 * Table convention (consistent across canonical activities):
 *   | # | Dimension | Score | Notes |
 *   | 1 | V1 Technical Compliance | PASS | ... |
 *   | 8 | Entity Mapping Alignment | N/A | ... |
 *
 * `N/A` is treated as PASS — that's the rubric's documented convention for
 * dimensions that don't apply to a given activity (e.g., D8 on bound
 * activities that didn't go through a mapping-informed assignment).
 */
function parseSpecScorecard(
  specMarkdown: string,
): { scores: RubricScores; evaluated: boolean } {
  const scores: RubricScores = { ...ALL_FAIL_RUBRIC };
  const seen = new Set<RubricKey>();

  const re = /^\|\s*(\d+)\s*\|[^|]+\|\s*(PASS|FAIL|N\s*\/\s*A)\s*\|/gim;
  let match: RegExpExecArray | null;
  while ((match = re.exec(specMarkdown)) !== null) {
    const num = Number(match[1]);
    if (num < 1 || num > 10) continue;
    const key = `d${num}` as RubricKey;
    const verdict = match[2].toUpperCase().replace(/\s+/g, "");
    if (verdict === "PASS" || verdict === "N/A") {
      scores[key] = "pass";
    } else {
      scores[key] = "fail";
    }
    seen.add(key);
  }

  return { scores, evaluated: seen.size === RUBRIC_DIMENSION_KEYS.length };
}

export class BundleImportError extends Error {
  readonly missingFiles?: string[];
  readonly zodIssues?: z.core.$ZodIssue[];
  constructor(
    message: string,
    options?: {
      missingFiles?: string[];
      zodIssues?: z.core.$ZodIssue[];
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "BundleImportError";
    this.missingFiles = options?.missingFiles;
    this.zodIssues = options?.zodIssues;
  }
}

const REQUIRED_FILES = [
  "spec.md",
  "prod.md",
  "tag_block.yaml",
  "recap.template.yaml",
  "dashboard.template.yaml",
] as const;

type RequiredFileName = (typeof REQUIRED_FILES)[number];
type FileMap = Record<RequiredFileName, string>;

// ============================================================================
// Entry points
// ============================================================================

export async function importBundleFromZip(
  buf: ArrayBuffer,
): Promise<ImportedBundleResult> {
  const zip = await JSZip.loadAsync(buf);
  const fileMap = await locateZipFiles(zip);
  const rootDir = inferZipRootDir(zip);
  const bundle = parseBundleFromFileMap(fileMap, rootDir);
  const { scores, evaluated } = parseSpecScorecard(fileMap["spec.md"]);
  return {
    bundle,
    rubricScores: scores,
    rubricEvaluated: evaluated,
    sourceFormat: "zip",
  };
}

export async function importBundleFromFiles(
  files: File[],
): Promise<ImportedBundleResult> {
  const fileMap = await locateFolderFiles(files);
  // No reliable root dir from a file list — fall back to tagBlock.activity_id.
  const bundle = parseBundleFromFileMap(fileMap, undefined);
  const { scores, evaluated } = parseSpecScorecard(fileMap["spec.md"]);
  return {
    bundle,
    rubricScores: scores,
    rubricEvaluated: evaluated,
    sourceFormat: "files",
  };
}

// ============================================================================
// Locate the 5 required files in a JSZip archive
// ============================================================================

async function locateZipFiles(zip: JSZip): Promise<FileMap> {
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const found: Partial<FileMap> = {};

  for (const entry of entries) {
    const base = baseName(entry.name).toLowerCase();
    if ((REQUIRED_FILES as readonly string[]).includes(base)) {
      const text = await entry.async("string");
      found[base as RequiredFileName] = text;
    }
  }

  const missing = REQUIRED_FILES.filter((f) => found[f] === undefined);
  if (missing.length > 0) {
    throw new BundleImportError(
      `Bundle archive is missing required files: ${missing.join(", ")}`,
      { missingFiles: [...missing] },
    );
  }
  return found as FileMap;
}

function inferZipRootDir(zip: JSZip): string | undefined {
  const tops = new Set<string>();
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const idx = entry.name.indexOf("/");
    if (idx > 0) tops.add(entry.name.slice(0, idx));
  }
  return tops.size === 1 ? [...tops][0] : undefined;
}

// ============================================================================
// Locate the 5 required files from a folder picker File[]
// ============================================================================

async function locateFolderFiles(files: File[]): Promise<FileMap> {
  const found: Partial<FileMap> = {};
  for (const file of files) {
    const base = baseName(file.name).toLowerCase();
    if ((REQUIRED_FILES as readonly string[]).includes(base)) {
      found[base as RequiredFileName] = await file.text();
    }
  }
  const missing = REQUIRED_FILES.filter((f) => found[f] === undefined);
  if (missing.length > 0) {
    throw new BundleImportError(
      `Selected folder is missing required files: ${missing.join(", ")}`,
      { missingFiles: [...missing] },
    );
  }
  return found as FileMap;
}

function baseName(p: string): string {
  return p.split("/").filter(Boolean).pop() ?? p;
}

// ============================================================================
// Parse + validate
// ============================================================================

function parseBundleFromFileMap(
  files: FileMap,
  rootDir: string | undefined,
): ActivityBundle {
  const tagBlock = parseTagBlockYaml(files["tag_block.yaml"]);
  const recap = parseRecapYaml(files["recap.template.yaml"]);
  const dashboard = parseDashboardYaml(files["dashboard.template.yaml"]);
  const spec = parseSpecMarkdown(files["spec.md"]);
  const prod = parseProdMarkdown(files["prod.md"]);

  // activityId source priority: tagBlock.activity_id (always present),
  // verified against zip rootDir when supplied. A mismatch is informative —
  // it usually means the zip was repacked under a different folder name and
  // we want to flag that early rather than silently accept the YAML.
  const activityId = tagBlock.activity_id;
  if (rootDir !== undefined && rootDir !== activityId) {
    throw new BundleImportError(
      `Zip root directory '${rootDir}' does not match tag_block.activity_id '${activityId}'`,
    );
  }

  // generationMode is not part of the on-disk activity layout. We accept it
  // via a passthrough key on tag_block; if missing we default to freeform
  // (the conservative choice — mapping-informed mode binds outputs more
  // tightly to entity dimensions, so wrongly defaulting to it would lock
  // imports we shouldn't lock).
  const xMode = (tagBlock as Record<string, unknown>)["x_generation_mode"];
  const generationMode =
    xMode === "mapping-informed" || xMode === "freeform"
      ? xMode
      : "freeform";

  const bundleInput = {
    schemaVersion: 1 as const,
    activityId,
    generationMode,
    spec,
    prod,
    tagBlock,
    recap,
    dashboard,
  };

  const result = activityBundleSchema.safeParse(bundleInput);
  if (!result.success) {
    throw new BundleImportError(
      `Bundle failed schema validation:\n${formatZodIssues(result.error.issues)}`,
      { zodIssues: [...result.error.issues] },
    );
  }
  return result.data;
}

function formatZodIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

// ============================================================================
// YAML parsers
// ============================================================================

function parseTagBlockYaml(text: string): TagBlock {
  const raw = loadYaml(text, "tag_block.yaml");
  if (!isObject(raw)) {
    throw new BundleImportError("tag_block.yaml is not a YAML mapping");
  }
  // Author-written tag_blocks use YAML 1.1 truthy strings on tier_support
  // (e.g. `{T0: yes, T1: yes, T2: yes}`). js-yaml in JSON_SCHEMA / default
  // mode parses YAML 1.2 and leaves those as strings, which fails the
  // `boolean` field type. Coerce yes/no/true/false strings so author-
  // written files round-trip without lossy hand-edits.
  const matchability = isObject(raw.matchability) ? raw.matchability : null;
  if (matchability && isObject(matchability.tier_support)) {
    const ts = matchability.tier_support as Record<string, unknown>;
    for (const tier of ["T0", "T1", "T2"] as const) {
      const v = ts[tier];
      if (typeof v === "string") {
        ts[tier] = /^(yes|true|on)$/i.test(v);
      }
    }
  }
  // Pre-validation happens centrally at activityBundleSchema.parse — here
  // we only decode YAML and normalise the few legacy ambiguities above.
  return raw as TagBlock;
}

function parseRecapYaml(text: string): Recap {
  const raw = loadYaml(text, "recap.template.yaml");
  if (!isObject(raw)) {
    throw new BundleImportError("recap.template.yaml is not a YAML mapping");
  }
  const recapPayload = pluck(raw, "recap_payload");
  const rendered = pluck(raw, "rendered");
  if (!isObject(recapPayload) || !isObject(rendered)) {
    throw new BundleImportError(
      "recap.template.yaml must contain top-level 'recap_payload' and 'rendered' mappings",
    );
  }

  const focal = pluck(recapPayload, "focal_attribute");
  if (!isObject(focal)) {
    throw new BundleImportError(
      "recap.template.yaml: focal_attribute must be a mapping",
    );
  }

  return {
    payloadDefaults: {
      entity: asString(recapPayload, "entity"),
      tier: asString(recapPayload, "tier"),
      ageYears: asString(recapPayload, "age_years"),
      whatWeNoticed: asString(
        recapPayload,
        "what_we_noticed",
      ) as Recap["payloadDefaults"]["whatWeNoticed"],
      whatWeDid: asString(recapPayload, "what_we_did"),
      entityRole: asString(
        recapPayload,
        "entity_role",
      ) as Recap["payloadDefaults"]["entityRole"],
      focalAttribute: {
        token: asString(focal, "token"),
        childLabel: asString(focal, "child_label"),
        badgeEmojiNone: asBoolean(focal, "badge_emoji_none"),
      },
      highlightMoment: asString(recapPayload, "highlight_moment"),
      finds: asFindsArray(recapPayload),
      difficultyLevel: asNumber(recapPayload, "difficulty_level"),
      nextStepHint: asString(recapPayload, "next_step_hint"),
      caregiverObserved: asString(
        recapPayload,
        "caregiver_observed",
      ) as Recap["payloadDefaults"]["caregiverObserved"],
      rewardBadge: asString(recapPayload, "reward_badge"),
    },
    rendered: {
      title: asString(rendered, "title"),
      line_1: asString(rendered, "line_1"),
      line_2: asString(rendered, "line_2"),
      line_3: asString(rendered, "line_3"),
      badge: asString(rendered, "badge"),
      next: asString(rendered, "next"),
    },
  };
}

function parseDashboardYaml(text: string): Dashboard {
  const raw = loadYaml(text, "dashboard.template.yaml");
  if (!isObject(raw)) {
    throw new BundleImportError(
      "dashboard.template.yaml is not a YAML mapping",
    );
  }
  const fragment = pluck(raw, "dashboard_fragment");
  if (!isObject(fragment)) {
    throw new BundleImportError(
      "dashboard.template.yaml must contain top-level 'dashboard_fragment' mapping",
    );
  }
  const session = pluck(fragment, "session");
  const contributesTo = pluck(fragment, "contributes_to");
  if (!isObject(session) || !isObject(contributesTo)) {
    throw new BundleImportError(
      "dashboard.template.yaml: 'session' and 'contributes_to' must be mappings",
    );
  }
  const radial = pluck(contributesTo, "curiosity_radial");
  const matrix = pluck(contributesTo, "exploration_matrix");
  const exposure = pluck(contributesTo, "key_concepts_exposure");
  if (!isObject(radial) || !isObject(matrix) || !isObject(exposure)) {
    throw new BundleImportError(
      "dashboard.template.yaml: contributes_to fields must be mappings",
    );
  }

  return {
    session: {
      axis: asString(session, "axis") as Dashboard["session"]["axis"],
      angle: asString(session, "angle") as Dashboard["session"]["angle"],
      mechanic: asString(session, "mechanic") as Dashboard["session"]["mechanic"],
      entityRole: asString(
        session,
        "entity_role",
      ) as Dashboard["session"]["entityRole"],
      focalAttribute: asString(session, "focal_attribute"),
      entryRung: asString(session, "entry_rung"),
      exitRung: asString(session, "exit_rung"),
      outcome: asString(session, "outcome"),
    },
    contributesTo: {
      curiosityRadial: {
        axis: asString(radial, "axis") as Dashboard["session"]["axis"],
        angle: asString(radial, "angle") as Dashboard["session"]["angle"],
      },
      explorationMatrix: {
        cell: asString(matrix, "cell"),
      },
      keyConceptsExposure: Object.fromEntries(
        Object.entries(exposure).map(([concept, raw]) => {
          if (!isObject(raw)) {
            throw new BundleImportError(
              `dashboard.template.yaml: key_concepts_exposure.${concept} must be a mapping`,
            );
          }
          return [
            concept,
            { angle: asString(raw, "angle") as Dashboard["session"]["angle"] },
          ];
        }),
      ) as Dashboard["contributesTo"]["keyConceptsExposure"],
      atlSkillsTrail: asStringArray(contributesTo, "atl_skills_trail"),
    },
  };
}

// ============================================================================
// Markdown parsers — narrow, matched against bundle-export.ts output
// ============================================================================

function parseSpecMarkdown(text: string): Spec {
  const sections = splitByHeading(text, /^##\s+/m);
  const intro = sections.shift() ?? "";
  const titleMatch = /^#\s+(.+?)\s*$/m.exec(intro);
  if (!titleMatch) {
    throw new BundleImportError("spec.md: missing top-level '# Title' heading");
  }
  const title = titleMatch[1].trim();
  const subtitle = matchOne(intro, /^>\s+(.+?)\s*$/m);

  const map = sectionsByHeading(sections);
  const targetBody = required(map, "Target");
  const triggerBody = required(map, "Selection trigger");
  const identityBody = required(map, "Experience pillar & game style");

  const ibAxisRaw = bulletField(targetBody, "IB axis");
  const [ibAxisPrimary, ibAxisSecondary] = splitIbAxis(ibAxisRaw);
  const primaryRungLabel = bulletField(targetBody, "Primary rung");

  const triggerLines = triggerBody.split("\n");
  const description = takeLeadingPara(triggerLines);
  const tierGuidanceAttributeIds = collectAttributeBullets(triggerLines);
  // Trailing prose: lines AFTER the last attribute bullet (regardless of
  // intervening blank lines).
  const lastBulletIdx = lastIndexOfAttributeBullet(triggerLines);
  const trailing =
    lastBulletIdx >= 0 ? triggerLines.slice(lastBulletIdx + 1) : [];
  const constellationNotes = takeTrailingPara(trailing);

  return {
    title,
    subtitle: subtitle ?? undefined,
    premise: required(map, "Premise"),
    target: {
      ibAxisPrimary,
      ibAxisSecondary,
      primaryTier: parseTierFromLabel(primaryRungLabel),
      tierElasticity: bulletField(targetBody, "Tier elasticity"),
      ageNotes: bulletField(targetBody, "Age tier"),
    },
    pedagogicalRationale: required(map, "Pedagogical rationale"),
    selectionTrigger: {
      description,
      tierGuidanceAttributeIds,
      constellationNotes: constellationNotes ?? undefined,
    },
    identity: {
      // Author-written specs append parenthetical commentary after each
      // identity value (e.g. "`pattern` (the butterfly's wing pattern…)").
      // Strip code fences AND parentheticals on every field so we get the
      // bare token regardless of whether the file came from the renderer
      // (no parenthetical) or a human author (often with one).
      pillar: stripParenthetical(
        bulletField(identityBody, "Pillar"),
      ) as Spec["identity"]["pillar"],
      gameStyle: stripCodeFences(
        stripParenthetical(bulletField(identityBody, "Game style")),
      ),
      mechanic: stripCodeFences(
        stripParenthetical(bulletField(identityBody, "Mechanic")),
      ) as Spec["identity"]["mechanic"],
      observationAngle: stripCodeFences(
        stripParenthetical(bulletField(identityBody, "Observation angle")),
      ) as Spec["identity"]["observationAngle"],
      entityRole: stripCodeFences(
        stripParenthetical(bulletField(identityBody, "Entity role")),
      ) as Spec["identity"]["entityRole"],
    },
  };
}

function parseProdMarkdown(text: string): Prod {
  // Renderer output starts with `## {activityName}` directly, so the first
  // (and only) `##` chunk holds the title plus all `###` subsections. Any
  // preamble before the first `##` (rare) is discarded.
  const top = splitByHeading(text, /^##\s+/m);
  const titleAndBody = top.length > 1 ? top[1] : top[0] ?? "";
  if (!/^##\s+/.test(titleAndBody)) {
    throw new BundleImportError(
      "prod.md: missing activity-name '## …' heading",
    );
  }

  const subSections = splitByHeading(titleAndBody, /^###\s+/m);
  // Drop the title chunk (everything before the first ###).
  if (subSections.length > 0 && /^##\s+/.test(subSections[0])) {
    subSections.shift();
  }
  const map = sectionsByHeading(subSections);

  const basicBody = required(map, "A. Basic Info");
  const attrsBody = map.get("A.1 Entity Attributes Covered");
  const constellationBody = map.get("A.2 Constellation Adaptation Notes");
  const overviewBody = required(map, "B. Activity Overview");
  const flowBody = required(map, "C. Interaction Flow");

  const basicInfo = parseBasicInfoTable(basicBody);
  const entityAttributesCovered = attrsBody
    ? parseEntityAttributesYaml(attrsBody)
    : [];
  const constellationAdaptation = constellationBody
    ? parseConstellationLists(constellationBody)
    : undefined;
  const { overview, kud } = parseOverviewBullets(overviewBody);
  const steps = parseSteps(flowBody);

  return {
    basicInfo,
    entityAttributesCovered,
    ...(constellationAdaptation
      ? { constellationAdaptation }
      : {}),
    overview,
    kud,
    steps,
  };
}

// ============================================================================
// Markdown helpers
// ============================================================================

function splitByHeading(text: string, headingRe: RegExp): string[] {
  // Split keeping the heading lines attached to the following section.
  const out: string[] = [];
  let cursor = 0;
  const re = new RegExp(headingRe.source, headingRe.flags.replace("m", "") + "gm");
  for (const match of text.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > cursor) out.push(text.slice(cursor, idx));
    cursor = idx;
  }
  if (cursor <= text.length) out.push(text.slice(cursor));
  return out;
}

function sectionsByHeading(sections: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const section of sections) {
    const m = /^#{2,4}\s+(.+?)\s*$/m.exec(section);
    if (!m) continue;
    const heading = m[1].trim();
    const body = section.slice(m[0].length).replace(/^\n+/, "").trimEnd();
    map.set(heading, body);
  }
  return map;
}

function required(map: Map<string, string>, heading: string): string {
  const body = map.get(heading);
  if (body === undefined || body === "") {
    throw new BundleImportError(`Missing required section: '${heading}'`);
  }
  return body;
}

function matchOne(text: string, re: RegExp): string | undefined {
  const m = re.exec(text);
  return m ? m[1].trim() : undefined;
}

function bulletField(body: string, label: string): string {
  const re = new RegExp(
    `^-\\s+\\*\\*${escapeRe(label)}:?\\*\\*:?\\s*(.+?)\\s*$`,
    "im",
  );
  const m = re.exec(body);
  if (!m) {
    throw new BundleImportError(`Missing bullet field '**${label}:**'`);
  }
  return m[1].trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCodeFences(s: string): string {
  return s.replace(/`/g, "").trim();
}

function stripParenthetical(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function splitIbAxis(raw: string): [string, string | undefined] {
  const idx = raw.indexOf(" + ");
  if (idx < 0) return [raw.trim(), undefined];
  return [raw.slice(0, idx).trim(), raw.slice(idx + 3).trim()];
}

function parseTierFromLabel(label: string): "T0" | "T1" | "T2" {
  const m = /\bT([0-2])\b/.exec(label);
  if (!m) {
    throw new BundleImportError(
      `Cannot parse tier from primary-rung label: ${label}`,
    );
  }
  return ("T" + m[1]) as "T0" | "T1" | "T2";
}

function indexOfDrivesOff(lines: string[]): number {
  return lines.findIndex((l) => /^drives off/i.test(l.trim()));
}

function takeLeadingPara(lines: string[]): string {
  // Lines up to (but not including) the "Drives off …" anchor or the first
  // attribute-id bullet, whichever comes first.
  const drivesIdx = indexOfDrivesOff(lines);
  const firstBulletIdx = lines.findIndex((l) =>
    /^-\s+`[a-z0-9_.]+`/i.test(l.trim()),
  );
  const stop = [drivesIdx, firstBulletIdx]
    .filter((i) => i >= 0)
    .reduce((acc, v) => Math.min(acc, v), lines.length);
  return lines.slice(0, stop).join("\n").trim();
}

function takeTrailingPara(lines: string[]): string | undefined {
  const text = lines.join("\n").trim();
  return text.length > 0 ? text : undefined;
}

function collectAttributeBullets(lines: string[]): string[] {
  // Capture every backtick-wrapped token in any bullet under the Selection
  // trigger section. Author files use two flavours:
  //   - `tier_0.appearance.color — most common path (raincoat, …)`
  //   - `primary bridge: \`pattern\``  (with `color`, `shape` extras)
  // Both are acceptable here; the schema only requires at least one entry.
  const out: string[] = [];
  for (const l of lines) {
    const trimmed = l.trim();
    if (!trimmed.startsWith("-")) continue;
    const re = /`([^`]+)`/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(trimmed)) !== null) {
      out.push(m[1]);
    }
  }
  if (out.length === 0) {
    throw new BundleImportError(
      "spec.md Selection trigger: no backtick-wrapped attribute or bridge tokens found",
    );
  }
  return out;
}

function lastIndexOfAttributeBullet(lines: string[]): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("-") && /`[^`]+`/.test(trimmed)) return i;
  }
  return -1;
}

// ── prod.md helpers ─────────────────────────────────────────────────────────

function parseBasicInfoTable(body: string): Prod["basicInfo"] {
  const rows = new Map<string, string>();
  const re = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const key = m[1].trim();
    const val = m[2].trim();
    if (/^-+$/.test(val) || key === "Field") continue;
    rows.set(key, val);
  }

  const cat = rows.get("Activity Category") ?? "";
  const activityCategory = /In-Device|Sustained Verbal/i.test(cat)
    ? "cat1"
    : "cat5";
  const tierLabel = rows.get("Recommended Tier") ?? "T1";

  return {
    activityName: requireRow(rows, "Activity Name"),
    activityCategory,
    recommendedTier: parseTierFromLabel(tierLabel),
    coreIbKeyConcepts: extractIbKeyConcepts(
      requireRow(rows, "Core IB Key Concepts"),
    ) as Prod["basicInfo"]["coreIbKeyConcepts"],
    relatedConcepts: splitCsv(rows.get("Related Concepts") ?? ""),
    atlSkillsFocus: splitCsv(rows.get("ATL Skills Focus") ?? ""),
    gameStyle: requireRow(rows, "Game Style"),
    designVersion: rows.get("Design Version") ?? "1.0",
    lastUpdated: rows.get("Last Updated") ?? "1970-01-01",
  };
}

const IB_KEY_CONCEPTS = [
  "Form",
  "Function",
  "Causation",
  "Change",
  "Connection",
  "Perspective",
  "Responsibility",
] as const;

/**
 * Pull canonical IB key-concept names out of a cell that may use plain
 * comma-separation (`Form, Causation`) OR a decorated form
 * (`**Form** (What is it like?) & **Connection** (...)`). Order is preserved
 * by first occurrence in the cell text.
 */
function extractIbKeyConcepts(cell: string): string[] {
  const found: string[] = [];
  // Strip markdown emphasis so the regex can word-boundary against bare
  // names; parenthetical glosses are ignored.
  const cleaned = cell.replace(/\*\*/g, "");
  for (const concept of IB_KEY_CONCEPTS) {
    if (new RegExp(`\\b${concept}\\b`).test(cleaned)) {
      found.push(concept);
    }
  }
  if (found.length === 0) {
    throw new BundleImportError(
      `prod.md Basic Info: 'Core IB Key Concepts' cell did not contain any of ${IB_KEY_CONCEPTS.join(", ")} (got: '${cell}')`,
    );
  }
  return found;
}

function requireRow(rows: Map<string, string>, key: string): string {
  const v = rows.get(key);
  if (v === undefined || v === "") {
    throw new BundleImportError(`prod.md Basic Info table: missing row '${key}'`);
  }
  return v;
}

function splitCsv(s: string): string[] {
  return s
    .split(/\s*,\s*/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function parseEntityAttributesYaml(body: string): string[] {
  const fenceMatch = /```yaml\s*\n([\s\S]*?)\n```/m.exec(body);
  if (!fenceMatch) {
    throw new BundleImportError(
      "prod.md A.1: missing ```yaml fenced block for entity_attributes_covered",
    );
  }
  // Strip inline `# comment` annotations after each attribute id; many
  // canonical files use them to call out which entities each path covers.
  const out: string[] = [];
  for (const line of fenceMatch[1].split("\n")) {
    const m = /^\s*-\s+(\S+)/.exec(line);
    if (m) out.push(m[1]);
  }
  if (out.length === 0) {
    throw new BundleImportError(
      "prod.md A.1: entity_attributes_covered block is empty",
    );
  }
  return out;
}

function parseConstellationLists(body: string): Prod["constellationAdaptation"] {
  const slice = (heading: string): string[] => {
    const re = new RegExp(
      `\\*\\*${escapeRe(heading)}\\*\\*[^\\n]*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n###|$)`,
      "i",
    );
    const m = re.exec(body);
    if (!m) return [];
    return m[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("- "))
      .map((l) => l.replace(/^-\s+/, ""));
  };
  return {
    preserve: slice("Preserve"),
    swap: slice("Swap"),
    watch: slice("Watch"),
  };
}

function parseOverviewBullets(body: string): {
  overview: Prod["overview"];
  kud: Prod["kud"];
} {
  const matchBullet = (label: string): string | undefined => {
    // Accept either `- **① …**` (canonical bullet) OR `**① …**` (some author
    // files omit the leading dash). The capture stops at the next bullet
    // (with or without dash) or the next `###` heading or end-of-string.
    // `(?![\s\S])` is an end-of-string assertion; `$` in multiline mode
    // matches every end-of-line and would terminate the lazy capture after
    // one line.
    const re = new RegExp(
      `^(?:-\\s+)?\\*\\*[①②③④]?\\s*${escapeRe(label)}\\*\\*:?\\s*([\\s\\S]+?)(?=\\n(?:-\\s+)?\\*\\*[①②③④]|\\n###|(?![\\s\\S]))`,
      "im",
    );
    const m = re.exec(body);
    return m ? m[1].trim() : undefined;
  };
  const briefDescription = matchBullet("Brief Description") ?? "";
  const designHighlight = matchBullet("Design Highlight") ?? "";
  const typicalScenario = matchBullet("Typical Scenario") ?? "";

  const kudBlock = matchBullet("Educational Purpose (KUD)") ?? "";
  const know = matchSubBullet(kudBlock, "K (Know)");
  const understand = matchSubBullet(kudBlock, "U (Understand)");
  const doAction = matchSubBullet(kudBlock, "D (Do)");

  if (know.length === 0 || understand.length === 0 || doAction.length === 0) {
    throw new BundleImportError(
      "prod.md B. Activity Overview: KUD must have non-empty K, U, D lists",
    );
  }

  return {
    overview: {
      briefDescription,
      designHighlight,
      typicalScenario,
    },
    kud: {
      know,
      understand,
      do: doAction,
    },
  };
}

function matchSubBullet(body: string, label: string): string[] {
  // Accept BOTH `**K (Know)**: …` (colon outside bold) and
  // `**K (Know):** …` (colon inside) since author files use both.
  const re = new RegExp(
    `\\*\\*${escapeRe(label)}:?\\*\\*:?\\s*([^\\n]+)`,
    "i",
  );
  const m = re.exec(body);
  if (!m) return [];
  // Author content uses both `; ` (semicolons) and prose-with-periods to
  // separate KUD items. Treat each KUD slot as one prose item — splitting
  // on periods would shred sentences mid-thought. The renderer joins on
  // `; ` so semicolon-separated input also round-trips cleanly.
  return [m[1].trim()].filter(Boolean);
}

function parseSteps(flowBody: string): Step[] {
  const sections = splitByHeading(flowBody, /^####\s+/m);
  // Discard preamble (`> Recommended Tier:` line).
  sections.shift();

  const out: Step[] = [];
  for (const sec of sections) {
    const headingMatch = /^####\s+Step\s+(\d+):\s*(.+?)\s*$/m.exec(sec);
    if (!headingMatch) continue;
    const stepNumber = Number(headingMatch[1]);
    const title = headingMatch[2].trim();
    const body = sec.slice(headingMatch[0].length).replace(/^\n+/, "");
    out.push(buildStep(stepNumber, title, body));
  }
  if (out.length === 0) {
    throw new BundleImportError(
      "prod.md C. Interaction Flow: no '#### Step N:' headings found",
    );
  }
  return out;
}

function buildStep(stepNumber: number, title: string, body: string): Step {
  const type = stepTypeFor(stepNumber);

  if (type === "rounds") {
    const roundChunks = splitByRoundHeading(body);
    const rounds: Round[] = [];
    for (const chunk of roundChunks) {
      const m = /^\*\*Round\s+(\d+)(?:\s*[—-]\s*[^*]+?)?\s*(?:\(full detail\))?\*\*\s*([\s\S]*)$/m.exec(
        chunk,
      );
      if (!m) continue;
      const roundNumber = Number(m[1]);
      const rest = m[2].trim();
      // Round 1 has full dialogue; Round 2+ are one-line summaries (no
      // **AI says:** marker). We synthesize a stub dialogue from the
      // summary so the schema stays uniform.
      if (/\*\*AI says:\*\*/i.test(rest)) {
        rounds.push({ roundNumber, dialogue: parseDialogueBlock(rest) });
      } else {
        rounds.push({
          roundNumber,
          dialogue: stubDialogueFromSummary(rest),
        });
      }
    }
    if (rounds.length === 0) {
      throw new BundleImportError(
        `prod.md Step ${stepNumber}: no rounds parsed`,
      );
    }
    return { stepNumber, title, type, rounds };
  }

  if (type === "bridge") {
    return {
      stepNumber,
      title,
      type,
      coldStart: parseDialogueBlock(body),
    };
  }

  const step: Step = {
    stepNumber,
    title,
    type,
    dialogue: parseDialogueBlock(body),
  };
  if (type === "closing") {
    step.conceptReinforcement =
      matchOne(body, /^\*\*Concept reinforcement:\*\*\s*(.+?)\s*$/im) ?? "";
    step.tomorrowHook =
      matchOne(body, /^\*\*Tomorrow's hook:\*\*\s*(.+?)\s*$/im) ?? "";
  }
  return step;
}

function stepTypeFor(stepNumber: number): Step["type"] {
  if (stepNumber === 1) return "bridge";
  if (stepNumber === 2) return "rules";
  if (stepNumber === 3) return "rounds";
  if (stepNumber === 4) return "celebration";
  return "closing";
}

function splitByRoundHeading(body: string): string[] {
  // `(?![\s\S])` anchors at end-of-string; multiline `$` would terminate the
  // last round chunk after its first end-of-line.
  const re = /(^\*\*Round\s+\d+[\s\S]*?)(?=^\*\*Round\s+\d+|(?![\s\S]))/gm;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

function parseDialogueBlock(body: string): DialogueBlock {
  const aiSays = matchOne(body, /^\*\*AI says:\*\*\s*([\s\S]+?)(?=\n\n|\n\*\*|$)/m) ?? "";
  const childSection =
    extractBetween(body, /^\*\*Child responses:\*\*/m, /^\*\*AI follow-up:\*\*/m) ??
    "";
  const followSection =
    extractBetween(body, /^\*\*AI follow-up:\*\*/m, /^\*\*Screen:\*\*/m) ?? "";
  const screen = matchOne(body, /^\*\*Screen:\*\*\s*([\s\S]+?)\s*$/m) ?? "";

  const childItems = numberedItems(childSection).map(stripParentheticalLabel);
  const followItems = numberedItems(followSection);

  return {
    aiSays: aiSays.trim(),
    childResponses: {
      ideal: childItems[0] ?? "",
      unexpected: childItems[1] ?? "",
      silent: childItems[2] ?? "",
    },
    aiFollowUps: {
      ideal: followItems[0] ?? "",
      unexpected: followItems[1] ?? "",
      silent: followItems[2] ?? "",
    },
    screenDescription: screen.trim(),
  };
}

function stubDialogueFromSummary(summary: string): DialogueBlock {
  const trimmed = summary.replace(/\s+/g, " ").trim().replace(/[*]/g, "");
  return {
    aiSays: trimmed,
    childResponses: { ideal: "", unexpected: "", silent: "" },
    aiFollowUps: { ideal: "", unexpected: "", silent: "" },
    screenDescription: "",
  };
}

function extractBetween(
  text: string,
  start: RegExp,
  end: RegExp,
): string | undefined {
  const startMatch = start.exec(text);
  if (!startMatch) return undefined;
  const tail = text.slice(startMatch.index + startMatch[0].length);
  const endMatch = end.exec(tail);
  return endMatch ? tail.slice(0, endMatch.index) : tail;
}

function numberedItems(section: string): string[] {
  // Use [ \t] for inline whitespace (NOT \s, which spans newlines and would
  // let an empty `1. ` line greedily swallow the next `2. content` line into
  // its capture group). `(.*?)` allows empty bodies — important when the
  // dialogue block was synthesised from a one-line round summary and every
  // child response / follow-up slot is empty.
  const out: string[] = [];
  const re = /^\d+\.[ \t]*(.*?)[ \t]*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

function stripParentheticalLabel(s: string): string {
  // Drops a leading `(Ideal)` / `(Unexpected)` / `(No response)` marker that
  // the renderer adds to child-response items but the schema stores by name.
  return s.replace(/^\([^)]+\)\s*/, "").trim();
}

// ============================================================================
// YAML utility helpers
// ============================================================================

function loadYaml(text: string, fileLabel: string): unknown {
  try {
    return yamlLoad(text, { schema: JSON_SCHEMA });
  } catch (cause) {
    throw new BundleImportError(`Failed to parse ${fileLabel}`, { cause });
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pluck(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

function asString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string") {
    throw new BundleImportError(
      `Expected string at '${key}', got ${typeof v}`,
    );
  }
  return v;
}

function asNumber(obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  if (typeof v !== "number") {
    throw new BundleImportError(
      `Expected number at '${key}', got ${typeof v}`,
    );
  }
  return v;
}

function asBoolean(obj: Record<string, unknown>, key: string): boolean {
  const v = obj[key];
  if (typeof v !== "boolean") {
    throw new BundleImportError(
      `Expected boolean at '${key}', got ${typeof v}`,
    );
  }
  return v;
}

function asStringArray(obj: Record<string, unknown>, key: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
    throw new BundleImportError(
      `Expected string[] at '${key}', got ${JSON.stringify(v)}`,
    );
  }
  return v as string[];
}

function asFindsArray(obj: Record<string, unknown>): Array<{
  label: string;
  photo: string;
}> | undefined {
  const v = obj["finds"];
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) {
    throw new BundleImportError(`recap.payload.finds must be an array`);
  }
  return v.map((item, i) => {
    if (!isObject(item)) {
      throw new BundleImportError(
        `recap.payload.finds[${i}] must be a mapping`,
      );
    }
    return { label: asString(item, "label"), photo: asString(item, "photo") };
  });
}
