import { useState, useCallback } from 'react';
import { Message } from '../models/message';
import { OpenAIConfig } from '../models/openai';
import { MODEL, CHAT } from '../config';

interface UseOpenAiReturn {
  isLoading: boolean;
  sendMessage: (
    message: string,
    currentMessages: Message[],
    onUpdate: (text: string) => void
  ) => Promise<void>;
}

export const useOpenAi = (config: OpenAIConfig): UseOpenAiReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    message: string,
    currentMessages: Message[],
    onUpdate: (text: string) => void
  ) => {
    const finalConfig = { ...MODEL.DEFAULT_CONFIG, ...config };
    
    if (finalConfig.enabled === false) {
      console.warn('OpenAI hook is disabled');
      return Promise.reject(new Error('OpenAI hook is disabled'));
    }
    
    setIsLoading(true);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setIsLoading(false);
      return Promise.reject(new Error('OpenAI API key not found. Please add it to your .env file.'));
    }

    console.log('Sending message to OpenAI:', message);

    try {
      const response = await fetch(finalConfig.API_URL || MODEL.DEFAULT_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: finalConfig.MODEL || MODEL.DEFAULT_CONFIG.MODEL,
          messages: [
            ...currentMessages
              .filter(msg => msg.source !== CHAT.MESSAGE_SOURCE.ANALYZING)
              .map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
              })),
            { role: 'user', content: message }
          ],
          temperature: finalConfig.TEMPERATURE || MODEL.DEFAULT_CONFIG.TEMPERATURE,
          max_tokens: finalConfig.MAX_TOKENS || MODEL.DEFAULT_CONFIG.MAX_TOKENS,
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
                onUpdate('');
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