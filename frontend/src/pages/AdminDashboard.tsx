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
  FileSpreadsheet,
  Cpu
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
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-card flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin HQ Header */}
      <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                AICTE National Headquarters
              </span>
              <span className="text-xs text-slate-500 font-mono">Role: AICTE_ADMIN</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-aicte-ink flex items-center gap-2.5 pt-1">
              <Sliders className="w-6 h-6 text-purple-700 shrink-0" />
              <span>National Regulatory Command Center</span>
            </h1>
            <p className="text-xs text-aicte-subtext">
              National statutory oversight of all regional offices, versioned policy tables, and hackathon evaluation sandbox controls.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-xs font-mono shrink-0 shadow-xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Guarantee Pledged</div>
            <div className="font-bold text-slate-900 text-base mt-0.5">₹{totalPrincipal.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* EXCLUSIVE DEMO CONTROLS PANEL */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 border border-purple-200 rounded-xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">SIH 2026 Evaluation Sandbox Controls</h2>
              <p className="text-xs text-slate-500">
                Administrative levers for live verification of time decay, tamper-evidence, and deterministic reset.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-white text-purple-800 border border-purple-200 shadow-xs self-start sm:self-auto">
            Day {clockState?.days_elapsed ?? 0} Simulated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Time Machine Advance */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-800 font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Clock Time Machine</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Fast-forward simulated portal time to trigger proof-score decay and regulatory deadlines.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => advanceClockMutation.mutate(7)}
                disabled={advanceClockMutation.isPending}
                className="flex-1 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition"
              >
                +7 Days
              </button>
              <button
                onClick={() => advanceClockMutation.mutate(30)}
                disabled={advanceClockMutation.isPending}
                className="flex-1 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition"
              >
                +30 Days
              </button>
              <button
                onClick={() => advanceClockMutation.mutate(90)}
                disabled={advanceClockMutation.isPending}
                className="flex-1 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold border border-blue-200 transition"
              >
                +90 Days
              </button>
            </div>
            <button
              onClick={() => resetClockMutation.mutate()}
              disabled={resetClockMutation.isPending}
              className="w-full py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-medium border border-slate-300 flex items-center justify-center space-x-1 transition text-[11px]"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Clock to Baseline</span>
            </button>
          </div>

          {/* Tamper Simulation */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-red-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Cryptographic Tamper Demo</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Directly mutate database Event #1. Proves that SHA-256 hash chaining detects unauthorized ledger edits.
            </p>
            <button
              data-testid="simulate-tamper-btn"
              onClick={() => simulateTamperMutation.mutate(1)}
              disabled={simulateTamperMutation.isPending}
              className="w-full py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-900 font-semibold border border-red-300 flex items-center justify-center space-x-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Simulate Malicious Tampering</span>
            </button>
            <div className="text-[10px] text-slate-500 text-center font-mono">
              Status: <span className={auditState?.valid ? 'text-emerald-700 font-semibold' : 'text-red-700 font-bold'}>{auditState?.valid ? 'Chain Intact' : 'TAMPER DETECTED!'}</span>
            </div>
          </div>

          {/* Full Demo Re-seed */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-teal-900 font-bold">
              <Database className="w-4 h-4 text-teal-700" />
              <span>Deterministic Reset</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Restore entire database, 10 personas, 6 FDRs, and mock adapters to Day 0 initial state.
            </p>
            <button
              data-testid="reset-database-btn"
              onClick={() => resetDemoMutation.mutate()}
              disabled={resetDemoMutation.isPending}
              className="w-full py-2 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold border border-teal-300 flex items-center justify-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
              <span>Reset Entire Demo Database</span>
            </button>
            <div className="text-[10px] text-slate-500 text-center font-mono">
              Deterministic seed: Day 0 (2026-04-01)
            </div>
          </div>
        </div>
      </div>

      {/* National Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Affiliated Colleges</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{institutions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Northern &amp; Western Regions</div>
        </div>

        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Active Security Deposits</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{fdrs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Living proof objects</div>
        </div>

        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Total Guaranteed Value</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">₹{(totalPrincipal / 100000).toFixed(1)}L</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Secured in Scheduled Banks</div>
        </div>

        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Hash Chain Integrity</div>
          <div className={`text-xl font-bold mt-1 font-mono ${auditState?.valid ? 'text-emerald-700' : 'text-red-700'}`}>
            {auditState?.valid ? '100% Valid' : 'Tampered'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{auditState?.total_events ?? 0} Chained Blocks</div>
        </div>
      </div>

      {/* Versioned Rules Registry */}
      <RulesRegistry rules={rules} />

      {/* Mock Adapters Status */}
      <AdaptersStatus adapters={demoStatus?.adapters || {}} />
    </div>
  );
};
