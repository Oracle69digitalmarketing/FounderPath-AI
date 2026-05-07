import { skillThinker, AuditResult } from './skillthinker';
import { autoThinker } from './autothinker';
import { SkillProfile, VentureRecommendation } from '../types';

export class Coordinator {
  async process(input: string, files?: { mimeType: string, data: string }[]): Promise<AuditResult & { recommendation?: VentureRecommendation }> {
    console.log("[Coordinator] Initiating SkillThinker Audit...");
    const auditResult = await skillThinker.audit(input, files);

    if (auditResult.profile) {
      console.log("[Coordinator] Pass: Skill Profile extraction successful. Initiating AutoThinker Architect...");
      const recommendation = await autoThinker.architect(auditResult.profile);
      return { ...auditResult, recommendation };
    }

    console.log("[Coordinator] Notice: Discovery Loop triggered. More information needed.");
    return auditResult;
  }
}

export const coordinator = new Coordinator();
