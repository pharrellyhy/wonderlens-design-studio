import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { OpenAICompatibleProvider } from "./openai-compatible";

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

export type LLMProviderType = "openai" | "anthropic" | "openai-compatible";

const PROVIDER_CONSTRUCTORS = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  "openai-compatible": OpenAICompatibleProvider,
} as const;

export function createLLMProvider(
  type: LLMProviderType,
  apiKey: string
): LLMProvider {
  const ProviderConstructor = PROVIDER_CONSTRUCTORS[type];
  return new ProviderConstructor(apiKey);
}

const ENV_KEY_BY_PROVIDER: Record<LLMProviderType, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  "openai-compatible": "OPENAI_COMPATIBLE_API_KEY",
};

/**
 * Resolve an API key for the given provider, preferring a non-empty
 * client-supplied key but falling back to the matching server env var.
 */
export function resolveApiKey(
  provider: LLMProviderType,
  clientKey: string | undefined
): string {
  if (clientKey && clientKey.trim() !== "") return clientKey;
  return process.env[ENV_KEY_BY_PROVIDER[provider]] ?? "";
}
