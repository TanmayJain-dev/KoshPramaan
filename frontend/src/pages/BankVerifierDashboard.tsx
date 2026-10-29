import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { FDR } from '../types';
import { 
  Landmark, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Building2, 
  Clock, 
  Award, 
  X,
  FileCheck2,
  Database,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

export const BankVerifierDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFdr, setSelectedFdr] = useState<FDR | null>(null);
  const [mismatchValue, setMismatchValue] = useState<string>('50000');
  const [verifierNotes, setVerifierNotes] = useState<string>('');
  const [isMismatchModalOpen, setIsMismatchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries (scoped to bank by backend)
  const { data: fdrs = [], isLoading } = useQuery({
    queryKey: ['fdrs', user?.role, user?.bank],
    queryFn: () => apiClient.getFDRs(),
  });

  // Bank Attestation Mutation
  const verifyMutation = useMutation({
    mutationFn: ({ fdrId, action, bankVal, notes }: { fdrId: string; action: 'confirm' | 'flag_mismatch'; bankVal?: string; notes?: string }) =>
      apiClient.bankVerifyFDR(fdrId, action, bankVal, notes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      setSelectedFdr(null);
      setIsMismatchModalOpen(false);
      setVerifierNotes('');
      if (variables.action === 'confirm') {
        showToast(`FDR ${data.id} confirmed against ${user?.bank} CBS ledger! Trust level upgraded.`);
      } else {
        showToast(`DISCREPANCY FLAGGED on FDR ${data.id}! Deposit locked in regulatory ledger.`);
      }
    },
    onError: (err: any) => showToast(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-card flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bank Scope Header */}
      <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Authorized Scheduled Commercial Bank
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Scope: <strong className="text-slate-700">{user?.bank || 'State Bank of India'}</strong>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-aicte-ink flex items-center gap-2.5 pt-1">
              <Landmark className="w-6 h-6 text-teal-700 shrink-0" />
              <span>{user?.bank || 'State Bank of India'} — CBS Attestation Desk</span>
            </h1>
            <p className="text-xs text-aicte-subtext">
              Direct Core Banking System (CBS) reconciliation gateway. Attest pledged security deposits against live branch ledger balances.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Reliability Score</div>
              <div className="font-bold text-emerald-700 flex items-center gap-1 text-sm mt-0.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> 98.4% (Tier-1)
              </div>
            </div>
            <div className="bg-teal-50 px-3.5 py-2.5 rounded-lg border border-teal-200 shadow-xs">
              <div className="text-teal-800 text-[10px] uppercase font-bold tracking-wider">Assigned Deposits</div>
              <div className="font-bold text-teal-900 text-sm mt-0.5">{fdrs.length} Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* CBS Reconciliation Queue */}
      <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-aicte-ink">CBS Reconciliation Queue</h2>
            <p className="text-xs text-aicte-subtext">Deposits held with {user?.bank} requiring bank attestation</p>
          </div>
          <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-300">
            Real-time mock adapter: BankAPI v2.4
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {fdrs.map((fdr) => {
            const isConfirmed = fdr.field_claims?.some((c) => c.field === 'principal' && c.trust_level === 'bank_confirmed');
            const isLocked = fdr.status === 'discrepancy_locked';

            return (
              <div
                key={fdr.id}
                data-testid={`fdr-row-${fdr.id}`}
                className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-aicte-ink">{fdr.receipt_no}</span>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {fdr.id}
                    </span>
                    {isConfirmed && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CBS Confirmed
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-300 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-red-600" /> Discrepancy Locked
                      </span>
                    )}
                    {fdr.status === 'closed_early' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Closed Early
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">
                    College: <strong className="text-slate-900">{fdr.institution_id}</strong> • Branch: {fdr.branch} (IFSC: <span className="font-mono text-slate-600">{fdr.ifsc}</span>)
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Claimed Principal: <strong className="text-slate-900 font-mono">₹{fdr.principal.toLocaleString('en-IN')}</strong> • Tripartite Lien: {fdr.lien_clause_ok ? <span className="text-emerald-700 font-semibold">Joint Favor Present</span> : <span className="text-red-700 font-semibold">Not marked</span>}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    data-testid={`cbs-confirm-btn-${fdr.id}`}
                    onClick={() =>
                      verifyMutation.mutate({
                        fdrId: fdr.id,
                        action: 'confirm',
                        notes: 'Attested against CBS core ledger balance.',
                      })
                    }
                    disabled={verifyMutation.isPending}
                    className="px-3.5 py-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition flex items-center space-x-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Match (CBS)</span>
                  </button>

                  <button
                    data-testid={`cbs-flag-mismatch-btn-${fdr.id}`}
                    onClick={() => {
                      setSelectedFdr(fdr);
                      setIsMismatchModalOpen(true);
                      setMismatchValue((fdr.principal / 10).toString());
                    }}
                    disabled={verifyMutation.isPending}
                    className="px-3.5 py-2 rounded-md bg-white hover:bg-red-50 text-red-800 font-semibold text-xs transition border border-red-300 shadow-xs flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Flag Mismatch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flag Mismatch Modal */}
      {isMismatchModalOpen && selectedFdr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-300 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-red-900 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Flag Core Banking Balance Mismatch</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">Receipt: {selectedFdr.receipt_no}</p>
              </div>
              <button 
                onClick={() => setIsMismatchModalOpen(false)} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 p-3.5 rounded-lg border border-red-200 text-xs text-red-900 leading-relaxed">
              <strong>Audit Warning:</strong> Flagging a mismatch will immediately lock this FDR into <code>discrepancy_locked</code> state and trigger an automated AICTE scrutiny inquiry.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">College Claimed Principal</label>
                <div className="font-mono font-bold text-slate-900 text-sm bg-slate-50 p-2 rounded border border-slate-200">
                  ₹{selectedFdr.principal.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Actual CBS Ledger Balance (₹) *</label>
                <input
                  type="number"
                  value={mismatchValue}
                  onChange={(e) => setMismatchValue(e.target.value)}
                  className="w-full bg-white border border-red-300 rounded-md p-2.5 text-slate-900 font-mono text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bank Verifier Discrepancy Remarks *</label>
                <textarea
                  rows={2}
                  value={verifierNotes}
                  onChange={(e) => setVerifierNotes(e.target.value)}
                  placeholder="e.g. CBS record shows deposit encashed prematurely on 2026-03-15."
                  className="w-full bg-white border border-red-300 rounded-md p-2.5 text-slate-900 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsMismatchModalOpen(false)}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  verifyMutation.mutate({
                    fdrId: selectedFdr.id,
                    action: 'flag_mismatch',
                    bankVal: mismatchValue,
                    notes: verifierNotes || 'Core banking balance mismatch detected.',
                  })
                }
                disabled={verifyMutation.isPending}
                className="px-5 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
              >
                {verifyMutation.isPending ? 'Locking...' : 'Lock Deposit & Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
