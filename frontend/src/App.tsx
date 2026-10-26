import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRole } from './context/RoleContext';
import { apiClient } from './api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuditChainStatus } from './components/AuditChainStatus';
import { InstitutionsRegistry } from './components/InstitutionsRegistry';
import { RulesRegistry } from './components/RulesRegistry';
import { AdaptersStatus } from './components/AdaptersStatus';
import { 
  ShieldCheck, 
  Layers, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Database
} from 'lucide-react';

export const App: React.FC = () => {
  const { role, institutionId, roleDisplayName } = useRole();
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Queries
  const { data: clockState, isLoading: isClockLoading } = useQuery({
    queryKey: ['clock', role],
    queryFn: () => apiClient.getClock(role),
  });

  const { data: auditState, isLoading: isAuditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit-verify', role],
    queryFn: () => apiClient.verifyAudit(role),
  });

  const { data: auditEvents = [] } = useQuery({
    queryKey: ['audit-events', role],
    queryFn: () => apiClient.getEvents(20, role),
  });

  const { data: institutions = [], isLoading: isInstLoading } = useQuery({
    queryKey: ['institutions', role, institutionId],
    queryFn: () => apiClient.getInstitutions(role, institutionId),
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['rules', role],
    queryFn: () => apiClient.getRules(role),
  });

  const { data: demoStatus } = useQuery({
    queryKey: ['demo-status', role],
    queryFn: () => apiClient.getDemoStatus(role),
  });

  // Mutations
  const advanceClockMutation = useMutation({
    mutationFn: (days: number) => apiClient.advanceClock(days, role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clock'] });
      queryClient.invalidateQueries({ queryKey: ['audit-verify'] });
      queryClient.invalidateQueries({ queryKey: ['audit-events'] });
      showToast(`Clock advanced by ${data.advanced_by} days. Current simulated date: ${new Date(data.current_time_iso).toLocaleDateString('en-IN')}`, 'success');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  const resetClockMutation = useMutation({
    mutationFn: () => apiClient.resetClock(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock'] });
      queryClient.invalidateQueries({ queryKey: ['audit-verify'] });
      queryClient.invalidateQueries({ queryKey: ['audit-events'] });
      showToast('Simulated clock reset back to Day 0 baseline (2026-04-01).', 'info');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  const simulateTamperMutation = useMutation({
    mutationFn: (eventId: number) => apiClient.simulateTamper(eventId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-verify'] });
      queryClient.invalidateQueries({ queryKey: ['audit-events'] });
      showToast('Simulated malicious tamper in database! Cryptographic hash chain broken at Event #1.', 'error');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  const resetDemoMutation = useMutation({
    mutationFn: () => apiClient.resetDemo(role),
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast('Demo data completely re-seeded to deterministic baseline.', 'success');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Persistent Navigation & Header */}
      <Header
        clockState={clockState || null}
        onAdvanceClock={(days) => advanceClockMutation.mutate(days)}
        onResetClock={() => resetClockMutation.mutate()}
        onResetDemo={() => resetDemoMutation.mutate()}
        auditValid={auditState?.valid ?? true}
        isClockLoading={isClockLoading || advanceClockMutation.isPending}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center space-x-3 text-sm font-medium ${
            notification.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-700 text-emerald-200' 
              : notification.type === 'error'
              ? 'bg-red-950/95 border-red-700 text-red-200'
              : 'bg-slate-900/95 border-slate-700 text-slate-200'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />}
            {notification.type === 'info' && <Clock className="h-5 w-5 text-blue-400 flex-shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Phase 1 Foundations Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-slate-800 p-6 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-900/70 text-teal-300 border border-teal-700">
                  Phase 1: Foundations
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Active Role: <strong className="text-slate-200">{roleDisplayName}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                Living Proof Object Architecture
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                A scanned FDR is a claim, not a proof. KoshPramaan models every security deposit as a living object verified across the three-phase loop: <span className="text-teal-400 font-bold">PROVE</span> → <span className="text-blue-400 font-bold">WATCH</span> → <span className="text-amber-400 font-bold">ACT</span>.
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono text-xs">
              <Database className="h-4 w-4 text-teal-400" />
              <div>
                <div className="text-slate-400">Seeded Records</div>
                <div className="font-bold text-slate-200">
                  {institutions.length} Institutions • 5 FDRs • 3 Verifiers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Tamper-Evident SHA-256 Hash Chain Component */}
        <AuditChainStatus
          auditState={auditState || null}
          events={auditEvents}
          onVerify={() => {
            refetchAudit();
            showToast('Audit chain verification completed successfully.', 'success');
          }}
          onSimulateTamper={(id) => simulateTamperMutation.mutate(id)}
          onRestore={() => resetDemoMutation.mutate()}
          isLoading={isAuditLoading}
        />

        {/* 2. Institutions & Living FDRs Explorer */}
        <InstitutionsRegistry
          institutions={institutions}
          role={role}
        />

        {/* 3. Versioned Rules Table */}
        <RulesRegistry
          rules={rules}
        />

        {/* 4. Mock Adapters Health */}
        <AdaptersStatus
          adapters={demoStatus?.adapters || {}}
        />

      </main>

      {/* Footer with Honesty Badge */}
      <Footer />

    </div>
  );
};
