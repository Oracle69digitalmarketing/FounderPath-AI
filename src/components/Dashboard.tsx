import { useState } from 'react';
import { UserProfile, SkillProfile, VentureRecommendation } from '../types';
import { ProgressCluster } from './ProgressCluster';
import { SkillInput } from './SkillInput';
import { RecommendationDisplay } from './RecommendationDisplay';
import { CareerAssets } from './CareerAssets';
import { ai, MASTER_PROMPT } from '../lib/gemini';
import { doc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, safeStringify } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, MessageSquare, Bell, ArrowRight } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile | null;
}

export function Dashboard({ profile }: DashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nudges = [
    { 
      id: 1, 
      type: 'WhatsApp', 
      message: '👋 Welcome to FounderPath! Your 10-day launch sequence starts today. Action 1: Define your target area.', 
      time: 'Just now' 
    },
    { 
      id: 2, 
      type: 'Insight', 
      message: 'Pro-tip: 80% of Office Lunch-Box founders succeed by partnering with building security first.', 
      time: '2h ago' 
    }
  ];

  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);

  const handleAnalyzeSkills = async (rawInput: string) => {
    setIsAnalyzing(true);
    setError(null);
    setFollowUpQuestions([]);
    setCurrentQuestionIndex(-1);
    
    try {
      const model = "gemini-3-flash-preview";
      
      const skillPrompt = `
        Analyze the following user statement about their skills and experience. 
        If the information is too vague to build a professional-grade Nigerian business plan (e.g. "I know how to cook"), return a JSON with a "questions" array of 3 specific follow-up questions.
        If the information is sufficient, return a "profile" object matching the SkillProfile structure.

        JSON Structure:
        {
          "questions": ["Question 1", "Question 2", "Question 3"], // ONLY if info is insufficient
          "profile": { // ONLY if info is sufficient
            "core_competencies": ["..."],
            "ancillary_skills": ["..."],
            "informal_experience": ["..."],
            "certifications": [],
            "confidence_gap": ["..."],
            "learning_velocity": "High/Medium/Low"
          }
        }
        
        User input: "${rawInput}"
      `;
      
      const skillResult = await ai.models.generateContent({
        model,
        contents: skillPrompt
      });
      
      const skillResponseText = skillResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      let skillResponse: any;
      try {
        skillResponse = JSON.parse(skillResponseText);
      } catch (e) {
        throw new Error("AI returned malformed skill audit response");
      }

      if (skillResponse.questions && skillResponse.questions.length > 0) {
        setFollowUpQuestions(skillResponse.questions);
        setCurrentQuestionIndex(0);
        setFollowUpAnswers([]);
        setIsAnalyzing(false);
        return;
      }

      const skillProfile = skillResponse.profile;
      await generateVenture(skillProfile);
    } catch (err) {
      console.error('Skill Analysis Error:', err instanceof Error ? err.message : String(err));
      setError('Failed to analyze skills. Please try being more descriptive.');
      setIsAnalyzing(false);
    }
  };

  const handleQuestionSubmit = async (answer: string) => {
    const newAnswers = [...followUpAnswers, answer];
    setFollowUpAnswers(newAnswers);

    if (currentQuestionIndex < followUpQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, generate venture
      setIsAnalyzing(true);
      try {
        const fullContext = `Initial input context. Answers: ${newAnswers.join(' | ')}`;
        
        const model = "gemini-3-flash-preview";
        const finalSkillPrompt = `
          Based on these detailed answers, create a comprehensive SkillProfile.
          Context: ${fullContext}
          JSON Structure:
          {
            "core_competencies": ["..."],
            "ancillary_skills": ["..."],
            "informal_experience": ["..."],
            "certifications": [],
            "confidence_gap": ["..."],
            "learning_velocity": "High"
          }
        `;
        
        const res = await ai.models.generateContent({ model, contents: finalSkillPrompt });
        const skillProfile = JSON.parse(res.text.replace(/```json/gi, '').replace(/```/g, '').trim());
        
        await generateVenture(skillProfile);
        setFollowUpQuestions([]);
        setCurrentQuestionIndex(-1);
      } catch (e) {
        setError("Failed to finalize skill audit.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const generateVenture = async (skillProfile: SkillProfile) => {
    setIsAnalyzing(true);
    try {
      const model = "gemini-3-flash-preview";
      // Now generate Venture Recommendation
      const venturePrompt = `
        ${MASTER_PROMPT}
        
        User SkillProfile: ${safeStringify(skillProfile)}
        
        Generate the Venture Recommendation in JSON format. 
      `;
      
      const ventureResult = await ai.models.generateContent({
        model,
        contents: venturePrompt
      });
      
      const ventureRecText = ventureResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      let rawVentureRec: any;
      try {
        rawVentureRec = JSON.parse(ventureRecText);
      } catch (e) {
        throw new Error("AI returned malformed venture recommendation");
      }
      
      // Sanitizer for numbers
      const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const clean = val.replace(/[^0-9.]/g, '');
          return parseFloat(clean) || 0;
        }
        return 0;
      };

      const sanitizeCosts = (costs: any[]) => {
        return (costs || []).map(item => ({
          item: String(item.item || 'General Expense'),
          cost: parseNum(item.cost),
          justification: String(item.justification || 'Necessary operational cost')
        }));
      };

      // Ensure numeric fields are numbers
      const ventureRec: VentureRecommendation = {
        recommended_model: rawVentureRec.recommended_model || "New Venture",
        viability_score: parseNum(rawVentureRec.viability_score),
        reasoning: rawVentureRec.reasoning || "",
        business_model_summary: rawVentureRec.business_model_summary || "",
        business_plan: {
          executive_summary: rawVentureRec.business_plan?.executive_summary || "",
          problem_solution: {
            problem: rawVentureRec.business_plan?.problem_solution?.problem || "",
            solution: rawVentureRec.business_plan?.problem_solution?.solution || "",
            unique_value_proposition: rawVentureRec.business_plan?.problem_solution?.unique_value_proposition || ""
          },
          market_analysis: {
            definition: rawVentureRec.business_plan?.market_analysis?.definition || "",
            size_growth: rawVentureRec.business_plan?.market_analysis?.size_growth || "",
            segments: rawVentureRec.business_plan?.market_analysis?.segments || [],
            competition: rawVentureRec.business_plan?.market_analysis?.competition || ""
          },
          operations_plan: {
            ten_day_roadmap: rawVentureRec.business_plan?.operations_plan?.ten_day_roadmap || [],
            resource_needs: rawVentureRec.business_plan?.operations_plan?.resource_needs || "",
            legal_admin: rawVentureRec.business_plan?.operations_plan?.legal_admin || ""
          },
          financial_forecast: {
            startup_costs: sanitizeCosts(rawVentureRec.business_plan?.financial_forecast?.startup_costs),
            revenue_projections: {
              month_1_target: parseNum(rawVentureRec.business_plan?.financial_forecast?.revenue_projections?.month_1_target),
              pricing_model: rawVentureRec.business_plan?.financial_forecast?.revenue_projections?.pricing_model || "",
              break_even_hours_or_units: rawVentureRec.business_plan?.financial_forecast?.revenue_projections?.break_even_hours_or_units || ""
            }
          },
          risk_management: (rawVentureRec.business_plan?.risk_management || []).map((r: any) => ({
            risk: String(r.risk || 'Unforeseen Challenge'),
            mitigation: String(r.mitigation || 'Contingency planning')
          }))
        },
        pitch_deck: (rawVentureRec.pitch_deck || []).map((s: any) => ({
          title: String(s.title || 'Venture Overview'),
          content: Array.isArray(s.content) ? s.content : [String(s.content)],
          visual_hint: String(s.visual_hint || 'Visual representation of data')
        })),
        startup_budget: parseNum(rawVentureRec.startup_budget),
        first_30_days_revenue_estimate: parseNum(rawVentureRec.first_30_days_revenue_estimate),
        gtm_strategy: rawVentureRec.gtm_strategy || "Organic growth through social media and local networking.",
        scouted_opportunities: (rawVentureRec.scouted_opportunities || []).map((o: any) => ({
          platform: String(o.platform || 'General Market'),
          type: o.type || 'Local',
          tactic: String(o.tactic || 'Direct outreach'),
          search_terms: Array.isArray(o.search_terms) ? o.search_terms : []
        })),
        required_upskilling: rawVentureRec.required_upskilling || [],
        learning_resources: (rawVentureRec.learning_resources || []).map((l: any) => ({
          topic: String(l.topic || 'Skill Mastery'),
          source: String(l.source || 'Online Platform'),
          url: String(l.url || '#')
        })),
        recommended_learning_modules: rawVentureRec.recommended_learning_modules || []
      };

      // Save to Firebase
      if (profile?.user_id) {
        const profileRef = doc(db, 'users', profile.user_id);
        await updateDoc(profileRef, {
          skill_profile: skillProfile,
          venture_recommendation: ventureRec,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
       console.error("Venture generation error", e);
       setError("Failed to generate venture blueprint.");
    } finally {
       setIsAnalyzing(false);
    }
  };

  const skillReadiness = profile?.skill_profile ? 65 : 0;
  const ventureReadiness = profile?.venture_recommendation ? 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Founder Dashboard</h2>
          <p className="text-slate-500">Track your journey from skill to venture.</p>
        </div>
        <ProgressCluster 
          skillReadiness={skillReadiness} 
          ventureReadiness={ventureReadiness} 
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {currentQuestionIndex >= 0 ? (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-xl shadow-indigo-100 flex flex-col gap-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {followUpQuestions.length}</span>
                  <div className="flex gap-1">
                    {followUpQuestions.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= currentQuestionIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 leading-tight">{followUpQuestions[currentQuestionIndex]}</h3>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Your answer..."
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleQuestionSubmit((e.target as HTMLTextAreaElement).value);
                      (e.target as HTMLTextAreaElement).value = '';
                    }
                  }}
                />
                <button 
                   onClick={(e) => {
                     const textarea = (e.currentTarget.previousSibling as HTMLTextAreaElement);
                     handleQuestionSubmit(textarea.value);
                     textarea.value = '';
                   }}
                   className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <SkillInput 
                onSubmit={handleAnalyzeSkills} 
                isAnalyzing={isAnalyzing} 
                hasProfile={!!profile?.skill_profile}
              />
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {profile?.skill_profile && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-slate-900">Skill Audit Complete</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skill_profile.core_competencies.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <CareerAssets hasSkills={!!profile?.skill_profile} />

          {/* Nudge Console */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold">Nudge Center</h3>
              </div>
              <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded-full uppercase font-bold text-white tracking-widest animate-pulse">Live</span>
            </div>
            <div className="flex flex-col gap-4">
              {nudges.map((nudge) => (
                <div key={nudge.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{nudge.type}</span>
                    <span className="text-[10px] text-slate-500">{nudge.time}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{nudge.message}</p>
                </div>
              ))}
              {profile?.phone && (
                <div className="mt-2 p-3 bg-indigo-900/40 rounded-xl border border-indigo-700/50 flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-indigo-200">System syncing with <b>{profile.phone}</b> for WhatsApp nudges.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <RecommendationDisplay 
            recommendation={profile?.venture_recommendation} 
            isAnalyzing={isAnalyzing}
            userId={profile?.user_id}
            currentPhone={profile?.phone}
          />
        </div>
      </div>
    </div>
  );
}
