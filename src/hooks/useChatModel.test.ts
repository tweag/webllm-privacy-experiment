import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatModel } from './useChatModel';
import { useWebLlm } from './useWebLlm';

// Mock the hooks
vi.mock('./useWebLlm', () => ({
  useWebLlm: vi.fn(() => ({
    ready: true,
    text: null,
    isLoading: false,
    analyzeComplexity: vi.fn(async () => ({
      complexity: 5,
      explanation: 'Simple query'
    })),
    sendMessage: vi.fn(async (_message, _messages, onUpdate) => {
      onUpdate('WebLLM Response');
    })
  }))
}));

vi.mock('./useOpenAi', () => ({
  useOpenAi: vi.fn(() => ({
    isLoading: false,
    sendMessage: vi.fn(async (_message, _messages, onUpdate) => {
      onUpdate('OpenAI Response');
    })
  }))
}));

describe('useChatModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useChatModel());
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.ready).toBe(true);
    expect(result.current.text).toBeNull();
  });

  it('should handle message with WebLLM by default', async () => {
    const { result } = renderHook(() => useChatModel());
    
    await act(async () => {
      await result.current.sendMessage('test message');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('WebLLM Response');
    expect(result.current.messages[1].source).toBe('WebLLM');
  });

  it('should handle message with WebLLM when specified', async () => {
    const { result } = renderHook(() => useChatModel());
    
    await act(async () => {
      await result.current.sendMessage('test message @webllm');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('WebLLM Response');
    expect(result.current.messages[1].source).toBe('WebLLM');
  });

  it('should handle errors gracefully', async () => {
    const mockWebLlm = vi.mocked(useWebLlm);
    mockWebLlm.mockImplementationOnce(() => ({
      ready: true,
      text: null,
      isLoading: false,
      analyzeComplexity: vi.fn(async () => ({
        complexity: 5,
        explanation: 'Simple query'
      })),
      sendMessage: vi.fn(async () => {
        throw new Error('Test error');
      })
    }));

    const { result } = renderHook(() => useChatModel());
    
    await act(async () => {
      await result.current.sendMessage('test message');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('Test error');
    expect(result.current.messages[1].source).toBe('Error');
  });

  it('should handle complex messages with OpenAI', async () => {
    const mockWebLlm = vi.mocked(useWebLlm);
    mockWebLlm.mockImplementationOnce(() => ({
      ready: true,
      text: null,
      isLoading: false,
      analyzeComplexity: vi.fn(async () => ({
        complexity: 9,
        explanation: 'Complex query'
      })),
      sendMessage: vi.fn()
    }));

    const { result } = renderHook(() => useChatModel());
    
    await act(async () => {
      await result.current.sendMessage('complex test message');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('OpenAI Response');
    expect(result.current.messages[1].source).toBe('OpenAI');
  });
}); 