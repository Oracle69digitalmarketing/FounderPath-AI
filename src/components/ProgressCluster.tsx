import { motion } from 'motion/react';

interface ProgressClusterProps {
  skillReadiness: number;
  ventureReadiness: number;
}

export function ProgressCluster({ skillReadiness, ventureReadiness }: ProgressClusterProps) {
  return (
    <div className="flex gap-4 sm:gap-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <ProgressBar label="Skill Readiness" value={skillReadiness} color="bg-indigo-600" />
      <div className="w-[1px] bg-slate-200 self-stretch"></div>
      <ProgressBar label="Venture Readiness" value={ventureReadiness} color="bg-emerald-500" />
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex flex-col gap-2 min-w-[120px] sm:min-w-[160px]">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
