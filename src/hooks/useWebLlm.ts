import { useState, useCallback, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { Message, ComplexityAnalysis, COMPLEXITY_ANALYSIS_PROMPT } from '../types/chat';

// const MODEL_NAME = "Hermes-3-Llama-3.1-8B-q4f32_1-MLC"; 
const MODEL_NAME = "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC"; 

interface UseWebLlmReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (
    message: string,
    currentMessages: Message[],
    aiMessageId: number,
    onUpdate: (text: string) => void
  ) => Promise<void>;
  ready: boolean;
  text: string | null;
  analyzeComplexity: (prompt: string) => Promise<ComplexityAnalysis>;
}

interface InitProgressCallback {
  progress: number;
  timeElapsed: number;
  text: string;
}

export const useWebLlm = (): UseWebLlmReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState<string | null>(null);
 
  useEffect(() => {
    const initProgressCallback = (obj: InitProgressCallback) => {
      setText(obj.text);
    };

    CreateMLCEngine(MODEL_NAME, { initProgressCallback }).then(engine => {  
      setEngine(engine);
      setReady(true);
    }).catch(error => {
      console.error('Error initializing WebLLM:', error);
    });
  }, []);

  const analyzeComplexity = useCallback(async (prompt: string): Promise<ComplexityAnalysis> => {
    if (!engine) {
      throw new Error('WebLLM engine not initialized');
    }

    try {
      const analysisPrompt = COMPLEXITY_ANALYSIS_PROMPT + prompt;
      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: "You are a prompt complexity analyzer." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.1, // Low temperature for more consistent analysis
        max_tokens: 200,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      try {
        const analysis = JSON.parse(analysisText) as ComplexityAnalysis;
        return {
          isComplex: analysis.isComplex,
          reason: analysis.reason,
          confidence: analysis.confidence
        };
      } catch (parseError) {
        console.error('Error parsing complexity analysis:', parseError);
        return {
          isComplex: true, // Default to OpenAI if we can't parse the analysis
          reason: 'Failed to analyze complexity',
          confidence: 1
        };
      }
    } catch (error) {
      console.error('Error analyzing complexity:', error);
      return {
        isComplex: true, // Default to OpenAI if analysis fails
        reason: 'Error during complexity analysis',
        confidence: 1
      };
    }
  }, [engine]);

  const sendMessage = useCallback(async (
    message: string,
    currentMessages: Message[],
    aiMessageId: number,
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
          .filter(msg => msg.source !== 'Analyzing') // Filter out analyzing messages
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
    messages,
    isLoading,
    sendMessage,
    ready,
    text,
    analyzeComplexity
  };
}; 