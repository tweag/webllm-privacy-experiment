import { useState, useCallback } from 'react';
import { Message, OpenAIConfig } from '../types/chat';

interface UseOpenAiReturn {
  isLoading: boolean;
  sendMessage: (
    message: string,
    currentMessages: Message[],
    aiMessageId: number,
    onUpdate: (text: string) => void
  ) => Promise<void>;
}

const DEFAULT_CONFIG: OpenAIConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  apiUrl: 'https://api.openai.com/v1/chat/completions'
};

export const useOpenAi = (config: OpenAIConfig): UseOpenAiReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    message: string,
    currentMessages: Message[],
    aiMessageId: number,
    onUpdate: (text: string) => void
  ) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    if (finalConfig.enabled === false) {
      console.warn('OpenAI hook is disabled');
      return;
    }

    console.log('Sending message to OpenAI:', message);
    setIsLoading(true);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add it to your .env file.');
    }

    try {
      const response = await fetch(finalConfig.apiUrl || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: [
            ...currentMessages
              .filter(msg => msg.source !== 'Analyzing') // Filter out analyzing messages
              .map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
              })),
            { role: 'user', content: message }
          ],
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                streamedText += content;
                onUpdate(streamedText);
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return {
    isLoading,
    sendMessage
  };
}; 