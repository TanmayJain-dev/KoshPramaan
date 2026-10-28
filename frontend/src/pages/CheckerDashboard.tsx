import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { FDR } from '../types';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  X, 
  Send, 
  RotateCcw,
  FileCheck,
  FileText,
  Lock
} from 'lucide-react';

export const CheckerDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFdr, setSelectedFdr] = useState<FDR | null>(null);
  const [remarks, setRemarks] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const { data: fdrs = [], isLoading } = useQuery({
    queryKey: ['fdrs', user?.role, user?.institution_id],
    queryFn: () => apiClient.getFDRs(),
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institution', user?.institution_id],
    queryFn: () => apiClient.getInstitutions(user?.institution_id || undefined),
  });

  const institution = institutions[0];

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: ({ fdrId, action, remarksText }: { fdrId: string; action: 'approve' | 'return'; remarksText: string }) =>
      apiClient.checkerReviewFDR(fdrId, action, remarksText),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      setSelectedFdr(null);
      setRemarks('');
      if (variables.action === 'approve') {
        showToast(`FDR claim ${data.id} approved and forwarded to Regional Officer (RO Northern Region).`);
      } else {
        showToast(`FDR claim ${data.id} returned to Institution Maker with notes.`);
      }
    },
    onError: (err: any) => showToast(err.message),
  });

  // Filter FDRs
  const pendingFDRs = fdrs.filter((f) => f.workflow_status === 'SUBMITTED');
  const pastFDRs = fdrs.filter((f) => f.workflow_status !== 'SUBMITTED');

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-teal-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scope Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Checker Authority Desk
              </span>
              <span className="text-xs text-slate-400 font-mono">Scope: {user?.institution_id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center space-x-2">
              <UserCheck className="w-6 h-6 text-indigo-400" />
              <span>{institution?.name || 'Apex Institute of Technology'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Internal verification queue. Reviews claims entered by Maker prior to regional regulatory submission.
            </p>
          </div>

          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Pending Review: </span>
            <span className="font-bold text-indigo-300 text-sm">{pendingFDRs.length} Claim(s)</span>
          </div>
        </div>
      </div>

      {/* Pending Submissions Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pending Verification Inbox</h2>
            <p className="text-xs text-slate-400">Claims submitted by Institution Maker awaiting formal verification</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
            {pendingFDRs.length} Action(s) Required
          </span>
        </div>

        {pendingFDRs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No claims currently pending review. All Maker claims have been verified or returned.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {pendingFDRs.map((fdr) => {
              const isCreator = fdr.created_by === user?.id;
              return (
                <div key={fdr.id} className="p-6 hover:bg-slate-800/20 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{fdr.receipt_no}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {fdr.id}
                      </span>
                      {isCreator && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Creator Segregation Conflict
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      {fdr.bank} ({fdr.branch}) • Principal: <strong className="text-teal-400 font-mono">₹{fdr.principal.toLocaleString('en-IN')}</strong> • Maturity: {fdr.maturity_date}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Lien Clause: <span className={fdr.lien_clause_ok ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{fdr.lien_clause_ok ? 'Marked' : 'Missing'}</span> • Document Hash: <span className="font-mono text-slate-300">{fdr.doc_hash?.substring(0, 16)}...</span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFdr(fdr);
                      setRemarks('');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-md shadow-indigo-900/40"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Review &amp; Verify</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedFdr && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Checker Review &amp; Segregation Check</h3>
                <p className="text-xs text-slate-400 font-mono">Claim: {selectedFdr.id} ({selectedFdr.receipt_no})</p>
              </div>
              <button onClick={() => setSelectedFdr(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Maker != Checker Segregation Alert */}
            {selectedFdr.created_by === user?.id ? (
              <div className="bg-red-950/80 border border-red-700 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-red-300 font-bold text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Maker-Checker Segregation Safeguard Triggered</span>
                </div>
                <p className="text-xs text-red-200 leading-relaxed">
                  You are registered as the <strong>Maker</strong> who created this draft claim. Under AICTE security regulations, the Maker cannot approve their own submission. An independent Checker must verify.
                </p>
                <p className="text-[11px] text-red-300/80 font-mono">
                  Created by: {selectedFdr.created_by} • Current User: {user?.id}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Segregation Check Passed: You are an independent Checker authorized to verify this submission.</span>
              </div>
            )}

            {/* Claim Details Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Pledged Principal:</span>
                  <div className="text-base font-bold text-teal-300 font-mono">₹{selectedFdr.principal.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-400">Issuing Bank &amp; Branch:</span>
                  <div className="text-slate-200 font-medium">{selectedFdr.bank} - {selectedFdr.branch}</div>
                </div>
                <div>
                  <span className="text-slate-400">Maturity Date:</span>
                  <div className="text-slate-200 font-mono">{selectedFdr.maturity_date}</div>
                </div>
                <div>
                  <span className="text-slate-400">Tripartite Lien Clause:</span>
                  <div className={selectedFdr.lien_clause_ok ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {selectedFdr.lien_clause_ok ? 'Verified Marked' : 'Deficient / Missing'}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Cryptographic Document Digest (SHA-256):</span>
                <div className="text-[11px] font-mono text-teal-400 break-all bg-slate-900 p-2 rounded mt-1 border border-slate-800">
                  {selectedFdr.doc_hash || 'SHA-256 Hash Verified against client certificate'}
                </div>
              </div>
            </div>

            {/* Checker Remarks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Checker Review Remarks *</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Scanned receipt and lien clause verified against institutional bank records."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFdr(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() =>
                    reviewMutation.mutate({
                      fdrId: selectedFdr.id,
                      action: 'return',
                      remarksText: remarks || 'Returned for missing or illegible documentation.',
                    })
                  }
                  disabled={reviewMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-semibold border border-amber-700/60"
                >
                  Return to Maker
                </button>

                <button
                  type="button"
                  onClick={() =>
                    reviewMutation.mutate({
                      fdrId: selectedFdr.id,
                      action: 'approve',
                      remarksText: remarks || 'Verified and approved for regulatory sanction.',
                    })
                  }
                  disabled={selectedFdr.created_by === user?.id || reviewMutation.isPending}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md ${
                    selectedFdr.created_by === user?.id
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                  }`}
                  title={selectedFdr.created_by === user?.id ? 'Maker-Checker Segregation Rule: Creator cannot self-approve' : 'Approve claim'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{reviewMutation.isPending ? 'Processing...' : 'Approve Submission'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verified Claims History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Institution History &amp; Approved Claims</h2>
          <p className="text-xs text-slate-400">Claims previously sanctioned or under regional review</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {pastFDRs.map((fdr) => (
              <div key={fdr.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{fdr.receipt_no} ({fdr.id})</div>
                  <div className="text-slate-400">{fdr.bank} • ₹{fdr.principal.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-800 text-slate-300">
                    {fdr.workflow_status}
                  </span>
                  {fdr.checker_remarks && (
                    <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate">
                      Remarks: {fdr.checker_remarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
