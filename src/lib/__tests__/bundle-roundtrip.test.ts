// Round-trip test: a hand-built ActivityBundle that semantically mirrors
// `activities/mystery_trail_butterfly/` is rendered to a zip, the zip is
// re-parsed, and the resulting bundle is asserted to match the original.
//
// We do NOT byte-compare against the on-disk activity files. The author-
// written copies use editorial flourishes (flow-style YAML, inline comments,
// a hand-written prose summary for Round 2+) that the renderer doesn't
// reproduce. The contract this test enforces is: bundle → render → re-parse
// must produce a semantically identical bundle.
//
// Run: ./node_modules/.bin/tsx --test src/lib/__tests__/bundle-roundtrip.test.ts

import assert from "node:assert/strict";
import { test } from "node:test";

import { activityBundleSchema } from "../activity-bundle-schema";
import type { ActivityBundle } from "../activity-bundle-schema";
import { bundleToZip } from "../bundle-export";
import { importBundleFromZip } from "../bundle-import";

const fixture: ActivityBundle = activityBundleSchema.parse({
  schemaVersion: 1,
  activityId: "mystery_trail_butterfly",
  generationMode: "freeform",
  spec: {
    title: "Mystery Trail Butterfly — Authoring Spec",
    subtitle:
      "Category 5 (Collection/Tracking Exploration) · Bound to butterfly · Mystery-trail with delayed pattern reveal",
    premise:
      "After a child photographs a butterfly on a flower, the AI marvels at the wings and recruits the child as a Butterfly World Detective.",
    target: {
      ibAxisPrimary: "Connection (primary, via habitat)",
      ibAxisSecondary: "Form (secondary, via observable clues)",
      primaryTier: "T1",
      tierElasticity: "T0–T2 (±1)",
      ageNotes: "child can hold a riddle in working memory long enough to search.",
    },
    pedagogicalRationale:
      "A butterfly's wing patterns make it a natural observation target, but the deeper idea is that no creature exists in isolation.",
    selectionTrigger: {
      description:
        "Fires when the matcher routes a photographed butterfly (or close constellation neighbor) to this activity. Entity-bound.",
      tierGuidanceAttributeIds: [
        "tier_0.appearance.wing_color",
        "tier_1.appearance.wing_patterns",
        "tier_1.context.flower_visits",
      ],
      constellationNotes:
        "Constellation neighbors substitute via data/constellation_map.yaml under mapped_entity: butterfly.",
    },
    identity: {
      pillar: "Mystery",
      gameStyle: "mystery_trail",
      mechanic: "collect",
      observationAngle: "pattern",
      entityRole: "subject",
    },
  },
  prod: {
    basicInfo: {
      activityName: "The Butterfly World Detectives",
      activityCategory: "cat5",
      recommendedTier: "T1",
      coreIbKeyConcepts: ["Form", "Causation"],
      relatedConcepts: ["Habitat", "Pattern", "Connection"],
      atlSkillsFocus: ["Research Skills", "Thinking Skills"],
      gameStyle: "mystery_trail",
      designVersion: "1.0",
      lastUpdated: "2026-04-21",
    },
    entityAttributesCovered: [
      "tier_0.appearance.wing_color",
      "tier_1.context.flower_visits",
    ],
    constellationAdaptation: {
      preserve: [
        "The Detective role_title and the delayed-reveal structure",
        "The 3-riddle arc mapping to food source, shelter, water",
      ],
      swap: [
        "Riddle-Clue #1 swaps for the neighbor's food source",
        "Riddle-Clue #2 swaps for the neighbor's shelter",
      ],
      watch: ["Moths are nocturnal", "Don't reveal the pattern early"],
    },
    overview: {
      briefDescription:
        "After the child photographs a butterfly on a flower, the AI gives riddle-clues one at a time.",
      designHighlight:
        "Riddle-driven search with a delayed pattern reveal — the child doesn't know WHY they're finding these specific things until the end.",
      typicalScenario:
        "Child photographs a butterfly on a flower in the park; AI recruits the child as a Detective and gives the first riddle-clue.",
    },
    kud: {
      know: ["Learn vocabulary like nectar, habitat, and shelter"],
      understand: ["the Form of things in nature reveals clues"],
      do: ["search for and photograph matching items"],
    },
    steps: [
      {
        stepNumber: 1,
        title: "Transition Bridge",
        type: "bridge",
        coldStart: {
          aiSays: "Look at that butterfly! Why did it choose THAT flower?",
          childResponses: {
            ideal: "Because it's pretty!",
            unexpected: "I want to catch it!",
            silent: "Child watches the butterfly quietly.",
          },
          aiFollowUps: {
            ideal: "I think you're RIGHT — the butterfly LOVES that flower!",
            unexpected: "It IS amazing to watch!",
            silent: "That butterfly chose this flower for a reason.",
          },
          screenDescription:
            "Butterfly photo centered with shimmering wing glow.",
        },
      },
      {
        stepNumber: 2,
        title: "Rule Introduction + Demo",
        type: "rules",
        dialogue: {
          aiSays: "You are now an official Butterfly World Detective!",
          childResponses: {
            ideal: "Ready!",
            unexpected: "What do I look for?",
            silent: "Child looks around the park with curiosity.",
          },
          aiFollowUps: {
            ideal: "Here comes your first riddle-clue!",
            unexpected: "Each one describes something nearby.",
            silent: "Okay Detective, here's how it works.",
          },
          screenDescription:
            "Detective-themed mission card with badge and 3 empty slots.",
        },
      },
      {
        stepNumber: 3,
        title: "Multi-Round Interaction",
        type: "rounds",
        rounds: [
          {
            roundNumber: 1,
            dialogue: {
              aiSays:
                "Riddle-Clue number one! It's BRIGHT and colorful. It has a sweet smell.",
              childResponses: {
                ideal: "A flower!",
                unexpected: "Is it this?",
                silent: "Child looks around but doesn't photograph.",
              },
              aiFollowUps: {
                ideal: "YES, Detective! A flower — that's it!",
                unexpected: "Ooh, interesting guess!",
                silent: "Detective hint! Think about the butterfly was sitting on.",
              },
              screenDescription:
                "New photo slides into first slot with golden sparkles.",
            },
          },
          {
            roundNumber: 2,
            dialogue: {
              aiSays:
                "Riddle-Clue number two! Something green and flat that creatures hide under.",
              childResponses: {
                ideal: "A leaf!",
                unexpected: "Grass?",
                silent: "Child looks at the grass.",
              },
              aiFollowUps: {
                ideal: "Yes! Leaves are butterfly shelter and caterpillar food.",
                unexpected: "Close! Look for something with a wider surface.",
                silent: "Look around for wide green leaves.",
              },
              screenDescription: "Second slot fills with leaf photo.",
            },
          },
          {
            roundNumber: 3,
            dialogue: {
              aiSays:
                "Riddle-Clue number three! Something wet on the ground that butterflies visit.",
              childResponses: {
                ideal: "A puddle!",
                unexpected: "The river?",
                silent: "Child wanders looking for water.",
              },
              aiFollowUps: {
                ideal: "Yes! Butterflies puddle to drink minerals.",
                unexpected: "Smaller — like damp dirt.",
                silent: "Look for damp spots near tree trunks.",
              },
              screenDescription:
                "Third slot fills; all three clues now visible.",
            },
          },
        ],
      },
      {
        stepNumber: 4,
        title: "Celebration",
        type: "celebration",
        dialogue: {
          aiSays:
            "EVERYTHING you found is something your BUTTERFLY needs to live!",
          childResponses: {
            ideal: "Whoa!",
            unexpected: "I knew it!",
            silent: "Child looks at the screen, taking it in.",
          },
          aiFollowUps: {
            ideal: "You DID find its world!",
            unexpected: "It IS cool!",
            silent: "You mapped the butterfly's whole world!",
          },
          screenDescription:
            "Collection photos in a circle with golden connection lines.",
        },
      },
      {
        stepNumber: 5,
        title: "Closing + IB Concepts",
        type: "closing",
        dialogue: {
          aiSays:
            "Congratulations, Butterfly World Detective! You looked closely at Form and Causation.",
          childResponses: {
            ideal: "Cheers, talks about butterflies.",
            unexpected: "Smiles or says nothing.",
            silent: "Quiet smile.",
          },
          aiFollowUps: {
            ideal: "Next time you see a butterfly, look around!",
            unexpected: "Your detective badge is saved!",
            silent: "Bye for now, Detective!",
          },
          screenDescription:
            "Golden Butterfly World Detective Badge with 3 collection photos.",
        },
        conceptReinforcement:
          "You discovered Form (bright petals, flat leaves) and Causation (why the butterfly lives here).",
        tomorrowHook:
          "Next time, compare how different animals use patterns.",
      },
    ],
  },
  tagBlock: {
    activity_id: "mystery_trail_butterfly",
    version: 1,
    source_entity_exemplar: "butterfly",
    template_type: "cat5",
    pillar: "Mystery",
    game_style: "mystery_trail",
    entity: "butterfly",
    entity_class: ["insect", "animal"],
    entity_binding: "bound",
    tier_range: { primary: "T1", span: ["T0", "T1", "T2"], elasticity: "±1" },
    category: "animals",
    attributes: ["wings", "pattern", "habitat"],
    key_concepts: ["Connection"],
    related_concepts: ["pattern", "camouflage"],
    atl_skills: ["observation", "classification"],
    transdisciplinary_theme: "Sharing_The_Planet",
    kud: {
      know: ["butterflies depend on flowers"],
      understand: ["patterns help butterflies survive"],
      do: ["find the parts of a butterfly's habitat"],
    },
    progression: {
      topic_axis: "connection",
      difficulty_level: 2,
      next_step_hint: "Compare animals' patterns",
      reward_hook: "Earned the Pattern Tracker badge",
    },
    caregiver_role: ["scaffold", "co-explorer"],
    activity_signature: {
      observation_angle: "pattern",
      mechanic: "collect",
      entity_role: "subject",
      focal_attribute: "butterfly_wing_pattern",
      intro:
        "The child hunts for things that share the {entity}'s wing pattern.",
      bridge_prerequisites: {
        primary: ["pattern"],
        secondary: ["color", "shape"],
      },
      preview_label: "Trail the mystery patterns!",
      preview_prompt:
        "The butterfly's wings have amazing patterns. Let's find more!",
      role_pivot_note: "",
    },
    matchability: {
      entity_class_filter: ["insect"],
      tier_support: { T0: true, T1: true, T2: true },
    },
  },
  recap: {
    payloadDefaults: {
      entity: "{runtime_entity}",
      tier: "{runtime_tier}",
      ageYears: "{runtime_age}",
      whatWeNoticed: "pattern",
      whatWeDid: "collected",
      entityRole: "subject",
      focalAttribute: {
        token: "butterfly_wing_pattern",
        childLabel: "the butterfly's wing pattern",
        badgeEmojiNone: true,
      },
      highlightMoment: "You mapped the butterfly's whole secret world!",
      finds: [
        { label: "{find_1}", photo: "{photo_1}" },
        { label: "{find_2}", photo: "{photo_2}" },
        { label: "{find_3}", photo: "{photo_3}" },
      ],
      difficultyLevel: 2,
      nextStepHint: "Next time, compare animal patterns",
      caregiverObserved: "co-explorer",
      rewardBadge: "pattern_tracker",
    },
    rendered: {
      title: "You tracked the butterfly's mystery trail!",
      line_1: "We followed riddle-clues through the park.",
      line_2: "Every find turned out to be something the butterfly needs.",
      line_3: "You mapped the butterfly's secret world.",
      badge: "Pattern Tracker",
      next: "Next time, compare animal patterns.",
    },
  },
  dashboard: {
    session: {
      axis: "connection",
      angle: "pattern",
      mechanic: "collect",
      entityRole: "subject",
      focalAttribute: "butterfly_wing_pattern",
      entryRung: "{runtime_entry_rung}",
      exitRung: "{runtime_exit_rung}",
      outcome: "{runtime_outcome}",
    },
    contributesTo: {
      curiosityRadial: { axis: "connection", angle: "pattern" },
      explorationMatrix: { cell: "collect × pattern" },
      keyConceptsExposure: {
        Connection: { angle: "pattern" },
      },
      atlSkillsTrail: ["observation", "classification"],
    },
  },
});

test("ActivityBundle round-trip: render → unzip → re-parse → deep equal", async () => {
  const { bytes } = await bundleToZip(fixture);
  const parsed = await importBundleFromZip(bytes.buffer as ArrayBuffer);
  assert.deepStrictEqual(parsed.bundle, fixture);
  assert.equal(parsed.sourceFormat, "zip");
  // No `## Self-Evaluation Scorecard` table in the synthesized fixture, so
  // the importer falls back to all-fail and reports rubricEvaluated=false.
  assert.equal(parsed.rubricEvaluated, false);
  for (const value of Object.values(parsed.rubricScores)) {
    assert.equal(value, "fail");
  }
});

test("ActivityBundle import parses Self-Evaluation Scorecard from spec.md", async () => {
  // Inject a scorecard table after rendering so we can assert the parser
  // picks up author PASS/FAIL verdicts (treating N/A as PASS).
  const JSZip = (await import("jszip")).default;
  const { renderProdMarkdown, renderTagBlockYaml, renderRecapYaml, renderDashboardYaml, renderSpecMarkdown } = await import("../bundle-export");
  const baseSpec = renderSpecMarkdown(fixture);
  const scorecard = `\n## Self-Evaluation Scorecard\n\n| # | Dimension | Score | Notes |\n|---|-----------|-------|-------|\n| 1 | V1 Technical Compliance | PASS | ok |\n| 2 | Hook & Transition | PASS | ok |\n| 3 | Edge Case Coverage | PASS | ok |\n| 4 | IB Completeness | PASS | ok |\n| 5 | Tier Appropriateness | PASS | ok |\n| 6 | Dialogue Specificity | PASS | ok |\n| 7 | Screen & UI Completeness | PASS | ok |\n| 8 | Entity Mapping Alignment | N/A | not applicable |\n| 9 | Game Feel | PASS | ok |\n| 10 | Pillar Fidelity | FAIL | drift |\n`;
  const zip = new JSZip();
  const root = zip.folder(fixture.activityId)!;
  root.file("spec.md", baseSpec + scorecard);
  root.file("prod.md", renderProdMarkdown(fixture));
  root.file("tag_block.yaml", renderTagBlockYaml(fixture));
  root.file("recap.template.yaml", renderRecapYaml(fixture));
  root.file("dashboard.template.yaml", renderDashboardYaml(fixture));
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const parsed = await importBundleFromZip(bytes.buffer as ArrayBuffer);
  assert.equal(parsed.rubricEvaluated, true);
  assert.equal(parsed.rubricScores.d1, "pass");
  assert.equal(parsed.rubricScores.d8, "pass"); // N/A → pass
  assert.equal(parsed.rubricScores.d10, "fail");
});

test("ActivityBundle zip filename uses activityId", async () => {
  const { filename } = await bundleToZip(fixture);
  assert.equal(filename, "mystery_trail_butterfly.zip");
});

test("ActivityBundle import rejects archive missing required files", async () => {
  // Build a zip with only spec.md to confirm the missing-file error path.
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.folder("foo")?.file("spec.md", "# stub\n");
  const buf = await zip.generateAsync({ type: "uint8array" });
  await assert.rejects(
    () => importBundleFromZip(buf.buffer as ArrayBuffer),
    /missing required files/i,
  );
});
