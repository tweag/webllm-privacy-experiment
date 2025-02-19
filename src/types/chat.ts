export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  source?: 'WebLLM' | 'OpenAI' | 'User' | 'Analyzing' | 'Error';
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

export interface ModelSelectionRules {
  shouldUseOpenAI: boolean;
  reason: string;
}

export interface ComplexityAnalysis {
  isComplex: boolean;
  reason: string;
  confidence: number;
}

export const COMPLEXITY_ANALYSIS_PROMPT = `Analyze if the following user prompt is complex enough to require GPT-4 instead of a simpler local model. Consider these factors:
1. Task complexity (simple chat vs specialized knowledge)
2. Required reasoning depth
3. Context length and detail level
4. Technical or domain-specific requirements

Respond in JSON format only:
{
  "isComplex": boolean,
  "reason": "brief explanation",
  "confidence": number between 0 and 1
}

User prompt: `;

export function evaluateModelRules(prompt: string): ModelSelectionRules {
  const wordCount = prompt.trim().split(/\s+/).length;
  
  if (wordCount > 100) {
    return {
      shouldUseOpenAI: true,
      reason: 'Prompt exceeds 100 words, using OpenAI for better handling of long prompts'
    };
  }

  return {
    shouldUseOpenAI: false,
    reason: 'Using WebLLM for local inference'
  };
} 