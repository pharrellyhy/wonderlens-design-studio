import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  /** If true, expect JSON output */
  jsonMode?: boolean;
}

export interface LLMProvider {
  readonly name: string;

  generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): Promise<string>;
}

export type LLMProviderType = "openai" | "anthropic";

const PROVIDER_CONSTRUCTORS = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
} as const;

export function createLLMProvider(
  type: LLMProviderType,
  apiKey: string
): LLMProvider {
  const ProviderConstructor = PROVIDER_CONSTRUCTORS[type];
  return new ProviderConstructor(apiKey);
}
