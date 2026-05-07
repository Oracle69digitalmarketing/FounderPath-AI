import { motion } from 'motion/react';
import { Briefcase, GraduationCap, TrendingUp, ShieldCheck } from 'lucide-react';

interface LandingProps {
  onLogin: () => void;
}

export function Landing({ onLogin }: LandingProps) {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto flex flex-col gap-6">
        <motion.h1 
          className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          From Vocational Skill to <br/>
          <span className="text-indigo-600">Verifiable Venture</span>
        </motion.h1>
        <motion.p 
          className="text-xl text-slate-600 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          An Agentic Economic GPS for Africa's vocational graduates. We audit your skills, match you with a micro-venture blueprint, and provide the operational playbook to launch in 10 days.
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button 
            id="get-started-button"
            onClick={onLogin}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
          >
            Start Your Journey
          </button>
          <button 
            id="how-it-works-button"
            onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all"
          >
            How It Works
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features-section" className="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-mt-24">
        <FeatureCard 
          icon={<GraduationCap className="w-6 h-6 text-indigo-600" />}
          title="SkillThinker Audit"
          description="Formal and informal competency modeling including voice-stated experience and learning velocity."
        />
        <FeatureCard 
          icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
          title="AutoThinker Blueprints"
          description="Matching you against 50+ production-grade micro-venture architectures tailored for African markets."
        />
        <FeatureCard 
          icon={<Briefcase className="w-6 h-6 text-indigo-600" />}
          title="Actionable Launch"
          description="Complete business plan, GTM strategy, and social media assets. Launch for under $100."
        />
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-indigo-900 rounded-3xl p-12 text-white overflow-hidden relative">
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">10-Day</div>
            <div className="text-indigo-200 text-sm">Launch Timeline</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">{"<$100"}</div>
            <div className="text-indigo-200 text-sm">Startup Budget</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-indigo-200 text-sm">Venture Templates</div>
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-800 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl"></div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
