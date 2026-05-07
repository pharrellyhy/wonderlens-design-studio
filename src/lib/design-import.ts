import {
  PILLAR_STYLES,
  gameDesignSchema,
  rubricScoresSchema,
  styleToPillar,
  type Category,
  type DialogueBlock,
  type ExperiencePillar,
  type GameDesign,
  type GenerationMode,
  type RubricIssue,
  type RubricScores,
  type Step,
} from "./design-schema";

export interface ImportedDesignResult {
  design: GameDesign;
  rubricScores: RubricScores;
  issues: RubricIssue[];
  sourceFormat: "json" | "markdown";
}

const FAILING_RUBRIC_SCORES: RubricScores = {
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

const LEGACY_STYLE_TO_PILLAR: Record<string, ExperiencePillar> = {
  voice_acting: "performance",
  storytelling_chain: "adventure",
  prediction_game: "discovery",
  helper_hotline: "nurture",
  comparison_chart: "discovery",
  naming_story: "creation",
};

interface MarkdownHeading {
  index: number;
  endIndex: number;
  fullTitle: string;
  stepNumber: number;
  stepSuffix: string;
}

interface RoundHeading {
  index: number;
  endIndex: number;
  roundNumber: number;
  title: string;
}

function stripMarkdown(value: string): string {
  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(/^["“”]+|["“”]+$/g, "").trim();
}

function stripListPrefix(value: string): string {
  return value.replace(/^\s*\d+\.\s*(?:\([^)]+\)\s*)?/, "").trim();
}

function cleanConceptName(value: string): string {
  return stripMarkdown(value).replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function splitList(value: string): string[] {
  return value
    .split(/\s*(?:,|&|;|\band\b)\s*/i)
    .map(cleanConceptName)
    .filter((item) => item.length > 0);
}

function extractSection(
  markdown: string,
  startPattern: RegExp,
  endPattern: RegExp,
): string {
  const startMatch = startPattern.exec(markdown);
  if (!startMatch) return "";
  const start = startMatch.index + startMatch[0].length;
  endPattern.lastIndex = start;
  const endMatch = endPattern.exec(markdown);
  const end = endMatch ? endMatch.index : markdown.length;
  return markdown.slice(start, end);
}

function extractTableValue(section: string, label: RegExp): string {
  const regex = new RegExp(
    String.raw`^\|\s*([^|]*${label.source}[^|]*)\s*\|\s*([^|]+?)\s*\|`,
    "im",
  );
  const match = regex.exec(section);
  return match ? stripMarkdown(match[2]) : "";
}

function extractLabeledLine(section: string, label: RegExp): string {
  const regex = new RegExp(
    String.raw`^-\s+\*\*([^*]*${label.source}[^*]*)\*\*:\s*(.+)$`,
    "im",
  );
  const match = regex.exec(section);
  return match ? stripMarkdown(match[2]) : extractTableValue(section, label);
}

function extractOverviewField(section: string, label: RegExp): string {
  const bulletRegex = new RegExp(
    String.raw`^-\s+\*\*[^*]*${label.source}[^*]*\*\*:\s*([\s\S]*?)(?=\n\s*-\s+\*\*|\n###|$)`,
    "im",
  );
  const bulletMatch = bulletRegex.exec(section);
  if (bulletMatch) return stripMarkdown(bulletMatch[1]);

  const inlineHeadingRegex = new RegExp(
    String.raw`^\*\*[^*]*${label.source}[^*]*\*\*:?\s*([\s\S]*?)(?=\n\*\*[^*]+\*\*:|\n###|$)`,
    "im",
  );
  const inlineHeadingMatch = inlineHeadingRegex.exec(section);
  if (inlineHeadingMatch) return stripMarkdown(inlineHeadingMatch[1]);

  const headingRegex = new RegExp(
    String.raw`^\*\*[^*]*${label.source}[^*]*\*\*\s*\n+([\s\S]*?)(?=\n\*\*[^*]+\*\*|\n###|$)`,
    "im",
  );
  const headingMatch = headingRegex.exec(section);
  return headingMatch ? stripMarkdown(headingMatch[1]) : "";
}

function extractKudValue(section: string, letter: "K" | "U" | "D"): string[] {
  const regex = new RegExp(
    String.raw`^\s*-\s+\*\*${letter}\s*\([^)]+\):?\*\*:?\s*(.+)$`,
    "im",
  );
  const match = regex.exec(section);
  return match ? splitList(match[1]) : [];
}

function extractDialogueField(section: string, label: string): string {
  const regex = new RegExp(
    String.raw`^(?:>\s*)?\*\*${label}:?\*\*:?\s*([\s\S]*?)(?=\n(?:>\s*)?\*\*(?:Possible child responses|Child responses|AI follow-up|Screen):?\*\*:?\s*|\n(?:#{2,4}\s+|\*\*(?:Step|Round)\s)|$)`,
    "im",
  );
  const match = regex.exec(section);
  return match ? stripMarkdown(match[1]) : "";
}

function sectionBetween(
  content: string,
  startLabel: RegExp,
  endLabel: RegExp,
): string {
  const startMatch = startLabel.exec(content);
  if (!startMatch) return "";
  const start = startMatch.index + startMatch[0].length;
  endLabel.lastIndex = start;
  const endMatch = endLabel.exec(content);
  const end = endMatch ? endMatch.index : content.length;
  return content.slice(start, end);
}

function extractNumberedItems(section: string): string[] {
  const items: string[] = [];
  const regex = /^(?:>\s*)?\d+\.\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(section)) !== null) {
    items.push(stripListPrefix(stripMarkdown(match[1])));
  }
  return items;
}

function parseDialogueBlock(content: string): DialogueBlock {
  const responsesSection = sectionBetween(
    content,
    /^(?:>\s*)?\*\*(?:Possible child responses|Child responses):?\*\*:?\s*$/im,
    /^(?:>\s*)?\*\*AI follow-up:?\*\*:?\s*$/im,
  );
  const followUpsSection = sectionBetween(
    content,
    /^(?:>\s*)?\*\*AI follow-up:?\*\*:?\s*$/im,
    /^(?:>\s*)?\*\*Screen:?\*\*:?\s*/im,
  );
  const responses = extractNumberedItems(responsesSection);
  const followUps = extractNumberedItems(followUpsSection);

  return {
    aiSays: extractDialogueField(content, "AI says"),
    childResponses: {
      ideal: responses[0] ?? "",
      unexpected: responses[1] ?? "",
      silent: responses[2] ?? "",
    },
    aiFollowUps: {
      ideal: followUps[0] ?? "",
      unexpected: followUps[1] ?? "",
      silent: followUps[2] ?? "",
    },
    screenDescription: extractDialogueField(content, "Screen"),
  };
}

function parseCategory(value: string, fileName: string): Category {
  const source = `${value} ${fileName}`.toLowerCase();
  return source.includes("cat5") || /\b5\b/.test(source) ? "cat5" : "cat1";
}

function parseTier(value: string): GameDesign["basicInfo"]["tier"] {
  const match = /\bT[0-2]\b/i.exec(value);
  return match ? (match[0].toUpperCase() as GameDesign["basicInfo"]["tier"]) : "T1";
}

function parseGenerationMode(markdown: string): GenerationMode {
  return /freeform/i.test(markdown) ? "freeform" : "mapping-informed";
}

function normalizeStyleAndPillar(
  rawStyle: string,
  category: Category,
): { gameStyle: string; experiencePillar: ExperiencePillar } {
  const trimmed = rawStyle.trim();
  const currentPillar = styleToPillar(trimmed);
  const experiencePillar = currentPillar ?? LEGACY_STYLE_TO_PILLAR[trimmed] ?? "discovery";
  return {
    experiencePillar,
    gameStyle: PILLAR_STYLES[experiencePillar][category],
  };
}

function getActivityName(markdown: string, basicInfoSection: string): string {
  const explicit = extractLabeledLine(basicInfoSection, /Activity Name/i);
  if (explicit) return explicit;

  const heading = /^##\s+Activity:\s*(.+)$/im.exec(markdown);
  if (heading) return stripMarkdown(heading[1]);

  const titleHeading = /^##\s+(.+)$/im.exec(markdown);
  return titleHeading ? stripMarkdown(titleHeading[1]) : "Imported Activity";
}

function parseStepHeadings(flowSection: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const regex =
    /^(?:#{4}\s+|\*\*)Step\s+(\d+)([ab])?:\s*([^\n]+)$/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(flowSection)) !== null) {
    headings.push({
      index: match.index,
      endIndex: match.index + match[0].length,
      fullTitle: stripMarkdown(match[3].replace(/\*\*.*$/, "")),
      stepNumber: Number(match[1]),
      stepSuffix: match[2]?.toLowerCase() ?? "",
    });
  }
  return headings;
}

function parseRoundHeadings(content: string): RoundHeading[] {
  const headings: RoundHeading[] = [];
  const regex =
    /^(?:>\s*)?\*\*(?:Round|Find)\s+(\d+)(?:\s*(?::|[-–—])\s*([^*]*?))?\*\*.*$/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    headings.push({
      index: match.index,
      endIndex: match.index + match[0].length,
      roundNumber: Number(match[1]),
      title: stripMarkdown(match[2] ?? ""),
    });
  }
  return headings;
}

function stripStepTitle(title: string): string {
  return title
    .replace(/\s+[-–—]\s+Warm Start$/i, "")
    .replace(/\s+[-–—]\s+Cold Start$/i, "")
    .trim();
}

function stepTypeFor(stepNumber: number): Step["type"] {
  if (stepNumber === 1) return "bridge";
  if (stepNumber === 2) return "rules";
  if (stepNumber === 3) return "rounds";
  if (stepNumber === 4) return "celebration";
  return "closing";
}

function parseSteps(flowSection: string): Step[] {
  const headings = parseStepHeadings(flowSection);
  const stepMap = new Map<number, Step>();

  headings.forEach((heading, index) => {
    const nextHeading = headings[index + 1];
    const content = flowSection.slice(
      heading.endIndex,
      nextHeading ? nextHeading.index : flowSection.length,
    );
    const stepNumber = heading.stepNumber;
    const baseStep =
      stepMap.get(stepNumber) ??
      ({
        stepNumber,
        title: stripStepTitle(heading.fullTitle),
        type: stepTypeFor(stepNumber),
      } satisfies Step);

    if (stepNumber === 1) {
      const block = parseDialogueBlock(content);
      if (heading.stepSuffix === "b" || /cold start/i.test(heading.fullTitle)) {
        baseStep.coldStart = block;
      } else {
        baseStep.warmStart = block;
      }
    } else if (stepNumber === 3) {
      const rounds = parseRoundHeadings(content).map((roundHeading, roundIndex, all) => {
        const nextRound = all[roundIndex + 1];
        const roundContent = content.slice(
          roundHeading.endIndex,
          nextRound ? nextRound.index : content.length,
        );
        return {
          roundNumber: roundHeading.roundNumber,
          dialogue: parseDialogueBlock(roundContent),
        };
      });
      if (rounds.length > 0) {
        baseStep.rounds = rounds;
      } else {
        baseStep.dialogue = parseDialogueBlock(content);
      }
    } else {
      baseStep.dialogue = parseDialogueBlock(content);
      if (baseStep.type === "closing") {
        baseStep.conceptReinforcement = baseStep.dialogue.aiSays;
        baseStep.tomorrowHook = "";
      }
    }

    stepMap.set(stepNumber, baseStep);
  });

  return Array.from(stepMap.values()).sort(
    (left, right) => left.stepNumber - right.stepNumber,
  );
}

function parseRubricScores(markdown: string): RubricScores {
  const scores: RubricScores = { ...FAILING_RUBRIC_SCORES };
  const regex = /^\|\s*(\d+)\s*\|[^|]*\|\s*(PASS|FAIL)\s*\|/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const dimension = Number(match[1]);
    if (dimension < 1 || dimension > 10) continue;
    const key = `d${dimension}` as keyof RubricScores;
    scores[key] = match[2].toLowerCase() as RubricScores[keyof RubricScores];
  }
  return scores;
}

function parseMarkdownDesign(fileName: string, markdown: string): ImportedDesignResult {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const basicInfoSection = extractSection(
    normalized,
    /^###\s+A\.\s+Basic Info\s*$/im,
    /^###\s+B\.\s+Activity Overview\s*$/gim,
  );
  const overviewSection = extractSection(
    normalized,
    /^###\s+B\.\s+Activity Overview\s*$/im,
    /^###\s+C\.\s+Interaction Flow/im,
  );
  const flowSection = extractSection(
    normalized,
    /^###\s+C\.\s+Interaction Flow[^\n]*$/im,
    /^##\s+Self-Evaluation Scorecard\s*$/gim,
  );

  const category = parseCategory(
    extractLabeledLine(basicInfoSection, /Activity Category/i),
    fileName,
  );
  const styleAndPillar = normalizeStyleAndPillar(
    extractLabeledLine(basicInfoSection, /Game Style/i),
    category,
  );
  const coreKeyConcepts = splitList(
    extractLabeledLine(basicInfoSection, /Core IB Key Concepts/i),
  );
  const relatedConcepts = splitList(
    extractLabeledLine(basicInfoSection, /Related Concepts/i),
  );

  const design = gameDesignSchema.parse({
    basicInfo: {
      activityName: getActivityName(normalized, basicInfoSection),
      category,
      tier: parseTier(extractLabeledLine(basicInfoSection, /Recommended Tier/i)),
      triggerEntity:
        extractLabeledLine(basicInfoSection, /Trigger Entity/i) ||
        "Imported entity",
      triggerScene:
        extractLabeledLine(basicInfoSection, /Trigger Scene/i) ||
        "Imported activity scene",
      coreKeyConcepts,
      relatedConcepts,
      atlSkills: splitList(extractLabeledLine(basicInfoSection, /ATL Skills/i)),
      gameStyle: styleAndPillar.gameStyle,
      experiencePillar: styleAndPillar.experiencePillar,
      ibTheme:
        extractLabeledLine(basicInfoSection, /IB Theme/i) ||
        "Imported theme",
      generationMode: parseGenerationMode(normalized),
    },
    creativeVariables: {
      metaphor: `${getActivityName(normalized, basicInfoSection)} review`,
      roleTitle: "",
      gameMechanic: extractLabeledLine(basicInfoSection, /Game Style/i),
      scenarioType: extractOverviewField(overviewSection, /Typical Scenario/i),
      targetResponseType: "",
      escalationAxis: "",
    },
    overview: {
      briefDescription: extractOverviewField(overviewSection, /Brief Description/i),
      kud: {
        know: extractKudValue(overviewSection, "K"),
        understand: extractKudValue(overviewSection, "U"),
        do: extractKudValue(overviewSection, "D"),
      },
      designHighlight: extractOverviewField(overviewSection, /Design Highlight/i),
      typicalScenario: extractOverviewField(overviewSection, /Typical Scenario/i),
    },
    steps: parseSteps(flowSection),
    entityMapping: {
      mappingSource:
        extractLabeledLine(basicInfoSection, /Mapping Source/i) || fileName,
      anchorDimensions: splitList(
        extractLabeledLine(basicInfoSection, /Dimension Anchors/i),
      ),
      conversationAnchorDimensions: splitList(
        extractLabeledLine(basicInfoSection, /Conversation Anchor Dimensions/i),
      ),
      themes: splitList(extractLabeledLine(basicInfoSection, /IB Theme/i)),
      keyConcepts: coreKeyConcepts,
    },
  });

  return {
    design,
    rubricScores: parseRubricScores(normalized),
    issues: [],
    sourceFormat: "markdown",
  };
}

function parseJsonDesign(raw: unknown): ImportedDesignResult {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("JSON import must contain a GameDesign object.");
  }

  const record = raw as Record<string, unknown>;
  const designCandidate = record.design ?? raw;
  const design = gameDesignSchema.parse(designCandidate);
  const rubricCandidate = record.rubricScores ?? record.rubric;
  const rubricResult = rubricScoresSchema.safeParse(rubricCandidate);

  return {
    design,
    rubricScores: rubricResult.success
      ? rubricResult.data
      : { ...FAILING_RUBRIC_SCORES },
    issues: [],
    sourceFormat: "json",
  };
}

export function importDesignFromFileText(
  fileName: string,
  fileText: string,
): ImportedDesignResult {
  const trimmed = fileText.trim();
  if (trimmed.length === 0) {
    throw new Error("Imported design file is empty.");
  }

  if (fileName.toLowerCase().endsWith(".json") || trimmed.startsWith("{")) {
    return parseJsonDesign(JSON.parse(trimmed));
  }

  if (fileName.toLowerCase().endsWith(".md") || trimmed.startsWith("#")) {
    return parseMarkdownDesign(fileName, trimmed);
  }

  throw new Error("Unsupported file type. Upload a WonderLens .md spec or GameDesign .json file.");
}
