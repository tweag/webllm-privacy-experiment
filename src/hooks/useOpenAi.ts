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

  const sendMessage = useCallback(async (message: string) => {
    if (finalConfig.enabled === false) {
      console.warn('OpenAI hook is disabled');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: message,
      isUser: true,
      source: 'OpenAI'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create a placeholder message for the AI response
    const aiMessageId = Date.now() + 1;
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      isUser: false,
      source: 'OpenAI'
    };
    setMessages(prev => [...prev, aiMessage]);

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
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: message }
          ],
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens,
          stream: true, // Enable streaming
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

          // Decode the chunk and split into lines
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

                // Update the AI message with accumulated text
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, text: streamedText }
                      : msg
                  )
                );
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: error instanceof Error ? error.message : 'An error occurred while generating the response.',
        isUser: false,
        source: 'OpenAI'
      };
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? errorMessage : msg
      ));
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