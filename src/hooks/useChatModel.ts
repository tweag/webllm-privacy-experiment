import { useState, useCallback } from 'react';
import { useWebLlm } from './useWebLlm';
import { useOpenAi } from './useOpenAi';
import { Message } from '../types/chat';

interface UseChatModelReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  ready: boolean;
  text: string | null;
}

export const useChatModel = (): UseChatModelReturn => {
  const webLlm = useWebLlm();
  const openAi = useOpenAi({ enabled: true });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true); // Start loading immediately when message is sent

    // Add user message to the shared history
    const userMessage: Message = {
      id: Date.now(),
      text: message,
      isUser: true,
      source: 'User'
    };
    setMessages(prev => [...prev, userMessage]);

    // Create a placeholder message for the AI response
    const aiMessageId = Date.now() + 1;
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      isUser: false,
      source: 'Analyzing' // Initial source while analyzing
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      // Check if user explicitly specified a model
      const messageLower = message.trim().toLowerCase();
      const openAiPrefix = messageLower.includes('@openai');
      const webLlmPrefix = messageLower.includes('@webllm');
      
      // Remove the model mention from the message if it exists
      let cleanMessage = message;
      if (openAiPrefix || webLlmPrefix) {
        const modelTag = openAiPrefix ? '@openai' : '@webllm';
        const tagIndex = messageLower.indexOf(modelTag);
        // Remove the tag and any surrounding punctuation/spaces
        cleanMessage = message.slice(0, tagIndex).trim() + ' ' + 
                      message.slice(tagIndex + modelTag.length).trim();
        cleanMessage = cleanMessage.trim();
      }

      let shouldUseOpenAI: boolean;

      if (openAiPrefix || webLlmPrefix) {
        // User explicitly chose a model
        shouldUseOpenAI = openAiPrefix;
        console.log('Using user-specified model:', openAiPrefix ? 'OpenAI' : 'WebLLM');
      } else {
        // Perform complexity analysis for model selection
        const analysis = await webLlm.analyzeComplexity(message);
        console.log('Complexity analysis:', analysis);

        // Use OpenAI if the prompt is complex or if the word count is too high
        const wordCount = message.trim().split(/\s+/).length;
        shouldUseOpenAI = analysis.isComplex || wordCount > 100;

        console.log('Model selection:', {
          shouldUseOpenAI,
          reason: analysis.reason,
          confidence: analysis.confidence,
          wordCount
        });
      }

      // Update the source based on the selected model
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, source: shouldUseOpenAI ? 'OpenAI' : 'WebLLM' }
            : msg
        )
      );

      if (shouldUseOpenAI) {
        // Pass the current messages array to maintain conversation history
        await openAi.sendMessage(cleanMessage, messages, aiMessageId, (text: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text }
                : msg
            )
          );
        });
      } else {
        // Pass the current messages array to maintain conversation history
        await webLlm.sendMessage(cleanMessage, messages, aiMessageId, (text: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text }
                : msg
            )
          );
        });
      }
    } catch (error) {
      console.error('Error in model selection:', error);
      // Update the error message in place
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? {
                ...msg,
                text: error instanceof Error ? error.message : 'An error occurred while processing the message.',
                source: 'Error'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [webLlm, openAi, messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    ready: webLlm.ready,
    text: webLlm.text
  };
}; 