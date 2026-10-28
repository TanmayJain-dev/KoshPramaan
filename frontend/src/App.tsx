import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { apiClient } from './api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { MakerDashboard } from './pages/MakerDashboard';
import { CheckerDashboard } from './pages/CheckerDashboard';
import { RegionalOfficerDashboard } from './pages/RegionalOfficerDashboard';
import { ScrutinyDashboard } from './pages/ScrutinyDashboard';
import { BankVerifierDashboard } from './pages/BankVerifierDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const App: React.FC = () => {
  const { user, role, isLoading: isAuthLoading, switchPersonaModalOpen, setSwitchPersonaModalOpen } = useAuth();
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Global Clock Query
  const { data: clockState, isLoading: isClockLoading } = useQuery({
    queryKey: ['clock'],
    queryFn: () => apiClient.getClock(),
  });

  // Global Audit Query
  const { data: auditState } = useQuery({
    queryKey: ['audit-verify'],
    queryFn: () => apiClient.verifyAudit(),
  });

  // Clock Advance Mutation (Admin only)
  const advanceClockMutation = useMutation({
    mutationFn: (days: number) => apiClient.advanceClock(days),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      showToast(`Clock advanced by ${data.advanced_by} days. Current simulated date: ${new Date(data.current_time_iso).toLocaleDateString('en-IN')}`, 'success');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  // Clock Reset Mutation
  const resetClockMutation = useMutation({
    mutationFn: () => apiClient.resetClock(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast('Simulated clock reset back to Day 0 baseline (2026-04-01).', 'info');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  // Demo Reset Mutation
  const resetDemoMutation = useMutation({
    mutationFn: () => apiClient.resetDemo(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast('Demo data completely re-seeded to deterministic Day 0 baseline.', 'success');
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading KoshPramaan Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={() => queryClient.invalidateQueries()} />;
  }

  // Render role-specific workspace
  const renderDashboard = () => {
    switch (role) {
      case 'INSTITUTION_MAKER':
        return <MakerDashboard />;
      case 'INSTITUTION_CHECKER':
        return <CheckerDashboard />;
      case 'REGIONAL_OFFICER':
        return <RegionalOfficerDashboard />;
      case 'SCRUTINY_OFFICER':
        return <ScrutinyDashboard />;
      case 'BANK_VERIFIER':
        return <BankVerifierDashboard />;
      case 'AICTE_ADMIN':
        return <AdminDashboard />;
      default:
        return <MakerDashboard />;
    }
  };

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

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>

      {/* Role Switcher Modal (1-Click Switcher for Judges) */}
      <RoleSwitcherModal
        isOpen={switchPersonaModalOpen}
        onClose={() => setSwitchPersonaModalOpen(false)}
      />

      {/* Footer with Honesty Badge */}
      <Footer />

    </div>
  );
};
