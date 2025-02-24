import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOpenAi } from './useOpenAi';
import { Message } from '../models/message';
import { CHAT } from '../config';

describe('useOpenAi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock TextDecoder
    const mockTextDecoder = {
      decode: vi.fn().mockReturnValue('data: {"choices":[{"delta":{"content":"test response"}}]}\n\n')
    };
    (globalThis as any).TextDecoder = vi.fn(() => mockTextDecoder);
    // Mock fetch
    (globalThis as any).fetch = vi.fn(() => Promise.resolve({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValueOnce({
            done: false,
            value: new Uint8Array([])
          }).mockResolvedValueOnce({
            done: true,
            value: undefined
          })
        })
      }
    }));
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useOpenAi({ enabled: true }));
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle disabled state', async () => {
    const { result } = renderHook(() => useOpenAi({ enabled: false }));
    const onUpdate = vi.fn();
    
    await act(async () => {
      await expect(
        result.current.sendMessage('test message', [], onUpdate)
      ).rejects.toThrow('OpenAI hook is disabled');
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should send message and handle streaming response', async () => {
    const { result } = renderHook(() => useOpenAi({ enabled: true }));
    const onUpdate = vi.fn();

    await act(async () => {
      await result.current.sendMessage('test message', [], onUpdate);
    });

    expect(onUpdate).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API errors', async () => {
    (globalThis as any).fetch = vi.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'API Error' } })
    }));

    const { result } = renderHook(() => useOpenAi({ enabled: true }));
    const onUpdate = vi.fn();

    await expect(
      result.current.sendMessage('test message', [], onUpdate)
    ).rejects.toThrow('API Error');
  });

  it('should handle missing API key', async () => {
    // Mock import.meta.env
    const originalImportMeta = (globalThis as any).import?.meta;
    (globalThis as any).import = {
      meta: {
        env: {}
      }
    };

    // Mock fetch to return an error
    (globalThis as any).fetch = vi.fn(() => Promise.reject(new Error('OpenAI API key not found. Please add it to your .env file.')));

    const { result } = renderHook(() => useOpenAi({ enabled: true }));
    const onUpdate = vi.fn();

    await act(async () => {
      try {
        await result.current.sendMessage('test message', [], onUpdate);
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toBe('OpenAI API key not found. Please add it to your .env file.');
        }
      }
    });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    // Restore original import.meta
    (globalThis as any).import = originalImportMeta;
  });

  it('should handle invalid streaming data', async () => {
    // Mock TextDecoder to return invalid JSON
    const mockTextDecoder = {
      decode: vi.fn().mockReturnValue('data: invalid json\n\n')
    };
    (globalThis as any).TextDecoder = vi.fn(() => mockTextDecoder);

    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error');

    // Mock fetch to return a readable stream
    (globalThis as any).fetch = vi.fn(() => Promise.resolve({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array([1, 2, 3]) // Some dummy data that will be decoded to invalid JSON
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined
            })
        })
      }
    }));

    const { result } = renderHook(() => useOpenAi({ enabled: true }));
    const onUpdate = vi.fn();

    await act(async () => {
      await result.current.sendMessage('test message', [], onUpdate);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error parsing streaming data:', expect.any(Error));
    expect(onUpdate).toHaveBeenCalledWith('');
    expect(result.current.isLoading).toBe(false);
  });

  it('should filter out analyzing messages', async () => {
    let capturedBody: string | undefined;
    
    // Simple fetch mock that captures the request body
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new Uint8Array([])
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              })
          })
        }
      });
    });
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useOpenAi({ enabled: true }));
    const onUpdate = vi.fn();

    const messages: Message[] = [
      { id: '1', text: 'user message', isUser: true, source: undefined },
      { id: '2', text: 'analyzing...', isUser: false, source: CHAT.MESSAGE_SOURCE.ANALYZING },
      { id: '3', text: 'assistant message', isUser: false, source: undefined }
    ];

    await act(async () => {
      await result.current.sendMessage('test message', messages, onUpdate);
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(capturedBody).toBeDefined();
    const requestBody = JSON.parse(capturedBody!);
    expect(requestBody.messages).toEqual([
      { role: 'user', content: 'user message' },
      { role: 'assistant', content: 'assistant message' },
      { role: 'user', content: 'test message' }
    ]);
  });
});