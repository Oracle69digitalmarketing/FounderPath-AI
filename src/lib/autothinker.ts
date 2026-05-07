import { llm } from './llm';
import { AUTOTHINKER_PROMPT } from './gemini';
import { safeStringify } from './firebase';
import { SkillProfile, VentureRecommendation } from '../types';

export class AutoThinker {
  async architect(profile: SkillProfile): Promise<VentureRecommendation> {
    const systemPrompt = AUTOTHINKER_PROMPT;
    const prompt = `
      CONTEXT:
      User SkillProfile: ${safeStringify(profile)}

      TASK:
      Generate the complete Venture Recommendation JSON. Return valid JSON only.
    `;

    const responseText = await llm.generate({ 
      prompt, 
      systemPrompt,
      agent: 'auto'
    });

    const response = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const raw = JSON.parse(response);
      return this.sanitize(raw);
    } catch (e) {
      console.error("AutoThinker parsing error", response);
      throw new Error("AutoThinker returned invalid JSON");
    }
  }

  private sanitize(raw: any): VentureRecommendation {
    const parseNum = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const clean = val.replace(/[^0-9.]/g, '');
        return parseFloat(clean) || 0;
      }
      return 0;
    };

    return {
      ...raw,
      viability_score: parseNum(raw.viability_score),
      startup_budget: parseNum(raw.startup_budget),
      first_30_days_revenue_estimate: parseNum(raw.first_30_days_revenue_estimate),
      business_plan: {
        ...raw.business_plan,
        financial_forecast: {
          startup_costs: (raw.business_plan?.financial_forecast?.startup_costs || []).map((c: any) => ({
            ...c,
            cost: parseNum(c.cost)
          })),
          revenue_projections: {
            ...raw.business_plan?.financial_forecast?.revenue_projections,
            month_1_target: parseNum(raw.business_plan?.financial_forecast?.revenue_projections?.month_1_target)
          }
        }
      }
    };
  }
}

export const autoThinker = new AutoThinker();
