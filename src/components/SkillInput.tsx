import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface SkillInputProps {
  onSubmit: (input: string) => void;
  isAnalyzing: boolean;
  hasProfile: boolean;
}

export function SkillInput({ onSubmit, isAnalyzing, hasProfile }: SkillInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-900">{hasProfile ? 'Update Your Skills' : 'Tell Us Your Story'}</h3>
      </div>
      <p className="text-sm text-slate-600 mb-2">
        Mention your training, jobs you've done, certificates you hold, and what you're passionate about.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea 
          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          placeholder="Example: I just finished a 3-month catering course. I have pots and a small stove. I'm good at baking but I don't know how to sell online."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnalyzing}
        />
        <button 
          id="analyze-skills-button"
          type="submit"
          disabled={isAnalyzing || !input.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            'Audit My Skills'
          )}
        </button>
      </form>
    </div>
  );
}
