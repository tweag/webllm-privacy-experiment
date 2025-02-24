import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModelSelection } from './useModelSelection';

describe('useModelSelection', () => {
  it('should use OpenAI for long prompts', () => {
    const { result } = renderHook(() => useModelSelection());
    
    // Create a long prompt with more than 100 words
    const longPrompt = Array(101).fill('word').join(' ');
    
    const rules = result.current.evaluateModelRules(longPrompt);
    
    expect(rules).toEqual({
      shouldUseOpenAI: true,
      reason: 'Prompt exceeds 100 words, using OpenAI for better handling of long prompts'
    });
  });

  it('should use WebLLM for short prompts', () => {
    const { result } = renderHook(() => useModelSelection());
    
    const shortPrompt = 'This is a short prompt';
    
    const rules = result.current.evaluateModelRules(shortPrompt);
    
    expect(rules).toEqual({
      shouldUseOpenAI: false,
      reason: 'Using WebLLM for local inference'
    });
  });

  it('should handle empty prompts', () => {
    const { result } = renderHook(() => useModelSelection());
    
    const rules = result.current.evaluateModelRules('');
    
    expect(rules).toEqual({
      shouldUseOpenAI: false,
      reason: 'Using WebLLM for local inference'
    });
  });
}); 