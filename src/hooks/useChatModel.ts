import { useState, useCallback, useEffect } from 'react';
import { useWebLlm } from './useWebLlm';
import { useOpenAi } from './useOpenAi';
import { Message, evaluateModelRules } from '../types/chat';

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
    const rules = evaluateModelRules(message);
    console.log('Model selection:', rules);

    if (rules.shouldUseOpenAI) {
      await openAi.sendMessage(message);
      setMessages(openAi.messages);
      setIsLoading(openAi.isLoading);
    } else {
      await webLlm.sendMessage(message);
      setMessages(webLlm.messages);
      setIsLoading(webLlm.isLoading);
    }
  }, [webLlm, openAi]);

  // Sync messages from both sources
  useEffect(() => {
    if (openAi.messages.length > 0) {
      setMessages(openAi.messages);
    } else if (webLlm.messages.length > 0) {
      setMessages(webLlm.messages);
    }
  }, [openAi.messages, webLlm.messages]);

  // Sync loading state
  useEffect(() => {
    setIsLoading(openAi.isLoading || webLlm.isLoading);
  }, [openAi.isLoading, webLlm.isLoading]);

  return {
    messages,
    isLoading,
    sendMessage,
    ready: webLlm.ready,
    text: webLlm.text
  };
}; 