import OpenAI from "openai";
import type { LLMProvider, LLMMessage, LLMGenerateOptions } from "./provider";

export class OpenAICompatibleProvider implements LLMProvider {
  readonly name = "openai-compatible";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL;
    const model = process.env.OPENAI_COMPATIBLE_MODEL;

    if (!baseURL) {
      throw new Error(
        "OPENAI_COMPATIBLE_BASE_URL is not set in the server environment",
      );
    }
    if (!model) {
      throw new Error(
        "OPENAI_COMPATIBLE_MODEL is not set in the server environment",
      );
    }

    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 16000,
      ...(options?.jsonMode
        ? { response_format: { type: "json_object" } }
        : {}),
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
