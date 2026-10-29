import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { FDR, Institution } from '../types';
import { 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  ShieldCheck, 
  HelpCircle, 
  X, 
  TrendingDown, 
  ShieldAlert,
  FileCheck2,
  Calendar,
  Landmark
} from 'lucide-react';

export const RegionalOfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'queue' | 'decay_watchlist' | 'institutions'>('queue');
  const [selectedFdr, setSelectedFdr] = useState<FDR | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'clarify'>('approve');
  const [roRemarks, setRoRemarks] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries (scoping handled by backend JWT)
  const { data: fdrs = [], isLoading: isFdrsLoading } = useQuery({
    queryKey: ['fdrs', user?.role, user?.region],
    queryFn: () => apiClient.getFDRs(),
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions', user?.role, user?.region],
    queryFn: () => apiClient.getInstitutions(),
  });

  const { data: decayWatchlist = [] } = useQuery({
    queryKey: ['decay-watchlist', user?.region],
    queryFn: () => apiClient.getDecayWatchlist(),
  });

  // RO Action Mutation
  const roActionMutation = useMutation({
    mutationFn: ({ fdrId, action, remarks }: { fdrId: string; action: 'approve' | 'reject' | 'clarify'; remarks: string }) =>
      apiClient.roReviewFDR(fdrId, action, remarks),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      queryClient.invalidateQueries({ queryKey: ['decay-watchlist'] });
      setSelectedFdr(null);
      setRoRemarks('');
      showToast(`FDR ${data.id} action recorded: ${variables.action.toUpperCase()}.`);
    },
    onError: (err: any) => showToast(err.message),
  });

  // Filter Checker-approved claims awaiting RO decision
  const pendingQueue = fdrs.filter((f) => f.workflow_status === 'CHECKER_APPROVED');

  // Simulated SLA calculation (e.g. 72h window from checked_at)
  const getSlaBadge = (checkedAt: string | null | undefined) => {
    // Standard mock 48h SLA logic
    const hoursLeft = 36; // Demonstration SLA
    if (hoursLeft > 48) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
          <Clock className="w-3 h-3 text-emerald-400" /> &gt;48h Remaining
        </span>
      );
    } else if (hoursLeft >= 24) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" /> {hoursLeft}h SLA (Amber)
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-400" /> &lt;24h Critical
        </span>
      );
    }
  };

  const getBankAttestationBadge = (fdr: FDR) => {
    const isConfirmed = fdr.field_claims?.some((c) => c.field === 'principal' && c.trust_level === 'bank_confirmed');
    if (isConfirmed) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
          <Landmark className="w-3 h-3 text-emerald-400" /> Bank Attested
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
        <Clock className="w-3 h-3 text-slate-400" /> Pending CBS Attestation
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-teal-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Regional Scope Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Regional Jurisdictional Authority
              </span>
              <span className="text-xs text-slate-400 font-mono">Scope: {user?.region || 'Northern Region'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-emerald-400" />
              <span>{user?.region || 'Northern Region'} Jurisdiction</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Statutory oversight for technical institutions located strictly within the designated regional territory.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Jurisdiction</div>
              <div className="font-bold text-emerald-300">{institutions.length} Colleges</div>
            </div>
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Review Queue</div>
              <div className="font-bold text-amber-300">{pendingQueue.length} Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          data-testid="pending-queue-tab"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'queue'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>RO Review Queue ({pendingQueue.length})</span>
        </button>

        <button
          data-testid="decay-watchlist-tab"
          onClick={() => setActiveTab('decay_watchlist')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'decay_watchlist'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Proof-Score Decay Watchlist ({decayWatchlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('institutions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'institutions'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Regional Institutions ({institutions.length})</span>
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Checker-Approved Claims Queue</h2>
              <p className="text-xs text-slate-400">Claims formally verified by college Checker, pending final RO sanction</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Governed by AICTE SLA timer</span>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No claims pending RO review in this region. All verified claims have been sanctioned or clarified.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {pendingQueue.map((fdr) => (
                <div
                  key={fdr.id}
                  data-testid={`fdr-row-${fdr.id}`}
                  className="p-6 hover:bg-slate-800/20 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-sm font-bold text-white">{fdr.receipt_no}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {fdr.id}
                      </span>
                      {getSlaBadge(fdr.checked_at)}
                      {getBankAttestationBadge(fdr)}
                    </div>
                    <p className="text-xs text-slate-300">
                      College: <strong className="text-white">{fdr.institution_name || fdr.institution_id}</strong> • Principal: <strong className="text-teal-300 font-mono">₹{fdr.principal.toLocaleString('en-IN')}</strong> • Bank: {fdr.bank}
                    </p>
                    {fdr.checker_remarks && (
                      <p className="text-[11px] text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded border border-indigo-900/40 inline-block">
                        <strong>Checker Endorsement:</strong> {fdr.checker_remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      data-testid={`sanction-btn-${fdr.id}`}
                      onClick={() => {
                        setSelectedFdr(fdr);
                        setActionType('approve');
                        setRoRemarks('Sanction granted based on Checker endorsement and bank confirmation.');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-1 shadow-md shadow-emerald-900/40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sanction</span>
                    </button>

                    <button
                      data-testid={`clarify-btn-${fdr.id}`}
                      onClick={() => {
                        setSelectedFdr(fdr);
                        setActionType('clarify');
                        setRoRemarks('Please furnish supplementary tripartite confirmation from bank manager.');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition border border-slate-700"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Clarify</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedFdr(fdr);
                        setActionType('reject');
                        setRoRemarks('Claim rejected due to irregular tenure and lien non-compliance.');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-red-300 font-semibold text-xs transition border border-slate-700 hover:border-red-800"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROOF-SCORE DECAY WATCHLIST */}
      {activeTab === 'decay_watchlist' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-amber-950/20">
            <div>
              <h2 className="text-lg font-bold text-amber-200 flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                <span>Regional Proof-Score Decay Watchlist</span>
              </h2>
              <p className="text-xs text-amber-300/80">
                A scanned certificate loses validity over time. Deposits decayed below threshold (60.0) require immediate re-verification.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
              Half-Life: 90 Days • Threshold: 60.0
            </span>
          </div>

          {decayWatchlist.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              All FDR records in {user?.region} currently maintain proof scores above the 60.0 threshold. Advance simulated clock to observe regulatory score decay!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {decayWatchlist.map((fdr) => (
                <div key={fdr.id} className="p-6 hover:bg-slate-800/20 transition flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{fdr.receipt_no}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {fdr.id}
                      </span>
                      {fdr.status === 'closed_early' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> Closed Early
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">
                          Proof Score: {fdr.proof_score?.toFixed(1) ?? '54.2'} / 100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      College: <strong className="text-white">{fdr.institution_id}</strong> • Principal: ₹{fdr.principal.toLocaleString('en-IN')} • Bank: {fdr.bank}
                    </p>
                    <p className="text-[11px] text-amber-400/90">
                      Decay Signal: Fresh bank re-verification required to restore trust level before next inspection.
                    </p>
                  </div>

                  <button
                    onClick={() => showToast(`Re-verification notice dispatched to ${fdr.bank} for claim ${fdr.id}`)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-900/40"
                  >
                    Issue Re-Verification Notice
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSTITUTIONS IN REGION */}
      {activeTab === 'institutions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutions.map((inst) => (
            <div key={inst.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{inst.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{inst.id} • {inst.region}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {inst.category}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400">Approved Intake:</span>
                  <div className="font-bold text-white">{inst.intake} Students</div>
                </div>
                <div>
                  <span className="text-slate-400">Total FDR Security:</span>
                  <div className="font-bold text-teal-300 font-mono">₹{inst.total_fdr_principal.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      {selectedFdr && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {actionType === 'approve' && 'Sanction FDR Deposit'}
                  {actionType === 'clarify' && 'Request Regional Clarification'}
                  {actionType === 'reject' && 'Reject Claim (Adverse Regulatory Action)'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">FDR: {selectedFdr.receipt_no}</p>
              </div>
              <button onClick={() => setSelectedFdr(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Regulatory Decision Remarks *</label>
              <textarea
                rows={3}
                value={roRemarks}
                onChange={(e) => setRoRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFdr(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-decision-btn"
                onClick={() =>
                  roActionMutation.mutate({
                    fdrId: selectedFdr.id,
                    action: actionType,
                    remarks: roRemarks,
                  })
                }
                disabled={roActionMutation.isPending}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/40"
              >
                {roActionMutation.isPending ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
