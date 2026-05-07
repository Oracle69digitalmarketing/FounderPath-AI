import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Mic, X } from 'lucide-react';

interface SkillInputProps {
  onSubmit: (input: string, files?: { mimeType: string, data: string }[]) => void;
  isAnalyzing: boolean;
  hasProfile: boolean;
}

export function SkillInput({ onSubmit, isAnalyzing, hasProfile }: SkillInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<{ name: string, mimeType: string, data: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (const file of Array.from(selectedFiles)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        setFiles(prev => [...prev, {
          name: file.name,
          mimeType: file.type,
          data: base64Data
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || files.length > 0) {
      onSubmit(input, files.map(({ mimeType, data }) => ({ mimeType, data })));
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-900">{hasProfile ? 'Update Your Skills' : 'Tell Us Your Story'}</h3>
      </div>
      <p className="text-sm text-slate-600 mb-2">
        Mention your training, jobs, or upload a voice note/certificate image.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea 
          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          placeholder="Example: I just finished a 3-month catering course. I have pots and a small stove..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnalyzing}
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100 group">
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button 
                  type="button"
                  onClick={() => removeFile(i)}
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,audio/*"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            <ImageIcon className="w-4 h-4" /> Add Certificate
          </button>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            <Mic className="w-4 h-4" /> Add Voice Note
          </button>
        </div>

        <button 
          id="analyze-skills-button"
          type="submit"
          disabled={isAnalyzing || (!input.trim() && files.length === 0)}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Audit...
            </>
          ) : (
            'Audit My Skills'
          )}
        </button>
      </form>
    </div>
  );
}
