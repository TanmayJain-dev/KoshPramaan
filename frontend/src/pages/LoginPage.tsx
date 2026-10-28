import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/Footer';
import { 
  ShieldCheck, 
  FileCheck2, 
  UserCheck, 
  MapPin, 
  ShieldAlert, 
  Landmark, 
  Sliders, 
  ArrowRight,
  Database,
  Lock,
  Sparkles
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { demoUsers, loginAsUsername, isLoading } = useAuth();

  const handleSelectPersona = async (username: string) => {
    await loginAsUsername(username);
    onSuccess();
  };

  const getPersonaIcon = (role: string) => {
    switch (role) {
      case 'INSTITUTION_MAKER':
        return <FileCheck2 className="w-6 h-6 text-sky-400" />;
      case 'INSTITUTION_CHECKER':
        return <UserCheck className="w-6 h-6 text-indigo-400" />;
      case 'REGIONAL_OFFICER':
        return <MapPin className="w-6 h-6 text-emerald-400" />;
      case 'SCRUTINY_OFFICER':
        return <ShieldAlert className="w-6 h-6 text-amber-400" />;
      case 'BANK_VERIFIER':
        return <Landmark className="w-6 h-6 text-teal-400" />;
      case 'AICTE_ADMIN':
        return <Sliders className="w-6 h-6 text-purple-400" />;
      default:
        return <UserCheck className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        
        {/* Header Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 p-0.5 shadow-xl shadow-blue-500/20 items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-teal-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-200 via-white to-teal-300 bg-clip-text text-transparent">
              KoshPramaan (कोष-प्रमाण)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
              AICTE Security Deposit &amp; Living FDR Verification Portal • Smart India Hackathon 2026
            </p>
          </div>
        </div>

        {/* Hackathon Demo Instruction Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-teal-300">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Select a Demo Persona to Experience Isolated Role-Based Workflows</span>
          </div>
          <p className="text-xs text-slate-400">
            Each role accesses distinct data isolation scopes, workflow state-machine steps, and permissions.
          </p>
          <div className="text-[11px] font-mono text-amber-300/90 pt-1">
            Demo authentication (no real credentials)
          </div>
        </div>

        {/* 6 Demo Personas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoUsers.slice(0, 6).map((u) => (
            <button
              key={u.username}
              onClick={() => handleSelectPersona(u.username)}
              disabled={isLoading}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 p-5 rounded-2xl text-left transition flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-blue-950/30 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    {getPersonaIcon(u.role)}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {u.role}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition">
                    {u.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">{u.persona_title}</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {u.persona_description}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:text-teal-300">
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* Permanent Footer with Honesty Badge */}
      <div className="mt-12 w-full">
        <Footer />
      </div>
    </div>
  );
};
