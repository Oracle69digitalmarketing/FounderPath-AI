import { llm } from './llm';
import { SKILLTHINKER_PROMPT } from './gemini';
import { SkillProfile } from '../types';

export interface AuditResult {
  questions?: string[];
  profile?: SkillProfile;
}

export class SkillThinker {
  async audit(input: string, files?: { mimeType: string, data: string }[]): Promise<AuditResult> {
    const systemPrompt = SKILLTHINKER_PROMPT;

    const prompt = `
      USER INPUT: "${input}"
      
      TASK:
      Analyze the input and return the result in the specified JSON format.
    `;

    const responseText = await llm.generate({ 
      prompt, 
      systemPrompt, 
      files,
      agent: 'skill'
    });

    const response = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error("SkillThinker parsing error", response);
      throw new Error("SkillThinker returned invalid JSON");
    }
  }
}

export const skillThinker = new SkillThinker();
