import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  UserCheck, 
  ShieldAlert, 
  Landmark, 
  Sliders, 
  MapPin, 
  CheckCircle2,
  FileCheck2,
  ShieldCheck
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

  const getScopeBadge = (u: DemoUser) => {
    if (u.role === 'INSTITUTION_MAKER' || u.role === 'INSTITUTION_CHECKER') {
      return (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
          Scope: {u.institution_name || u.institution_id}
        </span>
      );
    }
    if (u.role === 'REGIONAL_OFFICER') {
      return (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
          Scope: {u.region}
        </span>
      );
    }
    if (u.role === 'BANK_VERIFIER') {
      return (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
          Scope: {u.bank}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
        Scope: National HQ (All Regions)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white border border-aicte-border rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-aicte-navy border border-slate-300">
                SIH 2026 Live Evaluation Sandbox
              </span>
              <span className="text-xs font-medium text-slate-500">Strict RBAC &amp; Statutory Data Isolation</span>
            </div>
            <h2 className="text-lg font-bold text-aicte-ink mt-1">Switch Official Persona</h2>
            <p className="text-xs text-aicte-subtext mt-0.5">
              Select an authorized institutional or administrative actor to inspect their segregated queue, boundary checks, and audit trails.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Personas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
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
                className={`text-left p-4 rounded-lg border transition flex flex-col justify-between space-y-3 relative ${
                  isCurrent
                    ? 'bg-blue-50/60 border-aicte-blue ring-1 ring-aicte-blue shadow-xs'
                    : 'bg-white border-slate-200 hover:border-aicte-blue/60 hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 flex items-center space-x-1 text-[11px] font-bold text-aicte-blue bg-white border border-aicte-blue/40 px-2 py-0.5 rounded-full shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-aicte-blue" />
                    <span>Active Session</span>
                  </span>
                )}

                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200 shrink-0">
                    {getRoleIcon(u.role)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-aicte-ink">
                      {u.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">{u.persona_title}</p>
                    <div className="mt-1.5">{getScopeBadge(u)}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                  {u.persona_description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cryptographically sealed JWTs issued per persona via FastAPI backend.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition text-xs shadow-xs"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};
