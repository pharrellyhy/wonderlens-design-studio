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

const DEFAULT_PROVIDER: LLMProviderType = "openai-compatible";

/**
 * Build an LLMProvider instance from server environment variables.
 *
 * `LLM_PROVIDER` selects the backend; the matching `*_API_KEY` is read
 * from the same environment. Throws with an actionable message if either
 * is missing so the caller can surface a clean 500 error. Single source
 * of truth for LLM credentials — client requests never carry keys.
 */
export function getServerLLMProvider(): LLMProvider {
  const rawType = process.env.LLM_PROVIDER ?? DEFAULT_PROVIDER;
  if (!(rawType in PROVIDER_CONSTRUCTORS)) {
    throw new Error(
      `Invalid LLM_PROVIDER "${rawType}" — expected one of: ${Object.keys(PROVIDER_CONSTRUCTORS).join(", ")}`,
    );
  }
  const type = rawType as LLMProviderType;
  const apiKey = process.env[ENV_KEY_BY_PROVIDER[type]];
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      `${ENV_KEY_BY_PROVIDER[type]} is not set — configure it in the server environment`,
    );
  }
  return createLLMProvider(type, apiKey);
}
