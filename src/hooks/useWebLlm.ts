import { useState, useCallback, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { Message } from '../types/chat';

// const MODEL_NAME = "Hermes-3-Llama-3.1-8B-q4f32_1-MLC"; 
const MODEL_NAME = "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC"; 

interface UseWebLlmReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  ready: boolean;
  text: string | null;
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
      console.log(obj);
      setText(obj.text);
    };

    CreateMLCEngine(MODEL_NAME, { initProgressCallback }).then(engine => {  
      setEngine(engine);
      setReady(true);
      console.log("WebLLM engine initialized");
    }).catch(error => {
      console.error('Error initializing WebLLM:', error);
    });

  }, []);

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
    ready,
    text,
  };
}; 