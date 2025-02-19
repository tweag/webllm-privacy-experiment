import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebLlm } from '../useWebLlm';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { Message } from '../../types/chat';

// Mock the web-llm library
vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(() => Promise.resolve({
    chat: {
      completions: {
        create: vi.fn(async ({ messages, stream }) => {
          if (stream) {
            return {
              *[Symbol.asyncIterator]() {
                yield { choices: [{ delta: { content: 'Hello' } }], usage: {} };
                yield { choices: [{ delta: { content: ' World' } }], usage: {} };
              }
            };
          }
          return {
            choices: [{ message: { content: '{"isComplex": true, "reason": "Test", "confidence": 0.9}' } }]
          };
        })
      }
    },
    getMessage: vi.fn(() => Promise.resolve('Hello World'))
  }))
}));

describe('useWebLlm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebLlm());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(result.current.text).toBeNull();
  });

  it('should initialize WebLLM engine', async () => {
    const { result } = renderHook(() => useWebLlm());
    
    // Wait for the initialization to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(CreateMLCEngine).toHaveBeenCalled();
    expect(result.current.ready).toBe(true);
  });

  it('should handle initialization error', async () => {
    const error = new Error('Initialization failed');
    vi.mocked(CreateMLCEngine).mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useWebLlm());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(console.error).toHaveBeenCalledWith('Error initializing WebLLM:', error);
    expect(result.current.ready).toBe(false);
  });

  it('should analyze complexity correctly', async () => {
    const { result } = renderHook(() => useWebLlm());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const analysis = await result.current.analyzeComplexity('test prompt');
    
    expect(analysis).toEqual({
      isComplex: true,
      reason: 'Test',
      confidence: 0.9
    });
  });

  it('should handle invalid JSON in complexity analysis', async () => {
    const mockEngine = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValueOnce({
            choices: [{ message: { content: 'invalid json' } }]
          })
        } as any,
        engine: {} as any
      }
    };
    vi.mocked(CreateMLCEngine).mockResolvedValueOnce(mockEngine as any);

    const { result } = renderHook(() => useWebLlm());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const analysis = await result.current.analyzeComplexity('test prompt');
    
    expect(analysis).toEqual({
      isComplex: false,
      reason: 'Fallback analysis due to parsing error',
      confidence: 0.6
    });
    expect(console.error).toHaveBeenCalledWith('Error parsing complexity analysis:', expect.any(Error));
  });

  it('should handle error in complexity analysis', async () => {
    const mockEngine = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValueOnce(new Error('Analysis failed'))
        } as any,
        engine: {} as any
      }
    };
    vi.mocked(CreateMLCEngine).mockResolvedValueOnce(mockEngine as any);

    const { result } = renderHook(() => useWebLlm());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const analysis = await result.current.analyzeComplexity('test prompt');
    
    expect(analysis).toEqual({
      isComplex: true,
      reason: 'Error during complexity analysis',
      confidence: 1
    });
    expect(console.error).toHaveBeenCalledWith('Error analyzing complexity:', expect.any(Error));
  });

  it('should send message and handle streaming response', async () => {
    const { result } = renderHook(() => useWebLlm());
    const onUpdate = vi.fn();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.sendMessage('test message', [], onUpdate);
    });

    expect(onUpdate).toHaveBeenCalledWith('Hello');
    expect(onUpdate).toHaveBeenCalledWith('Hello World');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error in sendMessage', async () => {
    const mockEngine = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValueOnce(new Error('Message failed'))
        } as any,
        engine: {} as any
      }
    };
    vi.mocked(CreateMLCEngine).mockResolvedValueOnce(mockEngine as any);

    const { result } = renderHook(() => useWebLlm());
    const onUpdate = vi.fn();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await expect(
      result.current.sendMessage('test message', [], onUpdate)
    ).rejects.toThrow('Message failed');
    
    expect(console.error).toHaveBeenCalledWith('Error generating WebLLM response:', expect.any(Error));
    expect(result.current.isLoading).toBe(false);
  });

  it('should filter out analyzing messages', async () => {
    const mockCreate = vi.fn().mockImplementation(async ({ messages, stream }) => {
      if (stream) {
        return {
          *[Symbol.asyncIterator]() {
            yield { choices: [{ delta: { content: 'Hello' } }], usage: {} };
          }
        };
      }
      return { choices: [{ message: { content: 'Hello' } }] };
    });

    const mockEngine = {
      chat: {
        completions: { create: mockCreate } as any,
        engine: {} as any
      },
      getMessage: vi.fn().mockResolvedValue('Hello')
    };
    vi.mocked(CreateMLCEngine).mockResolvedValueOnce(mockEngine as any);

    const { result } = renderHook(() => useWebLlm());
    const onUpdate = vi.fn();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const messages: Message[] = [
      { id: 1, text: 'user message', isUser: true },
      { id: 2, text: 'analyzing...', isUser: false, source: 'Analyzing' },
      { id: 3, text: 'assistant message', isUser: false }
    ];

    await act(async () => {
      await result.current.sendMessage('test message', messages, onUpdate);
    });

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.messages).toEqual([
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: 'user message' },
      { role: 'assistant', content: 'assistant message' },
      { role: 'user', content: 'test message' }
    ]);
  });

  it('should throw error when engine is not initialized', async () => {
    const { result } = renderHook(() => useWebLlm());
    const onUpdate = vi.fn();

    await expect(
      result.current.sendMessage('test message', [], onUpdate)
    ).rejects.toThrow('WebLLM engine not initialized');

    await expect(
      result.current.analyzeComplexity('test prompt')
    ).rejects.toThrow('WebLLM engine not initialized');
  });
}); 