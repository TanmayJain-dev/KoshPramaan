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
  ArrowRight
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
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-teal-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bank Scope Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                Authorized Scheduled Commercial Bank
              </span>
              <span className="text-xs text-slate-400 font-mono">Scope: {user?.bank || 'State Bank of India'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center space-x-2">
              <Landmark className="w-6 h-6 text-teal-400" />
              <span>{user?.bank || 'State Bank of India'} — CBS Attestation Desk</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Direct Core Banking System (CBS) reconciliation gateway. Attest pledged security deposits against live branch ledger balances.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Reliability Score</div>
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> 98.4% (Tier-1)
              </div>
            </div>
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Assigned Deposits</div>
              <div className="font-bold text-teal-300">{fdrs.length} Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* CBS Reconciliation Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">CBS Reconciliation Queue</h2>
            <p className="text-xs text-slate-400">Deposits held with {user?.bank} requiring bank attestation</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time mock adapter: BankAPI v2.4</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {fdrs.map((fdr) => {
            const isConfirmed = fdr.field_claims?.some((c) => c.field === 'principal' && c.trust_level === 'bank_confirmed');
            const isLocked = fdr.status === 'discrepancy_locked';

            return (
              <div key={fdr.id} className="p-6 hover:bg-slate-800/20 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{fdr.receipt_no}</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {fdr.id}
                    </span>
                    {isConfirmed && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CBS Confirmed
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1 animate-pulse">
                        <Lock className="w-3 h-3 text-red-400" /> Discrepancy Locked
                      </span>
                    )}
                    {fdr.status === 'closed_early' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Closed Early
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300">
                    College: <strong className="text-white">{fdr.institution_id}</strong> • Branch: {fdr.branch} (IFSC: {fdr.ifsc})
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Claimed Principal: <strong className="text-teal-300 font-mono">₹{fdr.principal.toLocaleString('en-IN')}</strong> • Tripartite Lien: {fdr.lien_clause_ok ? 'Present' : 'Not marked'}
                  </p>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() =>
                      verifyMutation.mutate({
                        fdrId: fdr.id,
                        action: 'confirm',
                        notes: 'Attested against CBS core ledger balance.',
                      })
                    }
                    disabled={verifyMutation.isPending}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition flex items-center space-x-1 shadow-md shadow-teal-900/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Match (CBS)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedFdr(fdr);
                      setIsMismatchModalOpen(true);
                      setMismatchValue((fdr.principal / 10).toString());
                    }}
                    disabled={verifyMutation.isPending}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950/70 text-red-300 font-semibold text-xs transition border border-slate-700 hover:border-red-800 flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>Flag Core Banking Balance Mismatch</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">Receipt: {selectedFdr.receipt_no}</p>
              </div>
              <button onClick={() => setIsMismatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-950/50 p-3.5 rounded-xl border border-red-800/80 text-xs text-red-200 leading-relaxed">
              <strong>Audit Warning:</strong> Flagging a mismatch will immediately lock this FDR into <code>discrepancy_locked</code> state and trigger an automated AICTE scrutiny inquiry.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">College Claimed Principal</label>
                <div className="font-mono font-bold text-white text-sm bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  ₹{selectedFdr.principal.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Actual CBS Ledger Balance (₹) *</label>
                <input
                  type="number"
                  value={mismatchValue}
                  onChange={(e) => setMismatchValue(e.target.value)}
                  className="w-full bg-slate-950 border border-red-700 rounded-lg p-2.5 text-white font-mono focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bank Verifier Discrepancy Remarks *</label>
                <textarea
                  rows={2}
                  value={verifierNotes}
                  onChange={(e) => setVerifierNotes(e.target.value)}
                  placeholder="e.g. CBS record shows deposit encashed prematurely on 2026-03-15."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsMismatchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
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
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-950/40"
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
