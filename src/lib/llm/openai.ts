import OpenAI from "openai";
import type { LLMProvider, LLMMessage, LLMGenerateOptions } from "./provider";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    const baseURL = process.env.OPENAI_BASE_URL;
    this.client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    this.model = process.env.OPENAI_MODEL ?? "gpt-4o";
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
