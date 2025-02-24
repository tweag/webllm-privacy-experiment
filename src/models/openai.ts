import { MODEL } from '../config';

export type LLMModel = typeof MODEL.AVAILABLE_MODELS[number]['value'];

export type OpenAIConfig = {
  MODEL?: string;
  TEMPERATURE?: number;
  MAX_TOKENS?: number;
  API_URL?: string;
  enabled?: boolean;
}; 