import React from 'react';
import { useRole } from '../context/RoleContext';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  RotateCcw, 
  FastForward, 
  Calendar, 
  UserCheck, 
  Building2, 
  Award,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  clockState: { current_time_iso: string; days_elapsed: number } | null;
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
  const { role, setRole, roleDisplayName } = useRole();

  const formattedDate = clockState 
    ? new Date(clockState.current_time_iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Loading...';

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
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
                AICTE Security Deposit &amp; FDR Verification System
              </p>
            </div>
          </div>

          {/* Center: Persistent Simulated Clock Widget */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-inner">
            <div className="flex items-center space-x-2.5 mr-4 pr-3.5 border-r border-slate-800">
              <Calendar className="h-4 w-4 text-amber-400" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Simulated:</span>
                  <span className="text-sm font-bold text-slate-100 font-mono">{formattedDate}</span>
                </div>
                <div className="text-[10px] font-mono text-teal-400">
                  Day {clockState?.days_elapsed ?? 0} elapsed
                </div>
              </div>
            </div>

            {/* Time Machine Advance Controls */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => onAdvanceClock(7)}
                disabled={isClockLoading}
                className="px-2 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center space-x-1"
                title="Advance clock by 7 days"
              >
                <span>+7d</span>
              </button>
              <button
                onClick={() => onAdvanceClock(30)}
                disabled={isClockLoading}
                className="px-2 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center space-x-1"
                title="Advance clock by 30 days"
              >
                <span>+30d</span>
              </button>
              <button
                onClick={() => onAdvanceClock(90)}
                disabled={isClockLoading}
                className="px-2 py-1 text-xs font-medium rounded-md bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 transition flex items-center space-x-1"
                title="Advance clock by 90 days (T-90 trigger)"
              >
                <FastForward className="h-3 w-3" />
                <span>+90d</span>
              </button>
              <button
                onClick={onResetClock}
                disabled={isClockLoading}
                className="px-2 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-800/50 transition ml-1"
                title="Reset Clock to Day 0 (2026-04-01)"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Right: Role Switcher & Reset Demo */}
          <div className="flex items-center space-x-3">
            {/* Audit chain indicator pill */}
            <div 
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                auditValid 
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' 
                  : 'bg-red-950/60 border-red-800/60 text-red-300'
              }`}
            >
              {auditValid ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Chain Valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  <span>Tamper Detected</span>
                </>
              )}
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-100 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer shadow-sm hover:border-slate-600 transition"
              >
                <option value="SCRUTINY_OFFICER">Scrutiny Officer (Maker)</option>
                <option value="ASSISTANT_DIRECTOR">Assistant Director (Checker)</option>
                <option value="REGIONAL_OFFICER">Regional Officer (RO)</option>
                <option value="INSTITUTION">Institution (College)</option>
              </select>
              <UserCheck className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Demo Reset Button */}
            <button
              onClick={onResetDemo}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-800/80 transition flex items-center space-x-1 shadow-sm"
              title="Reset all demo data and clock to initial deterministic baseline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
