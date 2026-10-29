import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  UserCheck, 
  Building2, 
  ShieldAlert, 
  Landmark, 
  Sliders, 
  MapPin, 
  CheckCircle2,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { DemoUser } from '../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { user, demoUsers, loginAsUsername } = useAuth();

  if (!isOpen) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'INSTITUTION_MAKER':
        return <FileCheck2 className="w-5 h-5 text-sky-400" />;
      case 'INSTITUTION_CHECKER':
        return <UserCheck className="w-5 h-5 text-indigo-400" />;
      case 'REGIONAL_OFFICER':
        return <MapPin className="w-5 h-5 text-emerald-400" />;
      case 'SCRUTINY_OFFICER':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'BANK_VERIFIER':
        return <Landmark className="w-5 h-5 text-teal-400" />;
      case 'AICTE_ADMIN':
        return <Sliders className="w-5 h-5 text-purple-400" />;
      default:
        return <UserCheck className="w-5 h-5 text-slate-400" />;
    }
  };

  const getScopeBadge = (u: DemoUser) => {
    if (u.role === 'INSTITUTION_MAKER' || u.role === 'INSTITUTION_CHECKER') {
      return (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
          Scope: {u.institution_name || u.institution_id}
        </span>
      );
    }
    if (u.role === 'REGIONAL_OFFICER') {
      return (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
          Scope: {u.region}
        </span>
      );
    }
    if (u.role === 'BANK_VERIFIER') {
      return (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800">
          Scope: {u.bank}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
        Scope: National HQ (All Regions)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                Hackathon Judge Simulation
              </span>
              <span className="text-xs text-slate-400">Strict RBAC &amp; Data Isolation</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Switch Demo Persona</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any role to experience the distinct permission boundary, isolated queue, and security controls.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Personas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {demoUsers.map((u) => {
            const isCurrent = user?.username === u.username;
            return (
              <button
                key={u.username}
                data-testid={`persona-btn-${u.username}`}
                onClick={async () => {
                  await loginAsUsername(u.username);
                  onClose();
                }}
                className={`text-left p-4 rounded-xl border transition flex flex-col justify-between space-y-3 relative ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/50 shadow-lg shadow-blue-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 flex items-center space-x-1 text-[11px] font-bold text-blue-400 bg-blue-950/90 border border-blue-800 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                )}

                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getRoleIcon(u.role)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>{u.name}</span>
                    </h3>
                    <p className="text-xs font-medium text-slate-300 mt-0.5">{u.persona_title}</p>
                    <div className="mt-1.5">{getScopeBadge(u)}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                  {u.persona_description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero hardcoded roles: Real JWT authentication issued via FastAPI backend.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
