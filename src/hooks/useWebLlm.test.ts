import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebLlm } from './useWebLlm';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { Message } from '../models/message';

// Mock the web-llm library
vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(() => Promise.resolve({
    chat: {
      completions: {
        create: vi.fn()
      }
    },
    getMessage: vi.fn()
  }))
}));

describe('useWebLlm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Reset the mock implementation
    (CreateMLCEngine as any).mockReset();
    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: vi.fn()
        }
      },
      getMessage: vi.fn()
    }));
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useWebLlm());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(result.current.text).toBe(null);
  });

  it('should initialize WebLLM engine', async () => {
    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.ready).toBe(true);
  });

  it('should handle initialization error', async () => {
    const error = new Error('Initialization failed');
    (CreateMLCEngine as any).mockRejectedValue(error);
    
    const consoleSpy = vi.spyOn(console, 'error');
    
    renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Error initializing WebLLM:', error);
  });

  it('should analyze complexity correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Score: 7\nExplanation: This is a complex piece of code'
        }
      }]
    };

    const mockCreateFn = vi.fn().mockResolvedValue(mockResponse);

    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: mockCreateFn
        }
      }
    }));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const analysis = await result.current.analyzeComplexity('test prompt');
    
    expect(analysis).toEqual({
      complexity: 7,
      explanation: 'This is a complex piece of code'
    });
  });

  it('should handle invalid JSON in complexity analysis', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'invalid json'
        }
      }]
    };

    const mockCreateFn = vi.fn().mockResolvedValue(mockResponse);

    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: mockCreateFn
        }
      }
    }));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const analysis = await result.current.analyzeComplexity('test prompt');
    
    expect(analysis).toEqual({
      complexity: 5,
      explanation: 'Error during complexity analysis'
    });
  });

  it('should handle error in complexity analysis', async () => {
    const mockCreateFn = vi.fn().mockRejectedValue(new Error('Analysis failed'));

    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: mockCreateFn
        }
      }
    }));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const analysis = await result.current.analyzeComplexity('test prompt');
    
    expect(analysis).toEqual({
      complexity: 5,
      explanation: 'Error during complexity analysis'
    });
  });

  it('should send message and handle streaming response', async () => {
    const mockStream = [
      { choices: [{ delta: { content: 'Hello' } }], usage: { total_tokens: 5 } },
      { choices: [{ delta: { content: ' World' } }], usage: { total_tokens: 10 } }
    ];

    const mockStreamResponse = {
      [Symbol.asyncIterator]: () => {
        let index = 0;
        return {
          next: () => {
            if (index < mockStream.length) {
              return Promise.resolve({ value: mockStream[index++], done: false });
            }
            return Promise.resolve({ done: true });
          }
        };
      }
    };

    const mockCreateFn = vi.fn().mockResolvedValue(mockStreamResponse);
    const mockGetMessage = vi.fn().mockResolvedValue('Hello World');

    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: mockCreateFn
        }
      },
      getMessage: mockGetMessage
    }));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const onUpdate = vi.fn();
    await result.current.sendMessage('test', [], onUpdate);
    
    expect(onUpdate).toHaveBeenCalledWith('Hello');
    expect(onUpdate).toHaveBeenCalledWith('Hello World');
  });

  it('should handle error in sendMessage', async () => {
    const mockCreateFn = vi.fn().mockRejectedValue(new Error('Send failed'));

    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: mockCreateFn
        }
      }
    }));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await expect(result.current.sendMessage('test', [], () => {}))
      .rejects.toThrow('Send failed');
  });

  it('should filter out analyzing messages', async () => {
    const mockStreamResponse = {
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ done: true })
      })
    };

    const mockCreateFn = vi.fn().mockResolvedValue(mockStreamResponse);
    const mockGetMessage = vi.fn().mockResolvedValue('Response');

    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve({
      chat: {
        completions: {
          create: mockCreateFn
        }
      },
      getMessage: mockGetMessage
    }));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const messages: Message[] = [
      { id: '1', text: 'User message', isUser: true, source: 'User' },
      { id: '2', text: 'Analyzing...', isUser: false, source: 'Analyzing' },
      { id: '3', text: 'AI response', isUser: false, source: 'WebLLM' }
    ];

    await result.current.sendMessage('test', messages, () => {});
    
    expect(mockCreateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'User message' }),
          expect.objectContaining({ role: 'assistant', content: 'AI response' }),
          expect.objectContaining({ role: 'user', content: 'test' })
        ])
      })
    );
  });

  it('should throw error when engine is not initialized', async () => {
    (CreateMLCEngine as any).mockImplementation(() => Promise.resolve(null));

    const { result } = renderHook(() => useWebLlm());
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await expect(result.current.sendMessage('test', [], () => {}))
      .rejects.toThrow('WebLLM engine not initialized');
  });
}); 