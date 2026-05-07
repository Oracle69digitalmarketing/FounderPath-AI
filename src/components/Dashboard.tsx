import { useState, useMemo } from 'react';
import { UserProfile, SkillProfile, VentureRecommendation } from '../types';
import { ProgressCluster } from './ProgressCluster';
import { SkillInput } from './SkillInput';
import { RecommendationDisplay } from './RecommendationDisplay';
import { CareerAssets } from './CareerAssets';
import { coordinator } from '../lib/coordinator';
import { doc, updateDoc } from 'firebase/firestore';
import { db, safeStringify } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, MessageSquare, Bell, ArrowRight } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile | null;
}

export function Dashboard({ profile }: DashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nudges = useMemo(() => {
    const baseNudges = [
      { 
        id: 1, 
        type: 'WhatsApp', 
        message: '👋 Welcome to FounderPath! Your 10-day launch sequence starts today.', 
        time: 'Just now' 
      }
    ];

    if (profile?.venture_recommendation?.business_plan?.operations_plan?.ten_day_roadmap) {
      const roadmap = profile.venture_recommendation.business_plan.operations_plan.ten_day_roadmap;
      const dynamicNudges = roadmap.slice(0, 2).map((step, i) => ({
        id: i + 2,
        type: 'Action',
        message: `Next Step: ${step}`,
        time: `${i + 1}h ago`
      }));
      return [...baseNudges, ...dynamicNudges];
    }

    return [
      ...baseNudges,
      { 
        id: 2, 
        type: 'Insight', 
        message: 'Pro-tip: Most successful founders start by solving a problem they face personally.', 
        time: '2h ago' 
      }
    ];
  }, [profile?.venture_recommendation]);

  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [lastAuditInput, setLastAuditInput] = useState<{ text: string, files?: { mimeType: string, data: string }[] } | null>(null);

  const handleAnalyzeSkills = async (rawInput: string, files?: { mimeType: string, data: string }[]) => {
    setIsAnalyzing(true);
    setError(null);
    setFollowUpQuestions([]);
    setCurrentQuestionIndex(-1);
    setLastAuditInput({ text: rawInput, files });
    
    try {
      const result = await coordinator.process(rawInput, files);

      if (result.questions && result.questions.length > 0) {
        setFollowUpQuestions(result.questions);
        setCurrentQuestionIndex(0);
        setFollowUpAnswers([]);
        setIsAnalyzing(false);
        return;
      }

      if (result.profile && result.recommendation) {
        await saveToFirebase(result.profile, result.recommendation);
      }
    } catch (err) {
      console.error('Skill Analysis Error:', safeStringify(err));
      setError('Failed to analyze skills. Please try being more descriptive.');
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuestionSubmit = async (answer: string) => {
    const newAnswers = [...followUpAnswers, answer];
    setFollowUpAnswers(newAnswers);

    if (currentQuestionIndex < followUpQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsAnalyzing(true);
      try {
        const fullContext = `Initial context: ${lastAuditInput?.text}. Follow-up Answers: ${newAnswers.join(' | ')}`;
        const result = await coordinator.process(fullContext, lastAuditInput?.files);
        
        if (result.profile && result.recommendation) {
          await saveToFirebase(result.profile, result.recommendation);
          setFollowUpQuestions([]);
          setCurrentQuestionIndex(-1);
        } else {
          setError("Still need more information. Let's try once more.");
          setFollowUpQuestions(result.questions || []);
          setCurrentQuestionIndex(0);
        }
      } catch (e) {
        console.error("Audit Finalization Error:", safeStringify(e));
        setError("Failed to finalize skill audit.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const saveToFirebase = async (skillProfile: SkillProfile, ventureRec: VentureRecommendation) => {
    if (profile?.user_id) {
      const profileRef = doc(db, 'users', profile.user_id);
      await updateDoc(profileRef, {
        skill_profile: skillProfile,
        venture_recommendation: ventureRec,
        updated_at: new Date().toISOString()
      });
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
