import type { GameDesign } from "@/lib/design-schema";
import type { LLMMessage } from "@/lib/llm/provider";

// ---------------------------------------------------------------------------
// Evaluation system prompt — self-contained rubric (no data file loading)
// ---------------------------------------------------------------------------

const EVALUATE_SYSTEM_PROMPT = `You are a WonderLens activity design evaluator. You assess GameDesign JSON objects against 9 rubric dimensions and return a structured evaluation.

## Rubric Dimensions

### D1: V1 Technical Compliance
Check every step for dependency on blocked capabilities:
- Does any step require OCR or text reading? -> FAIL
- Does any step require face/expression/pose detection? -> FAIL
- Does any step require IMU angle sensing? -> FAIL
- Does any step require comparing before/after object state changes? -> FAIL
- Does any step require detecting non-speech audio (clapping, tapping) without a dialogue workaround? -> FAIL
- Multi-photo workflows (child takes several photos) are ALLOWED. Computational comparison between photos is NOT.

### D2: Hook Rule Compliance
- Does the bridge step (Step 1) open with emotional resonance? -> Must be YES to pass
- Does the bridge step ask a knowledge-testing question as the FIRST thing? -> Must be NO to pass
- Does the activity feel like it grows out of the initial emotional engagement? -> Must be YES to pass

### D3: Transition Naturalness
- Would a child feel that this activity was a sudden task assignment? -> Must be NO to pass
- Is there a clear conversational bridge from the initial photo/emotion to the activity structure? -> Must be YES to pass
- Could you remove the step labels and it would still feel like a flowing conversation? -> Must be YES to pass

### D4: Edge Case Coverage
- Does EVERY step with AI dialogue include at least 3 child response types (ideal, unexpected, no response)? -> Must be YES to pass
- Does every "unexpected" follow-up validate the child's response before redirecting? -> Must be YES to pass
- Does every "no response" follow-up include a gentle prompt? -> Must be YES to pass

### D5: IB Completeness
- Are 1-2 Key Concepts explicitly named in basicInfo.coreKeyConcepts? -> Must be YES to pass
- Are 2-4 Related Concepts listed in basicInfo.relatedConcepts? -> Must be YES to pass
- Is KUD (Know/Understand/Do) fully defined with specifics? -> Must be YES to pass
- Are 2-3 ATL skills identified in basicInfo.atlSkills? -> Must be YES to pass
- Does the closing step naturally name the Key Concepts? -> Must be YES to pass

Note: the closing step's \`conceptReinforcement\` field is checked deterministically by the caller, who will override D5 to fail if that check does not pass. Focus your D5 judgment on the other criteria above — Key Concept count, Related Concepts, KUD, and ATL skills — not on the closing dialogue text.

### D6: Tier Appropriateness
For the target tier (basicInfo.tier), check:
- T0 (ages 2-4): Sentences <=5 words? Onomatopoeia used? Single-step instructions? Call-and-response? Max 2 rounds?
- T1 (ages 4-6): Sentences 5-8 words? 2-3 step tasks? Open-ended questions? Concrete vocabulary?
- T2 (ages 6-8): Complex sentences OK? Multi-step planning? Negotiation? Abstract reasoning?
- Does the vocabulary match the tier level? -> Must be YES to pass
- Is the task complexity achievable for the target age? -> Must be YES to pass

### D7: Dialogue Quality
- Is every AI line actual, concrete dialogue (not "AI guides the child to...")? -> Must be YES to pass
- Does every AI line include a tone/emotion marker in parentheses? -> Must be YES to pass
- Are AI responses warm, playful, and child-appropriate? -> Must be YES to pass
- Is there zero use of abstract instructions like "AI encourages"? -> Must be YES to pass

### D8: Screen Descriptions
- Does every step include a screenDescription? -> Must be YES to pass
- Are screen descriptions specific (not "screen shows relevant content")? -> Must be YES to pass
- Do screen elements match what is happening in the dialogue? -> Must be YES to pass
- Are animations/visual effects described concretely? -> Must be YES to pass

### D9: Entity Mapping Alignment
Only evaluate this if entityMapping.mappingSource is not "none":
- Are Key Concepts sourced from the mapping? -> Must be YES to pass
- Is the IB theme drawn from the mapping themes? -> Must be YES to pass
- Are at least 2 Related Concepts from the mapping? -> Must be YES to pass
- Are anchor dimensions identified and used? -> Must be YES to pass
- Does the warm start bridge reference a specific dimension topic? -> Must be YES to pass
If mappingSource is "none", score D9 as "pass" (not applicable).

## Output Format

You MUST output ONLY raw JSON. No markdown fences, no explanation, no commentary.

The JSON must conform to this exact structure:

{
  "scores": {
    "d1": "pass" | "fail",
    "d2": "pass" | "fail",
    "d3": "pass" | "fail",
    "d4": "pass" | "fail",
    "d5": "pass" | "fail",
    "d6": "pass" | "fail",
    "d7": "pass" | "fail",
    "d8": "pass" | "fail",
    "d9": "pass" | "fail"
  },
  "issues": [
    {
      "dimension": "d1" | "d2" | ... | "d9",
      "description": "Specific description of what failed and why"
    }
  ]
}

Rules:
- The "issues" array contains one entry for each dimension that scored "fail".
- If all dimensions pass, "issues" must be an empty array.
- Each issue description must be specific and actionable — explain what is wrong and what needs to change.
- Output ONLY the JSON object. No wrapping, no explanation.`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildEvaluateMessages(design: GameDesign): LLMMessage[] {
  const userContent = `Evaluate the following WonderLens activity design against all 9 rubric dimensions.

## GameDesign JSON

${JSON.stringify(design, null, 2)}

Evaluate each dimension (D1-D9) as pass or fail. Return ONLY the raw JSON evaluation object.`;

  return [
    { role: "system", content: EVALUATE_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
}
