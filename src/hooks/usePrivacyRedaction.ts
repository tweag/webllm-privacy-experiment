import { useCallback, useRef } from 'react';
import { MLCEngine } from '@mlc-ai/web-llm';
import { PrivacyRedactionService } from '../utils/privacyRedaction';

interface UsePrivacyRedactionReturn {
  redactForOpenAI: (
    message: string,
    currentMessages: Array<{ role: string; content: string }>
  ) => Promise<{
    redactedMessage: string;
    redactedMessages: Array<{ role: string; content: string }>;
    macroMap: Map<string, string>;
  }>;
  restoreFromOpenAI: (text: string, macroMap?: Map<string, string>) => string;
  clearSession: () => void;
}

export const usePrivacyRedaction = (engine: MLCEngine | null): UsePrivacyRedactionReturn => {
  const serviceRef = useRef<PrivacyRedactionService | null>(null);

  // Initialize service when engine is available
  if (engine && !serviceRef.current) {
    serviceRef.current = new PrivacyRedactionService(engine);
  }

  const redactForOpenAI = useCallback(async (
    message: string,
    currentMessages: Array<{ role: string; content: string }>
  ) => {
    if (!serviceRef.current) {
      throw new Error('Privacy redaction service not initialized');
    }

    // Redact the new message
    const messageResult = await serviceRef.current.redactText(message);
    
    // Redact conversation history
    const historyResult = await serviceRef.current.redactMessages(currentMessages);
    
    // Combine macro maps
    const combinedMacroMap = new Map([
      ...historyResult.macroMap.entries(),
      ...messageResult.macroMap.entries()
    ]);

    return {
      redactedMessage: messageResult.redactedText,
      redactedMessages: historyResult.redactedMessages,
      macroMap: combinedMacroMap
    };
  }, []);

  const restoreFromOpenAI = useCallback((text: string, macroMap?: Map<string, string>) => {
    if (!serviceRef.current) {
      return text;
    }

    const result = serviceRef.current.restoreText(text, macroMap);
    return result.restoredText;
  }, []);

  const clearSession = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearSession();
    }
  }, []);

  return {
    redactForOpenAI,
    restoreFromOpenAI,
    clearSession
  };
};
