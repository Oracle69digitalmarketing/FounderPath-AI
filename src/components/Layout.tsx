import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { LogOut, LayoutDashboard, Rocket } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: FirebaseUser | null;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">FounderPath AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-900">{user.displayName}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                  <button 
                    id="logout-button"
                    onClick={onLogout}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-500 font-medium">Enterprise Economic GPS</div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 FounderPath AI. Built for DSN × BCT LLM Agent Challenge 3.0.
          </p>
        </div>
      </footer>
    </div>
  );
}
