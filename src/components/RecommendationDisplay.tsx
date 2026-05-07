import { useState } from 'react';
import { VentureRecommendation, PitchSlide, Opportunity, LearningResource } from '../types';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  Rocket, Target, DollarSign, BookOpen, ChevronRight, FileText, 
  Phone, ArrowRight, Loader2, Presentation, Search, Globe, 
  ExternalLink, BarChart3, Users, LayoutDashboard, CheckCircle2,
  MessageSquare
} from 'lucide-react';

interface RecommendationDisplayProps {
  recommendation?: VentureRecommendation;
  isAnalyzing: boolean;
  userId?: string;
  currentPhone?: string;
}

type Tab = 'strategy' | 'plan' | 'deck' | 'opportunities' | 'learning';

export function RecommendationDisplay({ recommendation, isAnalyzing, userId, currentPhone }: RecommendationDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('strategy');
  const [showLaunchForm, setShowLaunchForm] = useState(false);
  const [phone, setPhone] = useState(currentPhone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLaunch = async () => {
    if (!phone) {
      alert("Please enter a WhatsApp number to receive your launch sequence.");
      return;
    }

    if (!userId) return;

    setIsSaving(true);
    try {
      const profileRef = doc(db, 'users', userId);
      await updateDoc(profileRef, {
        phone: phone,
        updated_at: new Date().toISOString(),
        'operational_status.last_nudge_sent': new Date().toISOString()
      });
      alert(`Venture Launch Sequence Initiated! Your 10-day roadmap is being synchronized with your dashboard. Check WhatsApp (${phone}) for the first onboarding nudge.`);
      setShowLaunchForm(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadBusinessPlan = () => {
    if (!recommendation) return;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;

    const addText = (text: string, size = 12, style = 'normal', color = [0, 0, 0]) => {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
      doc.text(splitText, margin, y);
      y += (splitText.length * (size / 2)) + 5;
    };

    const addSection = (title: string) => {
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(title.toUpperCase(), margin, y);
      doc.setDrawColor(79, 70, 229);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 12;
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('FOUNDERPATH BUSINESS BLUEPRINT', margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('CONFIDENTIAL - FOR EXTERNAL REVIEW & EXECUTION', margin, y);
    y += 15;

    addText(`PROJECT: ${recommendation.recommended_model}`, 16, 'bold', [15, 23, 42]);
    addText(`DATE: ${new Date().toLocaleDateString()}`, 10);
    addText(`CURRENCY: NGN (Nigerian Naira)`, 10);

    addSection('1. Executive Summary');
    addText(recommendation.business_plan.executive_summary, 11);

    addSection('2. Problem & Solution');
    addText(`Problem: ${recommendation.business_plan.problem_solution.problem}`, 11);
    addText(`Solution: ${recommendation.business_plan.problem_solution.solution}`, 11);
    addText(`UVP: ${recommendation.business_plan.problem_solution.unique_value_proposition}`, 11, 'bold');

    if (y > 250) { doc.addPage(); y = 30; }

    addSection('3. Market Analysis');
    addText(`Definition: ${recommendation.business_plan.market_analysis.definition}`, 11);
    addText(`Size: ${recommendation.business_plan.market_analysis.size_growth}`, 11);
    addText(`Segments: ${recommendation.business_plan.market_analysis.segments.join(', ')}`, 11);

    addSection('4. 10-Day Launch Roadmap');
    recommendation.business_plan.operations_plan.ten_day_roadmap.forEach((step, i) => {
      addText(`${i + 1}. ${step}`, 10);
      if (y > 270) { doc.addPage(); y = 30; }
    });

    addSection('5. Financial Projections');
    addText(`Startup Budget: NGN ${recommendation.startup_budget.toLocaleString()}`, 12, 'bold');
    addText(`Month 1 Revenue Target: NGN ${recommendation.first_30_days_revenue_estimate.toLocaleString()}`, 12, 'bold', [5, 150, 105]);
    
    // Costs Table
    (doc as any).autoTable({
      startY: y,
      head: [['Item', 'Cost (NGN)', 'Justification']],
      body: recommendation.business_plan.financial_forecast.startup_costs.map(c => [
        c.item, 
        c.cost.toLocaleString(), 
        c.justification
      ]),
      margin: { left: margin },
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`FounderPath_Blueprint_${recommendation.recommended_model.replace(/\s+/g, '_')}.pdf`);
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-6 min-h-[500px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <Rocket className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Venture Engine Running</h3>
          <p className="text-slate-500 max-w-xs">Matching your human capital profile against optimal venture architectures...</p>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[500px]">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Target className="w-8 h-8 text-slate-300" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Venture Target Yet</h3>
          <p className="text-slate-500">Complete your skill audit on the left to generate your personalized business blueprint.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Hero Recommendation */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
            <Rocket className="w-3 h-3" />
            Recommended Model
          </div>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{recommendation.recommended_model}</h3>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">{recommendation.reasoning}</p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Rocket className="w-48 h-48 text-indigo-600" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')} icon={<Target className="w-4 h-4" />} label="Strategy" />
        <TabButton active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} icon={<FileText className="w-4 h-4" />} label="Business Plan" />
        <TabButton active={activeTab === 'deck'} onClick={() => setActiveTab('deck')} icon={<Presentation className="w-4 h-4" />} label="Pitch Deck" />
        <TabButton active={activeTab === 'opportunities'} onClick={() => setActiveTab('opportunities')} icon={<Search className="w-4 h-4" />} label="Market Scout" />
        <TabButton active={activeTab === 'learning'} onClick={() => setActiveTab('learning')} icon={<BookOpen className="w-4 h-4" />} label="Learning Hub" />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' && (
            <motion.div key="strategy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ContentCard 
                  icon={<DollarSign className="w-5 h-5 text-amber-600" />} 
                  title="Business Revenue Model" 
                  bg="bg-amber-50"
                >
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{recommendation.business_model_summary}</p>
                  <div className="flex justify-between items-center py-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Est. 30D Revenue</span>
                    <span className="font-bold text-slate-900 text-lg">₦{recommendation.first_30_days_revenue_estimate?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Launch Budget</span>
                    <span className="font-bold text-slate-900">₦{recommendation.startup_budget?.toLocaleString() || '0'}</span>
                  </div>
                </ContentCard>

                <ContentCard 
                  icon={<BarChart3 className="w-5 h-5 text-emerald-600" />} 
                  title="GTM Launch Strategy" 
                  bg="bg-emerald-50"
                >
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{recommendation.gtm_strategy}</p>
                  <button 
                    onClick={() => setActiveTab('plan')}
                    className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                  >
                    View Launch Roadmap <ArrowRight className="w-3 h-3" />
                  </button>
                </ContentCard>
              </div>

              {/* Market Quick Scouting */}
              <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold">Immediate Client Scouting Opportunities</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(recommendation.scouted_opportunities || []).slice(0, 2).map((opp, i) => (
                    <div key={i} className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{opp.platform}</p>
                      <p className="text-xs text-slate-300 mb-3">{opp.tactic}</p>
                      <div className="flex flex-wrap gap-1">
                        {opp.search_terms.map((term, j) => (
                          <span key={j} className="text-[9px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded">"{term}"</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6 pb-12">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-10">
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" /> Executive Summary
                    </h4>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">PROFESSIONAL GRADE</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed border-l-4 border-indigo-100 pl-4 bg-slate-50/50 p-6 rounded-r-xl">
                    {recommendation.business_plan?.executive_summary || "Blueprint summary generating..."}
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Problem & Solution</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                        <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Critical Pain Points</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{recommendation.business_plan?.problem_solution?.problem}</p>
                      </div>
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Our Strategic Solution</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{recommendation.business_plan?.problem_solution?.solution}</p>
                      </div>
                      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Unique Value Proposition</p>
                        <p className="text-sm text-slate-900 font-bold leading-relaxed">{recommendation.business_plan?.problem_solution?.unique_value_proposition}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Market Segmentation</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5"><Target className="w-3 h-3"/> Market Definition</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{recommendation.business_plan?.market_analysis?.definition}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5"><Globe className="w-3 h-3"/> Target Segments</p>
                        <div className="flex flex-wrap gap-2">
                          {(recommendation.business_plan?.market_analysis?.segments || []).map((s, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Competitive Landscape</p>
                        <p className="text-sm text-slate-600 italic">"{recommendation.business_plan?.market_analysis?.competition}"</p>
                      </div>
                    </div>
                  </section>
                </div>

                <section id="launch-roadmap">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">10-Day Operational sequence</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(recommendation.business_plan?.operations_plan?.ten_day_roadmap || []).map((step, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group">
                        <span className="flex-shrink-0 w-8 h-8 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 text-xs font-black rounded-lg flex items-center justify-center transition-colors">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">Phase Step</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Unit Economics & Financials</h4>
                    <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                       <div className="flex justify-between items-end border-b border-white/10 pb-6 relative z-10">
                         <div>
                           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target Revenue (Month 1)</p>
                           <p className="text-3xl font-black text-indigo-400">₦{(recommendation.business_plan?.financial_forecast?.revenue_projections?.month_1_target || 0).toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pricing Model</p>
                           <p className="text-sm font-bold bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/30">
                             {recommendation.business_plan?.financial_forecast?.revenue_projections?.pricing_model}
                           </p>
                         </div>
                       </div>
                       <div className="flex flex-col gap-4 relative z-10">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-500/20 rounded-lg">
                             <Target className="w-4 h-4 text-indigo-400" />
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400">Break-even Metric</p>
                             <p className="text-sm font-semibold">{recommendation.business_plan?.financial_forecast?.revenue_projections?.break_even_hours_or_units}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-amber-500/20 rounded-lg">
                             <DollarSign className="w-4 h-4 text-amber-400" />
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400">Itemized Startup Needs</p>
                             <p className="text-sm font-semibold">₦{(recommendation.startup_budget || 0).toLocaleString()}</p>
                           </div>
                         </div>
                       </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Risk & Mitigation</h4>
                    <div className="flex flex-col gap-3">
                      {(recommendation.business_plan?.risk_management || []).map((risk, i) => (
                        <div key={i} className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                             <p className="text-xs font-black text-amber-900 uppercase">{risk.risk}</p>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed italic ml-3.5 border-l border-amber-200 pl-3">
                            <b>Mitigation:</b> {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'deck' && (
            <motion.div key="deck" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8 pb-12">
              <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto w-full">
                {(recommendation.pitch_deck || []).map((slide, i) => (
                  <div key={i} className="aspect-[16/10] bg-slate-900 rounded-3xl p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden border border-slate-800 group">
                    <div className="absolute top-0 right-0 p-8 text-indigo-500/20 font-black text-7xl select-none group-hover:text-indigo-500/40 transition-colors">
                      {i + 1}
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-indigo-500/30">
                        <Rocket className="w-3 h-3" />
                        FounderPath Pitch Engine
                      </div>
                      <h5 className="text-4xl font-black mb-8 tracking-tight">{slide.title}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ul className="text-lg text-indigo-100 space-y-4">
                          {slide.content.map((point, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <ChevronRight className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
                           <Presentation className="w-12 h-12 text-indigo-400 opacity-50" />
                           <p className="text-xs text-indigo-200/60 font-medium leading-relaxed italic">
                             <b>Visual Guide:</b><br/>
                             {slide.visual_hint}
                           </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 flex justify-between items-center pt-8 border-t border-white/10">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{recommendation.recommended_model}</span>
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confidential Plan • 2024</span>
                    </div>
                    {/* Abstract slide background art */}
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'opportunities' && (
            <motion.div key="opportunities" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(recommendation.scouted_opportunities || []).map((opp, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       {opp.type === 'LinkedIn' && <Users className="w-5 h-5 text-blue-600" />}
                       {opp.type === 'Facebook' && <Globe className="w-5 h-5 text-blue-800" />}
                       {opp.type === 'Quora' && <MessageSquare className="w-5 h-5 text-red-600" />}
                       {opp.type === 'Local' && <Search className="w-5 h-5 text-slate-600" />}
                       <span className="font-bold text-slate-900">{opp.platform}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{opp.tactic}</p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {opp.search_terms.map((term, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-bold tracking-tighter">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'learning' && (
            <motion.div key="learning" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
               <div className="bg-indigo-900 p-8 rounded-2xl text-white shadow-lg overflow-hidden relative">
                 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                     <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                       <LayoutDashboard className="w-5 h-5 text-indigo-400"/> Learning Roadmap
                     </h4>
                     <div className="flex flex-col gap-3">
                       {(recommendation.learning_resources || []).map((res, i) => (
                         <div key={i} className="p-3 bg-indigo-800/50 rounded-lg border border-indigo-700/50 flex justify-between items-center group">
                           <div>
                             <p className="text-sm font-bold">{res.topic}</p>
                             <p className="text-[10px] text-indigo-300 uppercase font-bold">{res.source}</p>
                           </div>
                           <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                             <ExternalLink className="w-4 h-4" />
                           </a>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div>
                     <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-indigo-400"/> Critical Mastery
                     </h4>
                     <div className="flex flex-wrap gap-2">
                       {(recommendation.required_upskilling || []).map((item, i) => (
                         <span key={i} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-medium">
                           {item}
                         </span>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200">
        <button 
          onClick={downloadBusinessPlan}
          className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
          <FileText className="w-5 h-5" />
          Download Pro Business Plan
        </button>
        
        {!showLaunchForm ? (
          <button 
            onClick={() => setShowLaunchForm(true)}
            className="w-full sm:w-auto px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all transform hover:-translate-y-1"
          >
            Launch in 10 Days
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 bg-emerald-50 p-2 rounded-2xl border border-emerald-100"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-emerald-200 w-full sm:w-auto">
              <Phone className="w-4 h-4 text-emerald-600" />
              <input 
                type="tel" 
                placeholder="WhatsApp Number" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm font-medium w-full sm:w-40"
              />
            </div>
            <button 
              onClick={handleLaunch}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Launch"}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowLaunchForm(false)}
              className="px-3 py-2 text-emerald-700 text-sm font-bold hover:underline"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
        active 
          ? 'border-indigo-600 text-indigo-600 font-bold' 
          : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
    </button>
  );
}

function ContentCard({ icon, title, bg, children }: { icon: React.ReactNode, title: string, bg: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 ${bg} rounded-lg`}>
          {icon}
        </div>
        <h4 className="font-bold text-slate-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}
