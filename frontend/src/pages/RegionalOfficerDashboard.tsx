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
  Landmark,
  Search,
  ChevronRight
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
    const hoursLeft = 36; // Demonstration SLA
    if (hoursLeft > 48) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <Clock className="w-3 h-3 text-emerald-600" /> &gt;48h Remaining
        </span>
      );
    } else if (hoursLeft >= 24) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-600" /> {hoursLeft}h SLA (Amber)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-800 border border-red-300 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-600" /> &lt;24h Critical
        </span>
      );
    }
  };

  const getBankAttestationBadge = (fdr: FDR) => {
    const isConfirmed = fdr.field_claims?.some((c) => c.field === 'principal' && c.trust_level === 'bank_confirmed');
    if (isConfirmed) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
          <Landmark className="w-3 h-3 text-teal-600" /> Bank Attested
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1">
        <Clock className="w-3 h-3 text-slate-400" /> Pending CBS Attestation
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-card flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Regional Scope Header */}
      <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Regional Jurisdictional Authority
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Territory Scope: <strong className="text-slate-700">{user?.region || 'Northern Region'}</strong>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-aicte-ink flex items-center gap-2.5 pt-1">
              <MapPin className="w-6 h-6 text-emerald-700 shrink-0" />
              <span>{user?.region || 'Northern Region'} Jurisdiction</span>
            </h1>
            <p className="text-xs text-aicte-subtext">
              Statutory oversight and sanctioning authority for technical education institutions strictly within the assigned geographical region.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Colleges in Region</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{institutions.length} Institutions</div>
            </div>
            <div className="bg-amber-50/60 px-3.5 py-2.5 rounded-lg border border-amber-200 shadow-xs">
              <div className="text-amber-800 text-[10px] uppercase font-bold tracking-wider">Sanction Queue</div>
              <div className="font-bold text-amber-900 text-sm mt-0.5">{pendingQueue.length} Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          data-testid="pending-queue-tab"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'queue'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>RO Review Queue ({pendingQueue.length})</span>
        </button>

        <button
          data-testid="decay-watchlist-tab"
          onClick={() => setActiveTab('decay_watchlist')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'decay_watchlist'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Proof-Score Decay Watchlist ({decayWatchlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('institutions')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'institutions'
              ? 'bg-aicte-blue text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Regional Institutions ({institutions.length})</span>
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-sm font-bold text-aicte-ink">Checker-Approved Claims Queue</h2>
              <p className="text-xs text-aicte-subtext">Claims formally verified by college Checker, pending final regional sanction</p>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-300">
              Governed by AICTE SLA timer
            </span>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No claims pending RO review in this region. All verified claims have been sanctioned or clarified.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {pendingQueue.map((fdr) => (
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
                      {getSlaBadge(fdr.checked_at)}
                      {getBankAttestationBadge(fdr)}
                    </div>
                    <p className="text-xs text-slate-700">
                      College: <strong className="text-slate-900">{fdr.institution_name || fdr.institution_id}</strong> • Principal: <strong className="text-slate-900 font-mono">₹{fdr.principal.toLocaleString('en-IN')}</strong> • Bank: {fdr.bank}
                    </p>
                    {fdr.checker_remarks && (
                      <p className="text-[11px] text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 inline-block">
                        <strong>Checker Endorsement:</strong> {fdr.checker_remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      data-testid={`sanction-btn-${fdr.id}`}
                      onClick={() => {
                        setSelectedFdr(fdr);
                        setActionType('approve');
                        setRoRemarks('Sanction granted based on Checker endorsement and bank confirmation.');
                      }}
                      className="px-3.5 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center space-x-1 shadow-xs"
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
                      className="px-3 py-2 rounded-md bg-white hover:bg-amber-50 text-amber-900 font-semibold text-xs transition border border-amber-300 shadow-xs flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Clarify</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedFdr(fdr);
                        setActionType('reject');
                        setRoRemarks('Claim rejected due to irregular tenure and lien non-compliance.');
                      }}
                      className="px-3 py-2 rounded-md bg-white hover:bg-red-50 text-red-900 font-semibold text-xs transition border border-red-300 shadow-xs flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5 text-red-700" />
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
        <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
            <div>
              <h2 className="text-sm font-bold text-amber-950 flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-amber-700" />
                <span>Regional Proof-Score Decay Watchlist</span>
              </h2>
              <p className="text-xs text-amber-900 mt-0.5">
                Statutory deposit validity decays over elapsed time (90-day half-life). Instruments decaying below threshold (60.0) require immediate bank re-attestation.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
              Half-Life: 90 Days • Threshold: 60.0
            </span>
          </div>

          {decayWatchlist.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              All FDR records in {user?.region} currently maintain proof scores above the 60.0 regulatory threshold. Advance simulated clock in Admin to observe continuous mathematical decay.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {decayWatchlist.map((fdr) => (
                <div key={fdr.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-aicte-ink">{fdr.receipt_no}</span>
                      <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {fdr.id}
                      </span>
                      {fdr.status === 'closed_early' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> Closed Early
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          Proof Score: {fdr.proof_score?.toFixed(1) ?? '54.2'} / 100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700">
                      College: <strong className="text-slate-900">{fdr.institution_id}</strong> • Principal: ₹{fdr.principal.toLocaleString('en-IN')} • Bank: {fdr.bank}
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Decay Signal: Fresh bank re-verification required to restore trust level before next regulatory inspection.
                    </p>
                  </div>

                  <button
                    onClick={() => showToast(`Re-verification notice dispatched to ${fdr.bank} for claim ${fdr.id}`)}
                    className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs shrink-0"
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
            <div key={inst.id} className="bg-white border border-aicte-border rounded-xl p-5 shadow-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-aicte-ink">{inst.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{inst.id} • {inst.region}</p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  {inst.category}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Approved Intake:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{inst.intake} Students</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Total FDR Security:</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">₹{inst.total_fdr_principal.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      {selectedFdr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-aicte-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-aicte-ink">
                  {actionType === 'approve' && 'Sanction FDR Deposit'}
                  {actionType === 'clarify' && 'Request Regional Clarification'}
                  {actionType === 'reject' && 'Reject Claim (Adverse Regulatory Action)'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">FDR: {selectedFdr.receipt_no}</p>
              </div>
              <button 
                onClick={() => setSelectedFdr(null)} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Regulatory Decision Remarks *</label>
              <textarea
                rows={3}
                value={roRemarks}
                onChange={(e) => setRoRemarks(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedFdr(null)}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
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
                className="px-5 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
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
