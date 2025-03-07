import { useCallback } from 'react';
import { MLCEngine } from '@mlc-ai/web-llm';

export interface ComplexityAnalysis {
  llm: 'webllm' | 'openai';
  explanation: string;
}

const COMPLEXITY_ANALYSIS_PROMPT = `
  Analyze the complexity of the following user prompt and decide which LLM should handle it:
  - "webllm" for very simple queries that are suitable for small, in-browser models.
  - "openai" for complex queries that require a more advanced model.

  Your response must follow this exact format:
  LLM: [webllm or openai]
  Explanation: [a brief explanation of your decision]

  User Prompt:
`;

export const useComplexityAnalysis = (engine: MLCEngine | null) => {
  const analyzeComplexity = useCallback(async (code: string): Promise<ComplexityAnalysis> => {
    if (!engine) {
      throw new Error('WebLLM engine not initialized');
    }

    try {
      const analysisPrompt = COMPLEXITY_ANALYSIS_PROMPT + code;
      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: "You are a prompt complexity analyzer." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      // Extract score and explanation from the response
      const llmMatch = analysisText.match(/LLM:\s*(.+)/i);
      const explanationMatch = analysisText.match(/Explanation:\s*(.+)/i);
      
      if (!llmMatch || !explanationMatch) {
        throw new Error('Invalid analysis format');
      }

      return {
        llm: llmMatch[1].trim().toLowerCase() as 'webllm' | 'openai',
        explanation: explanationMatch[1].trim()
      };
    } catch (error) {
      console.error('Error analyzing complexity:', error);
      return {
        llm: 'webllm',
        explanation: 'Error during complexity analysis'
      };
    }
  }, [engine]);

  return {
    analyzeComplexity,
    COMPLEXITY_ANALYSIS_PROMPT
  };
}; 