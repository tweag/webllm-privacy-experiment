/**
 * Model Selection Hook
 * Provides logic for selecting between different LLM models
 */

import { useCallback } from 'react';

export interface ModelSelectionRules {
  shouldUseOpenAI: boolean;
  reason: string;
}

export const useModelSelection = () => {
  const evaluateModelRules = useCallback((prompt: string): ModelSelectionRules => {
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
  }, []);

  return {
    evaluateModelRules
  };
}; 