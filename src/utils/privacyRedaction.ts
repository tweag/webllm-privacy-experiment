import { MLCEngine } from '@mlc-ai/web-llm';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as z from 'zod';

export interface PIIEntity {
  name: string;
  type: 'person' | 'organization';
  startIndex: number;
  endIndex: number;
}

export interface RedactionResult {
  redactedText: string;
  entities: PIIEntity[];
  macroMap: Map<string, string>; // macro -> original name
}

export interface RestoreResult {
  restoredText: string;
}

// Schema for WebLLM PII detection response
const PIIDetectionSchema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['person', 'organization']),
    context: z.string().optional()
  }))
});

export class PrivacyRedactionService {
  private sessionMacroMap: Map<string, string> = new Map(); // macro -> original name
  private reverseSessionMacroMap: Map<string, string> = new Map(); // original name -> macro
  private personCounter = 0;
  private orgCounter = 0;

  constructor(private engine: MLCEngine) {}

  /**
   * Detect PII entities in text using WebLLM
   */
  private async detectPIIEntities(text: string): Promise<PIIEntity[]> {
    const prompt = `
Role: Privacy Information Detector
Task: Identify names of people and organizations in the given text.
Rules:
- Only detect actual names of people (first names, last names, full names)
- Only detect names of organizations, companies, institutions
- Do NOT detect: addresses, phone numbers, emails, ages, dates, locations, job titles
- Do NOT detect: generic terms like "the company", "my friend", "the person"
- Return ONLY the JSON object with the detected entities

Input text: "${text}"

Output format:
{
  "entities": [
    {
      "name": "John Smith",
      "type": "person"
    },
    {
      "name": "Microsoft Corporation", 
      "type": "organization"
    }
  ]
}`;

    try {

      console.log("prompt:", prompt);
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: "You are a privacy-focused entity detection system. You only detect names of people and organizations." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_tokens: 500,
        response_format: {
          type: 'json_object',
          schema: JSON.stringify(zodToJsonSchema(PIIDetectionSchema))
        }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{"entities": []}');
      const entities: PIIEntity[] = [];

      console.log('PII Detection Result:', result);

      // Convert to PIIEntity format with position information
      for (const entity of result.entities) {
        const startIndex = text.toLowerCase().indexOf(entity.name.toLowerCase());
        if (startIndex !== -1) {
          entities.push({
            name: entity.name,
            type: entity.type,
            startIndex,
            endIndex: startIndex + entity.name.length
          });
        }
      }

      return entities;
    } catch (error) {
      console.error('Error detecting PII entities:', error);
      return [];
    }
  }

  /**
   * Generate a macro for an entity
   */
  private generateMacro(entity: PIIEntity): string {
    const existing = this.reverseSessionMacroMap.get(entity.name);
    if (existing) {
      return existing;
    }

    let macro: string;
    if (entity.type === 'person') {
      this.personCounter++;
      macro = `PERSON_${this.personCounter}`;
    } else {
      this.orgCounter++;
      macro = `ORG_${this.orgCounter}`;
    }

    this.sessionMacroMap.set(macro, entity.name);
    this.reverseSessionMacroMap.set(entity.name, macro);
    return macro;
  }

  /**
   * Redact PII from text and return redacted text with macro mappings
   */
  async redactText(text: string): Promise<RedactionResult> {
    const entities = await this.detectPIIEntities(text);
    
    if (entities.length === 0) {
      return {
        redactedText: text,
        entities: [],
        macroMap: new Map()
      };
    }

    // Sort entities by start index in reverse order to replace from end to beginning
    const sortedEntities = [...entities].sort((a, b) => b.startIndex - a.startIndex);
    
    let redactedText = text;
    const macroMap = new Map<string, string>();

    for (const entity of sortedEntities) {
      const macro = this.generateMacro(entity);
      macroMap.set(macro, entity.name);
      
      // Replace the entity name with the macro
      redactedText = redactedText.substring(0, entity.startIndex) + 
                    macro + 
                    redactedText.substring(entity.endIndex);
    }

    console.log('PII Redaction:', {
      originalText: text,
      redactedText,
      entities: entities.map(e => ({ name: e.name, type: e.type })),
      macroMap: Object.fromEntries(macroMap)
    });

    return {
      redactedText,
      entities,
      macroMap
    };
  }

  /**
   * Restore original names from macros in text
   */
  restoreText(text: string, macroMap?: Map<string, string>): RestoreResult {
    let restoredText = text;
    
    // Use provided macroMap or session macroMap
    const mapToUse = macroMap || this.sessionMacroMap;
    
    // Replace macros with original names
    for (const [macro, originalName] of mapToUse.entries()) {
      const regex = new RegExp(macro, 'g');
      restoredText = restoredText.replace(regex, originalName);
    }

    return {
      restoredText
    };
  }

  /**
   * Redact an array of messages (for conversation history)
   */
  async redactMessages(messages: Array<{ role: string; content: string }>): Promise<{
    redactedMessages: Array<{ role: string; content: string }>;
    macroMap: Map<string, string>;
  }> {
    const redactedMessages = [];
    const combinedMacroMap = new Map<string, string>();

    for (const message of messages) {
      if (message.role === 'user') {
        const result = await this.redactText(message.content);
        redactedMessages.push({
          role: message.role,
          content: result.redactedText
        });
        
        // Combine macro maps
        for (const [macro, name] of result.macroMap.entries()) {
          combinedMacroMap.set(macro, name);
        }
      } else {
        // Don't redact assistant messages
        redactedMessages.push(message);
      }
    }

    return {
      redactedMessages,
      macroMap: combinedMacroMap
    };
  }

  /**
   * Clear session macro mappings
   */
  clearSession(): void {
    this.sessionMacroMap.clear();
    this.reverseSessionMacroMap.clear();
    this.personCounter = 0;
    this.orgCounter = 0;
  }

  /**
   * Get current session macro mappings
   */
  getSessionMacroMap(): Map<string, string> {
    return new Map(this.sessionMacroMap);
  }
}
