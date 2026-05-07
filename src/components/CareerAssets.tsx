import { useState } from 'react';
import { Upload, FileText, CheckCircle2, Briefcase, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CareerAssetsProps {
  hasSkills: boolean;
}

export function CareerAssets({ hasSkills }: CareerAssetsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<{ name: string; type: string; status: 'verified' | 'pending' }[]>([]);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload and verification
    setTimeout(() => {
      setFiles(prev => [...prev, { name: 'Resumes_2024.pdf', type: 'Resume', status: 'verified' }]);
      setIsUploading(false);
    }, 2000);
  };

  const jobMatches = [
    { title: 'Project Assistant (NGO)', company: 'Humanitarian Dev.', site: 'LinkedIn', match: '92%' },
    { title: 'Solar Technical Lead', company: 'SunPower Africa', site: 'Indeed', match: '88%' }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900">Career & Certification Hub</h3>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div 
          onClick={handleUpload}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-all text-center"
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Upload Resume / Certificate</p>
              <p className="text-xs text-slate-400">PDF, JPG (max 5MB)</p>
            </>
          )}
        </div>

        <AnimatePresence>
          {files.map((file, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{file.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{file.type}</p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </motion.div>
          ))}
        </AnimatePresence>

        {hasSkills && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Job Matches Based on SkillAudit</h4>
            <div className="flex flex-col gap-3">
              {jobMatches.map((job, i) => (
                <div key={i} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{job.title}</p>
                    <p className="text-[10px] text-slate-500">{job.company} • {job.site}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">{job.match}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
