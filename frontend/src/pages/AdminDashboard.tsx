import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Sliders, 
  Building2, 
  ShieldCheck, 
  FastForward, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database,
  Layers,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { RulesRegistry } from '../components/RulesRegistry';
import { AdaptersStatus } from '../components/AdaptersStatus';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const { data: clockState } = useQuery({
    queryKey: ['clock'],
    queryFn: () => apiClient.getClock(),
  });

  const { data: auditState, refetch: refetchAudit } = useQuery({
    queryKey: ['audit-verify'],
    queryFn: () => apiClient.verifyAudit(),
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions-admin'],
    queryFn: () => apiClient.getInstitutions(),
  });

  const { data: fdrs = [] } = useQuery({
    queryKey: ['fdrs-admin'],
    queryFn: () => apiClient.getFDRs(),
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['rules-admin'],
    queryFn: () => apiClient.getRules(),
  });

  const { data: demoStatus } = useQuery({
    queryKey: ['demo-status-admin'],
    queryFn: () => apiClient.getDemoStatus(),
  });

  // Demo Control Mutations
  const advanceClockMutation = useMutation({
    mutationFn: (days: number) => apiClient.advanceClock(days),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      showToast(`Clock advanced by ${data.advanced_by} days. Simulated Date: ${new Date(data.current_time_iso).toLocaleDateString('en-IN')}`);
    },
    onError: (err: any) => showToast(err.message),
  });

  const resetClockMutation = useMutation({
    mutationFn: () => apiClient.resetClock(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast('Simulated clock reset back to Day 0 baseline (2026-04-01).');
    },
    onError: (err: any) => showToast(err.message),
  });

  const resetDemoMutation = useMutation({
    mutationFn: () => apiClient.resetDemo(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast('Demo database completely re-seeded to Day 0 baseline!');
    },
    onError: (err: any) => showToast(err.message),
  });

  const simulateTamperMutation = useMutation({
    mutationFn: (eventId: number) => apiClient.simulateTamper(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-verify'] });
      showToast('Simulated malicious database tampering! Event #1 payload altered without re-calculating hashes.');
    },
    onError: (err: any) => showToast(err.message),
  });

  // Calculate National Aggregates
  const totalPrincipal = fdrs.reduce((sum, f) => sum + f.principal, 0);

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-teal-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin HQ Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                AICTE National Headquarters
              </span>
              <span className="text-xs text-slate-400 font-mono">Role: AICTE_ADMIN</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center space-x-2">
              <Sliders className="w-6 h-6 text-purple-400" />
              <span>National Regulatory Command Center</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              National oversight of all regional offices, statutory rule tables, and regulatory demo simulation controls.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Total Guarantee Pledged</div>
              <div className="font-bold text-teal-300 text-sm">₹{totalPrincipal.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* EXCLUSIVE DEMO CONTROLS PANEL */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-2 border-purple-700/80 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-purple-800/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-700">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Hackathon Judge Demo Controls</h2>
              <p className="text-xs text-purple-300/80">
                Exclusive to AICTE_ADMIN: Hidden from Maker, Checker, RO, and Bank Verifiers.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
            Day {clockState?.days_elapsed ?? 0} Simulated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Time Machine Advance */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Clock Time Machine</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Fast-forward simulated portal time to trigger proof-score decay and regulatory deadlines.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => advanceClockMutation.mutate(7)}
                disabled={advanceClockMutation.isPending}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700"
              >
                +7 Days
              </button>
              <button
                onClick={() => advanceClockMutation.mutate(30)}
                disabled={advanceClockMutation.isPending}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700"
              >
                +30 Days
              </button>
              <button
                onClick={() => advanceClockMutation.mutate(90)}
                disabled={advanceClockMutation.isPending}
                className="flex-1 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-blue-200 font-semibold border border-blue-700"
              >
                +90 Days
              </button>
            </div>
            <button
              onClick={() => resetClockMutation.mutate()}
              disabled={resetClockMutation.isPending}
              className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium border border-slate-800 flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Clock to Baseline</span>
            </button>
          </div>

          {/* Tamper Simulation */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-red-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Cryptographic Tamper Demo</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Mutate Event #1 in the database directly. Verifies that SHA-256 hash chaining detects unauthorized edits.
            </p>
            <button
              data-testid="simulate-tamper-btn"
              onClick={() => simulateTamperMutation.mutate(1)}
              disabled={simulateTamperMutation.isPending}
              className="w-full py-2 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 font-semibold border border-red-800 flex items-center justify-center space-x-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Malicious Tampering</span>
            </button>
            <div className="text-[10px] text-slate-500 text-center font-mono">
              Status: {auditState?.valid ? 'Chain Intact' : 'TAMPER DETECTED!'}
            </div>
          </div>

          {/* Full Demo Re-seed */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-teal-300 font-bold">
              <Database className="w-4 h-4 text-teal-400" />
              <span>Deterministic Reset</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Restore entire database, 10 personas, 6 FDRs, and mock adapters to Day 0 initial state.
            </p>
            <button
              data-testid="reset-database-btn"
              onClick={() => resetDemoMutation.mutate()}
              disabled={resetDemoMutation.isPending}
              className="w-full py-2 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-200 font-semibold border border-teal-800 flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Entire Demo Database</span>
            </button>
            <div className="text-[10px] text-slate-500 text-center font-mono">
              Deterministic seed: Day 0 (2026-04-01)
            </div>
          </div>
        </div>
      </div>

      {/* National Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-slate-400 text-xs font-medium">Affiliated Colleges</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{institutions.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Northern &amp; Western Regions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-slate-400 text-xs font-medium">Active Security Deposits</div>
          <div className="text-2xl font-bold text-teal-300 mt-1 font-mono">{fdrs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Living proof objects</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-slate-400 text-xs font-medium">Total Guaranteed Value</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">₹{(totalPrincipal / 100000).toFixed(1)}L</div>
          <div className="text-[11px] text-slate-400 mt-1">Secured in Scheduled Banks</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="text-slate-400 text-xs font-medium">Hash Chain Integrity</div>
          <div className={`text-2xl font-bold mt-1 font-mono ${auditState?.valid ? 'text-emerald-400' : 'text-red-400'}`}>
            {auditState?.valid ? '100% Valid' : 'Tampered'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{auditState?.total_events ?? 0} Chained Blocks</div>
        </div>
      </div>

      {/* Versioned Rules Registry */}
      <RulesRegistry rules={rules} />

      {/* Mock Adapters Status */}
      <AdaptersStatus adapters={demoStatus?.adapters || {}} />
    </div>
  );
};
