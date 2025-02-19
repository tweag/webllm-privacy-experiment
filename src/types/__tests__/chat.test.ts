import { describe, it, expect } from 'vitest';
import { evaluateModelRules } from '../chat';

describe('evaluateModelRules', () => {
  it('should use WebLLM for short prompts', () => {
    const shortPrompt = 'This is a short prompt.';
    const result = evaluateModelRules(shortPrompt);
    
    expect(result).toEqual({
      shouldUseOpenAI: false,
      reason: 'Using WebLLM for local inference'
    });
  });

  it('should use OpenAI for long prompts over 100 words', () => {
    // Generate a long prompt with more than 100 words
    const longPrompt = Array(101).fill('word').join(' ');
    const result = evaluateModelRules(longPrompt);
    
    expect(result).toEqual({
      shouldUseOpenAI: true,
      reason: 'Prompt exceeds 100 words, using OpenAI for better handling of long prompts'
    });
  });

  it('should handle edge case with exactly 100 words', () => {
    const edgePrompt = Array(100).fill('word').join(' ');
    const result = evaluateModelRules(edgePrompt);
    
    expect(result).toEqual({
      shouldUseOpenAI: false,
      reason: 'Using WebLLM for local inference'
    });
  });

  it('should handle empty prompts', () => {
    const emptyPrompt = '';
    const result = evaluateModelRules(emptyPrompt);
    
    expect(result).toEqual({
      shouldUseOpenAI: false,
      reason: 'Using WebLLM for local inference'
    });
  });
}); 