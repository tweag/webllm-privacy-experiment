import { useState, useCallback, useRef, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { Message } from '../types/chat';

interface UseWebLlmReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  isInitializing: boolean;
  initProgress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  startDownload: () => void;
  isDownloaded: boolean;
  isCheckingCache: boolean;
}

export const useWebLlm = (): UseWebLlmReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number | undefined>(undefined);
  const [totalBytes, setTotalBytes] = useState<number | undefined>(undefined);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);

  // Check for cached model on mount
  useEffect(() => {
    const checkCache = async () => {
      try {
        const newEngine = await CreateMLCEngine("Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC", {});
        setEngine(newEngine);
        setIsDownloaded(true);
      } catch (error) {
        console.log('Model not in cache:', error);
        setIsDownloaded(false);
      } finally {
        setIsCheckingCache(false);
      }
    };

    checkCache();
  }, []);

  const initEngineRef = useRef(async () => {
    try {
      const initProgressCallback = (progress: any) => {
        console.log("Model loading progress:", progress);
        setInitProgress(progress.progress || 0);
        if (progress.downloadedBytes) {
          setDownloadedBytes(progress.downloadedBytes);
        }
        if (progress.totalBytes) {
          setTotalBytes(progress.totalBytes);
        }
      };

      const newEngine = await CreateMLCEngine("Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC", { initProgressCallback });
      
      setEngine(newEngine);
      setIsDownloaded(true);
    } catch (error) {
      console.error('Error initializing WebLLM:', error);
    } finally {
      setIsInitializing(false);
    }
  });

  const startDownload = useCallback(() => {
    if (!isInitializing && !engine) {
      setIsInitializing(true);
      initEngineRef.current();
    }
  }, [isInitializing, engine]);

  const sendMessage = useCallback(async (message: string) => {
    if (!engine) {
      console.error('WebLLM engine not initialized');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: message,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Use a microtask to allow React to process the state update
    await Promise.resolve();

    try {
      const chatMessages = [
        { role: "system" as const, content: "You are a helpful AI assistant." },
        ...messages.map(msg => ({
          role: msg.isUser ? "user" as const : "assistant" as const,
          content: msg.text
        })),
        { role: "user" as const, content: message }
      ];

      const reply = await engine.chat.completions.create({
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = reply.choices[0]?.message?.content || 'No response generated.';
      const aiMessage: Message = {
        id: Date.now(),
        text: content,
        isUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating WebLLM response:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: error instanceof Error ? error.message : 'An error occurred while generating the response.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [engine, messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    isInitializing,
    initProgress,
    downloadedBytes,
    totalBytes,
    startDownload,
    isDownloaded,
    isCheckingCache
  };
}; 