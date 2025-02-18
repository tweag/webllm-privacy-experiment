import { useState, useCallback } from 'react';
import { Message, OpenAIConfig } from '../types/chat';

interface UseOpenAiReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
}

const DEFAULT_CONFIG: OpenAIConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  apiUrl: 'https://api.openai.com/v1/chat/completions'
};

export const useOpenAi = (config: OpenAIConfig): UseOpenAiReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const generateAIResponse = async (userMessage: string) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add it to your .env file.');
    }

    const response = await fetch(finalConfig.apiUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalConfig.model,
        messages: [
          ...messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate AI response');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  };

  const sendMessage = useCallback(async (message: string) => {
    if (finalConfig.enabled === false) {
      console.warn('OpenAI hook is disabled');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: message,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(message);
      const aiMessage: Message = {
        id: Date.now(),
        text: aiResponse,
        isUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: error instanceof Error ? error.message : 'An error occurred while generating the response.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, finalConfig]);

  return {
    messages,
    isLoading,
    sendMessage
  };
}; 