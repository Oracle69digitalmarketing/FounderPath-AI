import { ai } from './gemini';
import { getModelConfig, AgentType } from './modelRouter';
import { safeStringify } from './firebase';

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  files?: { mimeType: string, data: string }[];
  agent?: AgentType;
}

export class LLMService {
  async generate(req: LLMRequest): Promise<string> {
    const config = getModelConfig(req.agent);

    if (config.provider === 'nim') {
      return this.callNIM(req);
    } else {
      return this.callGemini(req);
    }
  }

  private async callGemini(req: LLMRequest): Promise<string> {
    const config = getModelConfig(req.agent);
    const model = ai.getGenerativeModel({ 
      model: config.model,
      systemInstruction: req.systemPrompt 
    });
    
    const parts: any[] = [{ text: req.prompt }];
    
    if (req.files) {
      req.files.forEach(f => {
        parts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: f.data
          }
        });
      });
    }

    const result = await model.generateContent(parts);
    return result.response.text();
  }

  private async callNIM(req: LLMRequest): Promise<string> {
    const config = getModelConfig(req.agent);
    
    console.log(`[NIM] Routing to ${config.model} at ${config.endpoint} for agent: ${req.agent || 'default'}`);

    try {
      const response = await fetch(`${config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: req.systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: req.prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`NIM API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error("[NIM] Error, falling back to Gemini:", safeStringify(err));
      return this.callGemini(req);
    }
  }
}

export const llm = new LLMService();
