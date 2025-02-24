/**
 * Complexity Analysis Hook
 * Provides functionality to analyze code complexity
 */

import { useCallback } from 'react';
import { MLCEngine } from '@mlc-ai/web-llm';

export interface ComplexityAnalysis {
  complexity: number;
  explanation: string;
}

const COMPLEXITY_ANALYSIS_PROMPT = `
  Analyze the complexity of the following code and provide a score from 1-10, where:
  1 = Very simple, suitable for beginners
  10 = Very complex, requires expert knowledge
  
  Also provide a brief explanation for the score.
  
  Format your response exactly as follows:
  Score: [number]
  Explanation: [your explanation]
  
  Code to analyze:
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
          { role: "system", content: "You are a code complexity analyzer." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      // Extract score and explanation from the response
      const scoreMatch = analysisText.match(/Score:\s*(\d+)/i);
      const explanationMatch = analysisText.match(/Explanation:\s*(.+)/i);
      
      if (!scoreMatch || !explanationMatch) {
        throw new Error('Invalid analysis format');
      }

      return {
        complexity: Math.min(10, Math.max(1, parseInt(scoreMatch[1], 10))),
        explanation: explanationMatch[1].trim()
      };
    } catch (error) {
      console.error('Error analyzing complexity:', error);
      return {
        complexity: 5,
        explanation: 'Error during complexity analysis'
      };
    }
  }, [engine]);

  return {
    analyzeComplexity,
    COMPLEXITY_ANALYSIS_PROMPT
  };
}; 