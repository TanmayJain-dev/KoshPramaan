import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  RotateCcw, 
  FastForward, 
  Calendar, 
  UserCheck, 
  Building2, 
  Award,
  AlertTriangle,
  CheckCircle2,
  Users,
  LogOut,
  Sliders,
  MapPin,
  Landmark,
  FileCheck2
} from 'lucide-react';
import { ClockState } from '../types';

interface HeaderProps {
  clockState: ClockState | null;
  onAdvanceClock: (days: number) => void;
  onResetClock: () => void;
  onResetDemo: () => void;
  auditValid: boolean;
  isClockLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  clockState,
  onAdvanceClock,
  onResetClock,
  onResetDemo,
  auditValid,
  isClockLoading,
}) => {
  const { user, role, roleDisplayName, setSwitchPersonaModalOpen, logout } = useAuth();

  const formattedDate = clockState 
    ? new Date(clockState.current_time_iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '2026-04-01';

  const getContextLabel = () => {
    if (user?.role === 'INSTITUTION_MAKER' || user?.role === 'INSTITUTION_CHECKER') {
      return (
        <span className="flex items-center space-x-1 text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>{user.institution_name || user.institution_id || 'Apex Institute'}</span>
        </span>
      );
    }
    if (user?.role === 'REGIONAL_OFFICER') {
      return (
        <span className="flex items-center space-x-1 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{user.region || 'Northern Region'}</span>
        </span>
      );
    }
    if (user?.role === 'BANK_VERIFIER') {
      return (
        <span className="flex items-center space-x-1 text-slate-300">
          <Landmark className="w-3.5 h-3.5 text-teal-400" />
          <span>{user.bank || 'State Bank of India'}</span>
        </span>
      );
    }
    if (user?.role === 'SCRUTINY_OFFICER') {
      return (
        <span className="flex items-center space-x-1 text-slate-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Central Vigilance Desk</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-slate-300">
        <Sliders className="w-3.5 h-3.5 text-purple-400" />
        <span>HQ Command (National)</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-200 via-white to-teal-300 bg-clip-text text-transparent">
                  KoshPramaan
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 font-devanagari font-semibold">
                  कोष-प्रमाण
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                AICTE Security Deposit &amp; FDR Portal
              </p>
            </div>
          </div>

          {/* Center: Clock Status (Controls only for AICTE_ADMIN) */}
          <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-inner">
            <div className="flex items-center space-x-2.5">
              <Calendar className="h-4 w-4 text-amber-400" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Simulated:</span>
                  <span className="text-xs font-bold text-slate-100 font-mono">{formattedDate}</span>
                </div>
                <div className="text-[10px] font-mono text-teal-400">
                  Day {clockState?.days_elapsed ?? 0} elapsed
                </div>
              </div>
            </div>

            {/* Time Machine Advance Controls (EXCLUSIVE TO AICTE_ADMIN) */}
            {role === 'AICTE_ADMIN' && (
              <div className="flex items-center space-x-1.5 ml-4 pl-3.5 border-l border-slate-800">
                <button
                  onClick={() => onAdvanceClock(7)}
                  disabled={isClockLoading}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Advance clock by 7 days"
                >
                  +7d
                </button>
                <button
                  onClick={() => onAdvanceClock(30)}
                  disabled={isClockLoading}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Advance clock by 30 days"
                >
                  +30d
                </button>
                <button
                  onClick={() => onAdvanceClock(90)}
                  disabled={isClockLoading}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 transition flex items-center space-x-1"
                  title="Advance clock by 90 days"
                >
                  <FastForward className="h-2.5 w-2.5" />
                  <span>+90d</span>
                </button>
                <button
                  onClick={onResetClock}
                  disabled={isClockLoading}
                  className="px-1.5 py-0.5 text-[11px] rounded-md bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700 transition"
                  title="Reset clock to Day 0"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: User Identity Pill & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Audit Chain Pill */}
            {(role === 'AICTE_ADMIN' || role === 'SCRUTINY_OFFICER' || role === 'REGIONAL_OFFICER') && (
              <div 
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  auditValid 
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' 
                    : 'bg-red-950/60 border-red-800/60 text-red-300'
                }`}
              >
                {auditValid ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-[11px]">Chain Valid</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <span className="text-[11px]">Tamper Detected</span>
                  </>
                )}
              </div>
            )}

            {/* User Profile & Context Badge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">{user?.name || 'Authorized User'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {user?.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {getContextLabel()}
              </div>
            </div>

            {/* Switch Role Button */}
            <button
              onClick={() => setSwitchPersonaModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-md shadow-teal-900/30"
              title="Switch demo persona"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Role</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800 transition"
              title="Logout / Return to Persona Select Screen"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
