import { useCallback } from 'react';
import { MLCEngine } from '@mlc-ai/web-llm';
import { zodToJsonSchema } from 'zod-to-json-schema';

import * as z from "zod";

export interface ComplexityAnalysis {
  llm: 'webllm' | 'openai';
  explanation: string;
}

export const useComplexityAnalysis = (engine: MLCEngine | null) => {
  const analyzeComplexity = useCallback(async (userQuery: string): Promise<ComplexityAnalysis> => {
    if (!engine) {
      throw new Error('WebLLM engine not initialized');
    }

    try {

      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: `
              Role: Prompt Complexity Rater  
              Context: You receive exactly one user prompt.  
              Goal: Return a complexity score from 1 to 5 using the rubric below.  
              Rubric  
              * 1 Very simple – single fact, trivial lookup  
              * 2 Simple – short answer, light reasoning  
              * 3 Moderate – some domain terms or two-step reasoning  
              * 4 Hard – multi-step reasoning or long context  
              * 5 Very hard – deep domain knowledge or several subtasks  

              Process  
              1. Classify the prompt against the rubric.  
              2. Output ONLY the JSON object:  
                {"score": <integer 1-5>, "explanation": "<max 100 words>"}

              Rules  
              * If torn between two scores pick the higher one.  
              * Do not reveal chain of thought or extra text.
              * Write a comprehensive explanation of the score in less than 100 words that deeply explains your reasoning and decision.  
              * If as part of the reason you return an error, please explain the error in the explanation field.
            ` },
          { role: "user", content: `User query: ${userQuery}` }
        ],
        temperature: 0,
        max_tokens: 200,
        response_format: {
          type: 'json_object',
          schema: JSON.stringify(zodToJsonSchema(
            z.object({ score: z.number().min(1).max(5), explanation: z.string() })
          )),
        },
      });

      const { score, explanation } = JSON.parse(response.choices[0]?.message?.content || '');

      console.log('Complexity analysis response:', { score, explanation });

      if (!score || !explanation) {
        throw new Error('Invalid analysis format');
      }

      return { llm: score < 3 ? 'webllm' : 'openai', explanation };

    } catch (error) {
      console.error('Error analyzing complexity:', error);
      return {
        llm: 'webllm',
        explanation: 'Error during complexity analysis'
      };
    }
  }, [engine]);

  return { analyzeComplexity };
}; 