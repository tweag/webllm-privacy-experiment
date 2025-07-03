import { useState, useCallback, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';
import { Message } from '../models/message';
import { MODEL } from '../config';
import { useComplexityAnalysis, ComplexityAnalysis } from './useComplexityAnalysis';

interface UseWebLlmReturn {
  isLoading: boolean;
  sendMessage: (
    message: string,
    currentMessages: Message[],
    onUpdate: (text: string) => void
  ) => Promise<void>;
  ready: boolean;
  text: string | null;
  analyzeComplexity: (prompt: string) => Promise<ComplexityAnalysis>;
}

export const useWebLlm = (): UseWebLlmReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState<string | null>(null);

  const { analyzeComplexity } = useComplexityAnalysis(engine);
 
  useEffect(() => {
    const initProgressCallback = (report: InitProgressReport) => {
      console.log(report);
      setText(report.text);
    };

    CreateMLCEngine(MODEL.WEB_LLM.DEFAULT_MODEL, { 
      initProgressCallback,
      appConfig: {
        useIndexedDBCache: true,
        model_list: [
            { 
              model: MODEL.WEB_LLM.MODEL_URL,
              model_id: MODEL.WEB_LLM.DEFAULT_MODEL,
              model_lib: MODEL.WEB_LLM.MODEL_LIB,
              vram_required_MB: MODEL.WEB_LLM.VRAM_REQUIRED_MB,
              low_resource_required: true,
              overrides: {
                context_window_size: MODEL.WEB_LLM.CONTEXT_WINDOW_SIZE,
              },
            },
        ],
      }
     }).then(engine => {  
      setEngine(engine);
      setReady(true);
    }).catch(error => {
      console.error('Error initializing WebLLM:', error);
    });
  }, []);

  const sendMessage = useCallback(async (
    message: string,
    currentMessages: Message[],
    onUpdate: (text: string) => void
  ) => {
    if (!engine) {
      throw new Error('WebLLM engine not initialized');
    }

    setIsLoading(true);

    try {
      const chatMessages = [
        { role: "system" as const, content: "You are a helpful AI assistant." },
        ...currentMessages
          .filter(msg => msg.source !== 'Analyzing')
          .map(msg => ({
            role: msg.isUser ? "user" as const : "assistant" as const,
            content: msg.text
          })),
        { role: "user" as const, content: message }
      ];

      // Enable streaming
      const chunks = await engine.chat.completions.create({
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
        stream_options: { include_usage: true }
      });

      let streamedText = '';
      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta.content || '';
        streamedText += content;
        onUpdate(streamedText);

        if (chunk.usage) {
          console.log('Usage stats:', chunk.usage);
        }
      }

      // Get the final message to ensure we have the complete response
      const fullReply = await engine.getMessage();
      onUpdate(fullReply);
    } catch (error) {
      console.error('Error generating WebLLM response:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  return {
    isLoading,
    sendMessage,
    ready,
    text,
    analyzeComplexity
  };
}; 