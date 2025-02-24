import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useComplexityAnalysis } from './useComplexityAnalysis';

describe('useComplexityAnalysis', () => {
  const mockEngine = {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should analyze code complexity correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Score: 7\nExplanation: This is a complex piece of code'
        }
      }]
    };

    mockEngine.chat.completions.create.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useComplexityAnalysis(mockEngine as any));
    
    const analysis = await result.current.analyzeComplexity('const x = 1;');
    
    expect(analysis).toEqual({
      complexity: 7,
      explanation: 'This is a complex piece of code'
    });

    expect(mockEngine.chat.completions.create).toHaveBeenCalledWith({
      messages: [
        { role: "system", content: "You are a code complexity analyzer." },
        { role: "user", content: expect.stringContaining('const x = 1;') }
      ],
      temperature: 0.1,
      max_tokens: 200,
    });
  });

  it('should handle invalid response format', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Invalid format response'
        }
      }]
    };

    mockEngine.chat.completions.create.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useComplexityAnalysis(mockEngine as any));
    
    const analysis = await result.current.analyzeComplexity('const x = 1;');
    
    expect(analysis).toEqual({
      complexity: 5,
      explanation: 'Error during complexity analysis'
    });
    expect(console.error).toHaveBeenCalledWith(
      'Error analyzing complexity:',
      expect.any(Error)
    );
  });

  it('should handle null engine', async () => {
    const { result } = renderHook(() => useComplexityAnalysis(null));
    
    await expect(result.current.analyzeComplexity('const x = 1;'))
      .rejects
      .toThrow('WebLLM engine not initialized');
  });

  it('should handle API error', async () => {
    mockEngine.chat.completions.create.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useComplexityAnalysis(mockEngine as any));
    
    const analysis = await result.current.analyzeComplexity('const x = 1;');
    
    expect(analysis).toEqual({
      complexity: 5,
      explanation: 'Error during complexity analysis'
    });
    expect(console.error).toHaveBeenCalledWith(
      'Error analyzing complexity:',
      expect.any(Error)
    );
  });
}); 