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
  Lock,
  ShieldCheck,
  Search,
  ExternalLink,
  Info
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
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-card flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scope Banner */}
      <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                Checker Authority Desk
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Jurisdiction Scope: <strong className="text-slate-700">{user?.institution_id}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                Affiliation: <strong className="text-slate-700">{institution?.region || 'Northern Region'}</strong>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-aicte-ink flex items-center gap-2.5 pt-1">
              <UserCheck className="w-6 h-6 text-indigo-700 shrink-0" />
              <span>{institution?.name || 'Apex Institute of Technology'}</span>
            </h1>
            <p className="text-xs text-aicte-subtext">
              Second-tier internal compliance desk. Exercises four-eyes principle to verify Maker submissions before formal regional regulatory sanction.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-xs font-mono shrink-0 shadow-xs">
            <span className="text-slate-500">Pending Review Queue: </span>
            <span className="font-bold text-indigo-900 text-sm ml-1">{pendingFDRs.length} Claim(s)</span>
          </div>
        </div>
      </div>

      {/* Pending Submissions Queue */}
      <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-aicte-ink">Pending Verification Inbox</h2>
            <p className="text-xs text-aicte-subtext">Claims submitted by Institution Maker awaiting formal internal verification</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            {pendingFDRs.length} Action(s) Required
          </span>
        </div>

        {pendingFDRs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No claims currently pending review. All Maker claims have been verified or returned.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {pendingFDRs.map((fdr) => {
              const isCreator = fdr.created_by === user?.id;
              return (
                <div 
                  key={fdr.id} 
                  data-testid={`fdr-row-${fdr.id}`} 
                  className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-aicte-ink">{fdr.receipt_no}</span>
                      <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {fdr.id}
                      </span>
                      {isCreator && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-red-600" /> Creator Segregation Conflict
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700">
                      {fdr.bank} ({fdr.branch}) • Principal: <strong className="text-slate-900 font-mono">₹{fdr.principal.toLocaleString('en-IN')}</strong> • Maturity: <span className="font-mono text-slate-600">{fdr.maturity_date}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lien Clause: <span className={fdr.lien_clause_ok ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>{fdr.lien_clause_ok ? 'Marked' : 'Missing'}</span> • Document Hash: <span className="font-mono text-slate-700">{fdr.doc_hash?.substring(0, 16)}...</span>
                    </p>
                  </div>

                  <button
                    data-testid={`review-verify-btn-${fdr.id}`}
                    onClick={() => {
                      setSelectedFdr(fdr);
                      setRemarks('');
                    }}
                    className="px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-xs shrink-0"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-aicte-border rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                    Statutory Checker Audit
                  </span>
                  <span className="text-xs text-slate-500">Four-Eyes Verification</span>
                </div>
                <h3 className="text-lg font-bold text-aicte-ink mt-1">Checker Review &amp; Segregation Check</h3>
                <p className="text-xs text-slate-500 font-mono">Claim ID: {selectedFdr.id} ({selectedFdr.receipt_no})</p>
              </div>
              <button 
                onClick={() => setSelectedFdr(null)} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Maker != Checker Segregation Alert */}
            {selectedFdr.created_by === user?.id ? (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg space-y-1.5 text-xs text-red-900">
                <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-[11px] text-red-800">
                  <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
                  <span>Maker-Checker Segregation Safeguard Triggered</span>
                </div>
                <p className="leading-relaxed">
                  You are registered as the <strong>Maker</strong> who created this draft claim. Under AICTE security regulations and the statutory four-eyes principle, the Maker cannot approve their own submission. An independent Checker must verify.
                </p>
                <p className="text-[11px] text-red-700 font-mono">
                  Created by: {selectedFdr.created_by} • Current User: {user?.id}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg flex items-center space-x-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Segregation Check Passed:</strong> You are an independent authorized Checker. You did not create this draft claim.</span>
              </div>
            )}

            {/* Claim Details Card */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-semibold">Pledged Principal:</span>
                  <div className="text-base font-bold text-slate-900 font-mono">₹{selectedFdr.principal.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Issuing Bank &amp; Branch:</span>
                  <div className="text-slate-800 font-medium">{selectedFdr.bank} - {selectedFdr.branch}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Maturity Date:</span>
                  <div className="text-slate-800 font-mono">{selectedFdr.maturity_date}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Tripartite Lien Clause:</span>
                  <div className={selectedFdr.lien_clause_ok ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                    {selectedFdr.lien_clause_ok ? 'Verified Marked' : 'Deficient / Missing'}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-semibold">Cryptographic Document Digest (SHA-256):</span>
                <div className="text-[11px] font-mono text-slate-800 break-all bg-white p-2 rounded mt-1 border border-slate-200 select-all">
                  {selectedFdr.doc_hash || 'SHA-256 Hash Verified against client certificate'}
                </div>
              </div>
            </div>

            {/* Checker Remarks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Checker Review Remarks *</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Scanned receipt and tripartite lien clause verified against institutional bank records."
                className="w-full bg-white border border-slate-300 rounded-md p-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedFdr(null)}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  data-testid="return-submission-btn"
                  onClick={() =>
                    reviewMutation.mutate({
                      fdrId: selectedFdr.id,
                      action: 'return',
                      remarksText: remarks || 'Returned for missing or illegible documentation.',
                    })
                  }
                  disabled={reviewMutation.isPending}
                  className="px-4 py-2 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 transition"
                >
                  Return to Maker
                </button>

                <button
                  type="button"
                  data-testid="approve-submission-btn"
                  onClick={() =>
                    reviewMutation.mutate({
                      fdrId: selectedFdr.id,
                      action: 'approve',
                      remarksText: remarks || 'Verified and approved for regulatory sanction.',
                    })
                  }
                  disabled={selectedFdr.created_by === user?.id || reviewMutation.isPending}
                  className={`px-5 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition ${
                    selectedFdr.created_by === user?.id
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-indigo-700 hover:bg-indigo-800 text-white'
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
      <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60">
          <h2 className="text-sm font-bold text-aicte-ink">Institution History &amp; Approved Claims</h2>
          <p className="text-xs text-aicte-subtext">Claims previously sanctioned or under regional review</p>
        </div>
        <div className="p-6">
          <div className="space-y-2.5">
            {pastFDRs.map((fdr) => (
              <div 
                key={fdr.id} 
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2"
              >
                <div>
                  <div className="font-bold text-aicte-ink">{fdr.receipt_no} ({fdr.id})</div>
                  <div className="text-slate-600">{fdr.bank} • ₹{fdr.principal.toLocaleString('en-IN')}</div>
                </div>
                <div className="sm:text-right">
                  <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-white border border-slate-300 text-slate-700">
                    {fdr.workflow_status}
                  </span>
                  {fdr.checker_remarks && (
                    <div className="text-[10px] text-slate-500 mt-1 max-w-xs truncate">
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
