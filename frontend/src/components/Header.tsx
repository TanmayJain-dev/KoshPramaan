import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  RotateCcw, 
  FastForward, 
  Calendar, 
  Building2, 
  AlertTriangle,
  CheckCircle2,
  Users,
  LogOut,
  Sliders,
  MapPin,
  Landmark,
  PhoneCall,
  Clock
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
  const { user, role, setSwitchPersonaModalOpen, logout } = useAuth();

  const formattedDate = clockState 
    ? new Date(clockState.current_time_iso).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Wed, 01 Apr 2026';

  const getContextLabel = () => {
    if (user?.role === 'INSTITUTION_MAKER' || user?.role === 'INSTITUTION_CHECKER') {
      return (
        <span className="flex items-center space-x-1 text-aicte-subtext">
          <Building2 className="w-3.5 h-3.5 text-aicte-blue" />
          <span className="truncate max-w-[200px]">{user.institution_name || user.institution_id || 'Apex Institute of Technology'}</span>
        </span>
      );
    }
    if (user?.role === 'REGIONAL_OFFICER') {
      return (
        <span className="flex items-center space-x-1 text-aicte-subtext">
          <MapPin className="w-3.5 h-3.5 text-aicte-green" />
          <span>{user.region || 'Northern Region'} Jurisdiction</span>
        </span>
      );
    }
    if (user?.role === 'BANK_VERIFIER') {
      return (
        <span className="flex items-center space-x-1 text-aicte-subtext">
          <Landmark className="w-3.5 h-3.5 text-aicte-blue" />
          <span>{user.bank || 'State Bank of India'} (CBS Desk)</span>
        </span>
      );
    }
    if (user?.role === 'SCRUTINY_OFFICER') {
      return (
        <span className="flex items-center space-x-1 text-aicte-subtext">
          <AlertTriangle className="w-3.5 h-3.5 text-aicte-gold" />
          <span>Central Vigilance Cell (National)</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-aicte-subtext">
        <Sliders className="w-3.5 h-3.5 text-aicte-blue" />
        <span>National Headquarters • AICTE HQ Command</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-aicte-border shadow-subtle">
      {/* Top Official Utility Strip (Indian Government Portal Standard) */}
      <div className="bg-aicte-navy text-slate-300 text-[11px] px-4 sm:px-6 lg:px-8 py-1.5 border-b border-aicte-navyLight">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-white tracking-wide uppercase text-[10px]">
              Government of India • Ministry of Education
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:flex items-center space-x-1 text-slate-300">
              <PhoneCall className="w-3 h-3 text-amber-400" />
              <span>National Support Desk: 1800-258-1800 (Toll Free)</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Simulated Time:</span>
              <strong className="text-white font-mono">{formattedDate}</strong>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-300 border border-slate-700 font-mono">
                Day {clockState?.days_elapsed ?? 0}
              </span>
            </div>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">IST (UTC+05:30)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation & Institutional Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-lg bg-aicte-muted border border-aicte-border flex items-center justify-center shadow-subtle">
              <ShieldCheck className="h-7 w-7 text-aicte-blue" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-aicte-navy">
                  KoshPramaan
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-aicte-blue font-devanagari font-bold">
                  कोष-प्रमाण
                </span>
              </div>
              <p className="text-xs text-aicte-subtext font-medium">
                AICTE Security Deposit &amp; Living FDR Verification Portal
              </p>
            </div>
          </div>

          {/* Center: Admin Simulation Controls & Audit Telemetry */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Audit Chain Pill (Government Compliance Badge) */}
            {(role === 'AICTE_ADMIN' || role === 'SCRUTINY_OFFICER' || role === 'REGIONAL_OFFICER') && (
              <div 
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  auditValid 
                    ? 'bg-aicte-greenSurface border-aicte-greenBorder text-aicte-green' 
                    : 'bg-aicte-redSurface border-aicte-redBorder text-aicte-red animate-pulse'
                }`}
                title={auditValid ? 'Cryptographic SHA-256 hash chaining intact' : 'Cryptographic hash mismatch detected'}
              >
                {auditValid ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-aicte-green" />
                    <span>Cryptographic Ledger Valid</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-aicte-red" />
                    <span>Audit Chain Tampered</span>
                  </>
                )}
              </div>
            )}

            {/* Time Machine Advance Controls (EXCLUSIVE TO AICTE_ADMIN) */}
            {role === 'AICTE_ADMIN' && (
              <div className="flex items-center space-x-1 bg-aicte-muted p-1 rounded-lg border border-aicte-border">
                <span className="text-[11px] font-semibold text-aicte-subtext px-2">Time Machine:</span>
                <button
                  onClick={() => onAdvanceClock(7)}
                  disabled={isClockLoading}
                  className="px-2 py-1 text-xs font-medium rounded bg-white hover:bg-slate-50 text-aicte-ink border border-aicte-border shadow-subtle transition"
                  title="Advance clock by 7 days"
                >
                  +7d
                </button>
                <button
                  onClick={() => onAdvanceClock(30)}
                  disabled={isClockLoading}
                  className="px-2 py-1 text-xs font-medium rounded bg-white hover:bg-slate-50 text-aicte-ink border border-aicte-border shadow-subtle transition"
                  title="Advance clock by 30 days"
                >
                  +30d
                </button>
                <button
                  onClick={() => onAdvanceClock(90)}
                  disabled={isClockLoading}
                  className="px-2 py-1 text-xs font-medium rounded bg-aicte-blue hover:bg-aicte-blueHover text-white shadow-subtle transition flex items-center space-x-1"
                  title="Advance clock by 90 days"
                >
                  <FastForward className="h-3 w-3" />
                  <span>+90d</span>
                </button>
                <button
                  onClick={onResetClock}
                  disabled={isClockLoading}
                  className="px-2 py-1 text-xs rounded bg-white hover:bg-red-50 text-slate-500 hover:text-red-700 border border-aicte-border shadow-subtle transition"
                  title="Reset clock to Day 0"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right: User Context & Actions */}
          <div className="flex items-center space-x-3">
            {/* User Profile Card */}
            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end space-x-2">
                <span className="font-bold text-sm text-aicte-ink" data-testid="header-user-name">
                  {user?.name || 'Authorized Official'}
                </span>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-blue-50 text-aicte-blue border border-blue-200" 
                  data-testid="header-user-role"
                >
                  {user?.role}
                </span>
              </div>
              <div className="text-xs text-aicte-subtext mt-0.5 flex justify-end">
                {getContextLabel()}
              </div>
            </div>

            {/* Switch Role Button */}
            <button
              onClick={() => setSwitchPersonaModalOpen(true)}
              data-testid="switch-role-btn"
              className="px-3.5 py-2 rounded-lg bg-aicte-blue hover:bg-aicte-blueHover text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-subtle"
              title="Switch demo persona"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Switch Role</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-aicte-muted hover:bg-red-50 text-aicte-subtext hover:text-red-700 border border-aicte-border transition"
              title="Logout / Return to Persona Select Screen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
