import assert from "node:assert/strict";
import { test } from "node:test";

import { buildGenerateMessages } from "../prompts/generate";
import type { ParsedEntity } from "../yaml-parser";

const entity: ParsedEntity = {
  name: "leaf",
  themes: [],
  keyConcepts: [],
  relatedConcepts: [],
  tiers: ["T1"],
  dimensionSummary: { appearance: 1 },
  rawYaml: "entity_name: leaf",
};

test("generate prompt uses Nurture as the tag-block pillar vocabulary", () => {
  const messages = buildGenerateMessages(
    entity,
    "cat5",
    "rescue_team",
    "nurture",
    "mapping-informed",
  );
  const content = messages.map((message) => message.content).join("\n");

  assert.match(content, /"pillar": "Discovery" \| "Performance" \| "Mystery" \| "Creation" \| "Adventure" \| "Nurture"/);
  assert.match(content, /TagBlock pillar \(TitleCase\)\*\*: Nurture/);
  assert.doesNotMatch(content, /Adventure" \| "Connection"/);
  assert.doesNotMatch(content, /nurture:\s*"Connection"/);
});
