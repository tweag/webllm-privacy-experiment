export interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export interface OpenAIConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiUrl?: string;
  enabled?: boolean;
}

export type LLMModel = 'gpt-4' | 'Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC';

export const AVAILABLE_MODELS: { value: LLMModel; label: string }[] = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC', label: 'Hermes 2 Pro' }
]; 