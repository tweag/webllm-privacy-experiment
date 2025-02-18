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
      setText(obj.text);
    };

    CreateMLCEngine(MODEL_NAME, { initProgressCallback }).then(engine => {  
      setEngine(engine);
      setReady(true);
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
      source: 'WebLLM'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create a placeholder message for the AI response
    const aiMessageId = Date.now() + 1;
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      isUser: false,
      source: 'WebLLM'
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const chatMessages = [
        { role: "system" as const, content: "You are a helpful AI assistant." },
        ...messages.map(msg => ({
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
        
        // Update the AI message with the accumulated text
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: streamedText }
              : msg
          )
        );

        if (chunk.usage) {
          console.log('Usage stats:', chunk.usage);
        }
      }

      // Get the final message to ensure we have the complete response
      const fullReply = await engine.getMessage();
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: fullReply }
            : msg
        )
      );
    } catch (error) {
      console.error('Error generating WebLLM response:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: error instanceof Error ? error.message : 'An error occurred while generating the response.',
        isUser: false,
        source: 'WebLLM'
      };
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? errorMessage : msg
      ));
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