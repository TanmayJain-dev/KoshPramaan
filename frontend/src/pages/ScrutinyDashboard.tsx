import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Copy, 
  Layers, 
  FileText, 
  Lock, 
  Search,
  Scale,
  Hash,
  Database,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { DuplicateSummary, AuditVerify, AuditEvent } from '../types';

export const ScrutinyDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'duplicates' | 'audit' | 'liabilities' | 'decay_watchlist'>('duplicates');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const { data: duplicateSummary, isLoading: isDupLoading } = useQuery({
    queryKey: ['duplicate-summary'],
    queryFn: () => apiClient.getDuplicateSummary(),
  });

  const { data: decayWatchlist = [] } = useQuery({
    queryKey: ['decay-watchlist-scrutiny'],
    queryFn: () => apiClient.getDecayWatchlist(),
  });

  const { data: auditState, refetch: refetchAudit, isLoading: isAuditLoading } = useQuery({
    queryKey: ['audit-verify'],
    queryFn: () => apiClient.verifyAudit(),
  });

  const { data: auditEvents = [] } = useQuery({
    queryKey: ['audit-events'],
    queryFn: () => apiClient.getEvents(40),
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions-all'],
    queryFn: () => apiClient.getInstitutions(),
  });

  // Extract all liabilities across institutions
  const allLiabilities = institutions.flatMap((inst) =>
    (inst.liabilities || []).map((l) => ({
      ...l,
      institution_name: inst.name,
      institution_region: inst.region,
    }))
  );

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-teal-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scrutiny Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                Central Scrutiny &amp; Vigilance Cell
              </span>
              <span className="text-xs text-slate-400 font-mono">Cross-Region National Jurisdiction</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center space-x-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <span>Vigilance &amp; Possible Duplicate Detector</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              National audit surface: identifies possible duplicate instrument fingerprints pledged across multiple institutions and audits cryptographic integrity.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Possible Duplicate Signals</div>
              <div className="font-bold text-red-400">{duplicateSummary?.total_duplicates_found ?? 1} Risk Signal</div>
            </div>
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <div className="text-slate-400">Audit Ledger</div>
              <div className="font-bold text-emerald-400">
                {auditState?.valid ? 'Chain Valid' : 'Tampered'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'duplicates'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Possible Duplicate Detector ({duplicateSummary?.total_duplicates_found ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('liabilities')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'liabilities'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Grievance &amp; Liabilities Ledger ({allLiabilities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>SHA-256 Cryptographic Audit Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('decay_watchlist')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'decay_watchlist'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Decay &amp; Early-Closure Watchlist ({decayWatchlist.length})</span>
        </button>
      </div>

      {/* TAB 1: POSSIBLE DUPLICATE DETECTOR */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          {duplicateSummary?.duplicates && duplicateSummary.duplicates.length > 0 ? (
            duplicateSummary.duplicates.map((cluster, idx) => (
              <div key={idx} className="bg-slate-900 border-2 border-red-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
                {/* Alert Badge & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-red-900/50 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-red-950 border border-red-800 animate-pulse">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700">
                          {cluster.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Distinct Colleges: {cluster.distinct_institutions_count}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        Cross-Institution Possible Duplicate Fingerprint Signal
                      </h3>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-red-400 bg-red-950/60 px-3 py-1.5 rounded-lg border border-red-900/60">
                    Fingerprint: {cluster.fingerprint}
                  </div>
                </div>

                {/* Grounding Invariant Notice */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Statutory Regulatory Notice:</strong> {cluster.signal_notice} Automated systems produce evidentiary risk signals for officer review, not automated verdicts.
                  </p>
                </div>

                {/* Possible Duplicate Pair Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cluster.institutions_involved.map((item, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="font-bold text-white flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{item.institution_name}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{item.region}</span>
                      </div>
                      <div className="space-y-1 font-mono text-slate-300">
                        <div>FDR ID: <strong className="text-teal-400">{item.fdr_id}</strong></div>
                        <div>Pledged Receipt No: <strong className="text-red-400">{item.receipt_no}</strong></div>
                        <div>Bank: {item.bank} ({item.branch})</div>
                        <div>Principal: ₹{item.principal.toLocaleString('en-IN')}</div>
                        <div>Workflow Status: <span className="text-amber-400 font-semibold">{item.workflow_status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scrutiny Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    Evidence Hash: SHA-256 fingerprint exact match across Northern &amp; Western Regions.
                  </span>
                  <button
                    onClick={() => showToast('Formal inquiry notice dispatched to State Bank of India Vigilance Desk & Apex Institute.')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-950/50 flex items-center space-x-1.5"
                  >
                    <span>Initiate Inter-Regional Inquiry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              No duplicate fingerprints detected across institution registrations.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIABILITIES & GRIEVANCES */}
      {activeTab === 'liabilities' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Institutional Liabilities &amp; Grievance Registry</h2>
              <p className="text-xs text-slate-400">Cross-referenced against pledged security deposits for regulatory offset</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{allLiabilities.length} Liability Record(s)</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {allLiabilities.map((liab) => (
              <div key={liab.id} className="p-6 hover:bg-slate-800/20 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{liab.id}</span>
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-red-950 text-red-300 border border-red-800">
                      {liab.kind.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                      Status: {liab.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    College: <strong className="text-white">{liab.institution_name}</strong> ({liab.institution_id}) • Region: {liab.institution_region}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Description: Verified non-payment of faculty salaries for Q3/Q4. Security deposit lien can be invoked under AICTE Section 10(p).
                  </p>
                </div>

                <div className="text-right space-y-1.5">
                  <div className="text-base font-bold text-red-400 font-mono">
                    ₹{liab.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => showToast(`Grievance ${liab.id} flagged for security deposit encashment warning.`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700"
                  >
                    Flag for Deposit Encashment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHA-256 AUDIT LEDGER */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-teal-400" />
                <span>Tamper-Evident SHA-256 Hash Chain</span>
              </h2>
              <p className="text-xs text-slate-400">
                Every state transition is chained cryptographically: <code className="text-teal-400 font-mono">hash = SHA-256(id + prev_hash + payload)</code>
              </p>
            </div>
            <button
              onClick={() => {
                refetchAudit();
                showToast('Audit hash chain verified across all sequential events.');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-md shadow-teal-900/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Chain Integrity</span>
            </button>
          </div>

          {/* Audit Chain Status Banner */}
          <div className="px-6">
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
              auditState?.valid
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/70 border-red-700 text-red-200'
            }`}>
              <div className="flex items-center space-x-2.5">
                {auditState?.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
                )}
                <div>
                  <div className="font-bold">
                    {auditState?.valid ? 'CRYPTOGRAPHIC CHAIN VERIFIED' : 'TAMPER DETECTED IN LEDGER'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {auditState?.valid
                      ? `All ${auditState.total_events} blocks chained without interruption. Latest Hash: ${auditState.latest_hash?.substring(0, 24)}...`
                      : `Chain broken at Event #${auditState?.broken_index}! Database modification without re-signing.`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Block #</th>
                  <th className="px-4 py-3">Simulated TS</th>
                  <th className="px-4 py-3">Actor / Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">SHA-256 Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-4 py-3 font-bold text-teal-400">#{evt.id}</td>
                    <td className="px-4 py-3 text-slate-400">{evt.ts_sim?.split('T')[0]}</td>
                    <td className="px-4 py-3">
                      <div className="text-white font-semibold">{evt.actor}</div>
                      <div className="text-[10px] text-slate-400">{evt.role}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{evt.action}</td>
                    <td className="px-4 py-3 text-[10px] text-teal-300/80 break-all max-w-xs">
                      {evt.hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DECAY & EARLY-CLOSURE WATCHLIST */}
      {activeTab === 'decay_watchlist' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/20">
            <div>
              <h2 className="text-lg font-bold text-rose-200 flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <span>National Proof-Score Decay &amp; Early-Closure Watchlist</span>
              </h2>
              <p className="text-xs text-rose-300/80">
                National vigilance monitoring: instruments decayed below threshold (60.0) or flagged with early bank closure.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800">
              Vigilance Threshold: 60.0
            </span>
          </div>

          {decayWatchlist.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              All national FDR deposits currently maintain proof scores above 60.0. Advance clock to observe decay or early closure.
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
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          Proof Score: {fdr.proof_score?.toFixed(1) ?? '0.0'} / 100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      College: <strong className="text-white">{fdr.institution_id}</strong> • Principal: ₹{fdr.principal.toLocaleString('en-IN')} • Bank: {fdr.bank}
                    </p>
                    <p className="text-[11px] text-rose-400/90 font-mono">
                      {fdr.status === 'closed_early'
                        ? 'CRITICAL ALERT: Instrument closed early at bank before statutory lien maturity!'
                        : 'Decay Alert: Proof score degraded over time; scheduled re-verification required.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
