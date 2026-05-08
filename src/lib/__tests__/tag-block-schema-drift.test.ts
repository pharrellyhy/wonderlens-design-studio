// Drift test: every closed enum in `activity-bundle-schema.ts` must match the
// canonical list in `activities/_schema/tag_block.schema.json`. The JSON Schema
// is the source of truth shared with the matcher and the consumer repos
// (wonderlens-ai, wonderlens-activity-fullstack-demo); diverging silently here
// would let invalid bundles ship and break those consumers at runtime.
//
// Run: npx tsx --test src/lib/__tests__/tag-block-schema-drift.test.ts

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  caregiverRoleSchema,
  entityBindingSchema,
  entityRoleSchema,
  ibKeyConceptSchema,
  mechanicSchema,
  observationAngleSchema,
  tagBlockPillarSchema,
  templateTypeSchema,
  tierRangeSchema as _tierRangeSchema,
  topicAxisSchema,
} from "../activity-bundle-schema";
import { tierSchema } from "../design-schema";

// Silence unused warning while still re-exporting via `tierRangeSchema` if a
// future test wants to inspect its shape; keep import to surface a TS error if
// it gets removed.
void _tierRangeSchema;

interface JsonSchemaNode {
  enum?: string[];
  type?: string;
  items?: JsonSchemaNode;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  additionalProperties?: boolean;
}

function loadJsonSchema(): JsonSchemaNode {
  const schemaPath = path.join(
    process.cwd(),
    "activities",
    "_schema",
    "tag_block.schema.json",
  );
  return JSON.parse(readFileSync(schemaPath, "utf-8")) as JsonSchemaNode;
}

function pickEnum(root: JsonSchemaNode, jsonPointer: string): string[] {
  // Walks a Zod-style dotted path through the JSON schema's `properties`
  // tree, descending into `.items` when a segment is `[]`. Returns the
  // resolved node's `.enum`, throwing if any segment is missing — a missing
  // segment IS the drift the test exists to catch.
  const segments = jsonPointer.split(".");
  let node: JsonSchemaNode = root;
  for (const segment of segments) {
    if (segment === "[]") {
      const items = node.items;
      if (!items) {
        throw new Error(
          `JSON schema path ${jsonPointer} is missing 'items' at segment '[]'`,
        );
      }
      node = items;
      continue;
    }
    const props = node.properties;
    if (!props || !(segment in props)) {
      throw new Error(
        `JSON schema path ${jsonPointer} is missing property '${segment}'`,
      );
    }
    node = props[segment];
  }
  if (!node.enum) {
    throw new Error(
      `JSON schema path ${jsonPointer} did not resolve to an enum`,
    );
  }
  return node.enum;
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}

const root = loadJsonSchema();

const cases: Array<{
  name: string;
  zod: readonly string[];
  schemaPath: string;
}> = [
  {
    name: "observation_angle (activity_signature)",
    zod: observationAngleSchema.options,
    schemaPath: "activity_signature.observation_angle",
  },
  {
    name: "observation_angle (bridge_prerequisites.primary)",
    zod: observationAngleSchema.options,
    schemaPath: "activity_signature.bridge_prerequisites.primary.[]",
  },
  {
    name: "mechanic",
    zod: mechanicSchema.options,
    schemaPath: "activity_signature.mechanic",
  },
  {
    name: "entity_role",
    zod: entityRoleSchema.options,
    schemaPath: "activity_signature.entity_role",
  },
  {
    name: "key_concepts",
    zod: ibKeyConceptSchema.options,
    schemaPath: "key_concepts.[]",
  },
  {
    name: "topic_axis",
    zod: topicAxisSchema.options,
    schemaPath: "progression.topic_axis",
  },
  {
    name: "pillar",
    zod: tagBlockPillarSchema.options,
    schemaPath: "pillar",
  },
  {
    name: "entity_binding",
    zod: entityBindingSchema.options,
    schemaPath: "entity_binding",
  },
  {
    name: "template_type",
    zod: templateTypeSchema.options,
    schemaPath: "template_type",
  },
  {
    name: "caregiver_role",
    zod: caregiverRoleSchema.options,
    schemaPath: "caregiver_role.[]",
  },
  {
    name: "tier (tier_range.primary)",
    zod: tierSchema.options,
    schemaPath: "tier_range.primary",
  },
  {
    name: "tier (tier_range.span)",
    zod: tierSchema.options,
    schemaPath: "tier_range.span.[]",
  },
];

for (const { name, zod, schemaPath } of cases) {
  test(`enum drift: ${name}`, () => {
    const fromJson = pickEnum(root, schemaPath);
    assert.deepStrictEqual(
      sorted(zod),
      sorted(fromJson),
      `Zod enum for '${name}' diverges from activities/_schema/tag_block.schema.json (${schemaPath}).\n  zod:    ${JSON.stringify(sorted(zod))}\n  schema: ${JSON.stringify(sorted(fromJson))}`,
    );
  });
}
