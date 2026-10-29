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
  Sparkles,
  Phone,
  Mail,
  Building2
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
        return <FileCheck2 className="w-5 h-5 text-aicte-blue" />;
      case 'INSTITUTION_CHECKER':
        return <UserCheck className="w-5 h-5 text-indigo-700" />;
      case 'REGIONAL_OFFICER':
        return <MapPin className="w-5 h-5 text-emerald-700" />;
      case 'SCRUTINY_OFFICER':
        return <ShieldAlert className="w-5 h-5 text-amber-700" />;
      case 'BANK_VERIFIER':
        return <Landmark className="w-5 h-5 text-teal-700" />;
      case 'AICTE_ADMIN':
        return <Sliders className="w-5 h-5 text-purple-700" />;
      default:
        return <UserCheck className="w-5 h-5 text-slate-700" />;
    }
  };

  const getScopeBadge = (role: string) => {
    switch (role) {
      case 'INSTITUTION_MAKER':
      case 'INSTITUTION_CHECKER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">Apex Institute (INST-001)</span>;
      case 'REGIONAL_OFFICER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Northern Region Jurisdiction</span>;
      case 'BANK_VERIFIER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">State Bank of India CBS</span>;
      case 'SCRUTINY_OFFICER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">National Vigilance Cell</span>;
      case 'AICTE_ADMIN':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">National HQ Command</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-aicte-bg text-aicte-ink flex flex-col justify-between selection:bg-blue-100 selection:text-aicte-navy">
      
      {/* Top Govt Utility Strip */}
      <div className="bg-aicte-navy text-white text-[11px] py-1.5 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="font-semibold tracking-wide">भारत सरकार • Government of India</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">शिक्षा मंत्रालय • Ministry of Education</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300 font-mono text-[10px]">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-aicte-gold" />
              Toll-Free Support: 1800-258-1800
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:flex items-center gap-1">
              <Mail className="w-3 h-3 text-aicte-gold" />
              support@aicte-koshpramaan.gov.in
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Masthead Banner */}
        <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4 text-center md:text-left">
            <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <div className="relative">
                <ShieldCheck className="h-10 w-10 text-aicte-navy" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-aicte-gold rounded-full border-2 border-white"></div>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                अखिल भारतीय तकनीकी शिक्षा परिषद • All India Council for Technical Education
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-aicte-navy tracking-tight mt-0.5">
                KoshPramaan <span className="text-aicte-blue font-semibold">(कोष-प्रमाण)</span>
              </h1>
              <p className="text-xs text-aicte-subtext mt-1 max-w-xl">
                National Statutory Security Deposit &amp; Living Fixed Deposit Receipt (FDR) Verification Portal
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Hackathon Prototype</span>
            <span className="text-aicte-navy font-bold">SIH 2026 Evaluation Sandbox</span>
          </div>
        </div>

        {/* Hackathon Sandbox Instructions */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 shadow-subtle">
          <Sparkles className="w-5 h-5 text-aicte-blue shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <div className="font-bold text-aicte-navy">
              Single-Click Persona Access (No Password Required for Evaluation)
            </div>
            <p className="leading-relaxed">
              Select an authorized actor below to enter their isolated workspace. Every role experiences strict data segregation, automated cryptographic verification, and state-machine governance. Real JWT session tokens are issued via the FastAPI backend.
            </p>
            <div className="text-[11px] font-mono text-amber-800 pt-1 font-semibold">
              Demo authentication (no real credentials)
            </div>
          </div>
        </div>

        {/* 6 Demo Personas Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoUsers.slice(0, 6).map((u) => (
            <button
              key={u.username}
              data-testid={`login-persona-${u.username}`}
              onClick={() => handleSelectPersona(u.username)}
              disabled={isLoading}
              className="bg-white border border-aicte-border hover:border-aicte-blue p-5 rounded-xl text-left transition flex flex-col justify-between space-y-4 hover:shadow-card group shadow-subtle"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 group-hover:bg-blue-50 transition">
                    {getPersonaIcon(u.role)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {u.role}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-aicte-ink group-hover:text-aicte-blue transition">
                    {u.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{u.persona_title}</p>
                  <div className="mt-2">{getScopeBadge(u.role)}</div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                  {u.persona_description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold text-aicte-blue group-hover:text-aicte-navy">
                <span>Enter Official Workspace</span>
                <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* Permanent Government Footer */}
      <div className="mt-8 w-full">
        <Footer />
      </div>

    </div>
  );
};
