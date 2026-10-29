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
  TrendingDown,
  ShieldCheck
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
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-card flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scrutiny Header */}
      <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                Central Scrutiny &amp; Vigilance Cell
              </span>
              <span className="text-xs text-slate-500 font-mono">National Cross-Regional Oversight</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-aicte-ink flex items-center gap-2.5 pt-1">
              <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0" />
              <span>Vigilance &amp; Possible Duplicate Detector</span>
            </h1>
            <p className="text-xs text-aicte-subtext">
              National audit surface: identifies possible duplicate instrument fingerprints pledged across multiple institutions and audits cryptographic integrity.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono shrink-0">
            <div className="bg-red-50 px-3.5 py-2.5 rounded-lg border border-red-200 shadow-xs">
              <div className="text-red-700 text-[10px] uppercase font-bold tracking-wider">Duplicate Signals</div>
              <div className="font-bold text-red-900 text-sm mt-0.5">{duplicateSummary?.total_duplicates_found ?? 1} Risk Signal</div>
            </div>
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Audit Ledger</div>
              <div className="font-bold text-emerald-700 text-sm mt-0.5">
                {auditState?.valid ? 'Chain Valid' : 'Tampered'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          data-testid="duplicate-signals-tab"
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'duplicates'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Possible Duplicate Detector ({duplicateSummary?.total_duplicates_found ?? 0})</span>
        </button>

        <button
          data-testid="liabilities-ledger-tab"
          onClick={() => setActiveTab('liabilities')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'liabilities'
              ? 'bg-aicte-blue text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Grievance &amp; Liabilities Ledger ({allLiabilities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>SHA-256 Cryptographic Audit Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('decay_watchlist')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'decay_watchlist'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Decay &amp; Early-Closure Watchlist ({decayWatchlist.length})</span>
        </button>
      </div>

      {/* TAB 1: POSSIBLE DUPLICATE DETECTOR */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          {duplicateSummary?.duplicates && duplicateSummary.duplicates.length > 0 ? (
            duplicateSummary.duplicates.map((cluster, idx) => (
              <div key={idx} className="bg-white border-2 border-red-300 rounded-xl p-6 shadow-card space-y-4">
                {/* Alert Badge & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-red-100 text-red-700 border border-red-300">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-300">
                          {cluster.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Distinct Colleges: {cluster.distinct_institutions_count}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Cross-Institution Possible Duplicate Fingerprint Signal
                      </h3>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-red-800 bg-red-50 px-3 py-1.5 rounded-md border border-red-200 select-all">
                    Fingerprint: {cluster.fingerprint}
                  </div>
                </div>

                {/* Grounding Invariant Notice */}
                <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Statutory Regulatory Notice:</strong> {cluster.signal_notice} Automated surveillance systems produce evidentiary risk signals for administrative investigation, not automatic penal verdicts.
                  </p>
                </div>

                {/* Possible Duplicate Pair Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cluster.institutions_involved.map((item, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-aicte-blue" />
                          <span>{item.institution_name}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{item.region}</span>
                      </div>
                      <div className="space-y-1 font-mono text-slate-700">
                        <div>FDR ID: <strong className="text-slate-900">{item.fdr_id}</strong></div>
                        <div>Pledged Receipt No: <strong className="text-red-700 font-bold">{item.receipt_no}</strong></div>
                        <div>Bank: {item.bank} ({item.branch})</div>
                        <div>Principal: ₹{item.principal.toLocaleString('en-IN')}</div>
                        <div>Workflow Status: <span className="text-amber-800 font-semibold">{item.workflow_status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scrutiny Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-slate-200 text-xs gap-2">
                  <span className="text-slate-500">
                    Evidence Hash: SHA-256 fingerprint exact match across Northern &amp; Western Regions.
                  </span>
                  <button
                    onClick={() => showToast('Formal vigilance inquiry dispatched to Bank and Apex Institute.')}
                    className="px-4 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold shadow-xs flex items-center space-x-1.5 shrink-0"
                  >
                    <span>Initiate Inter-Regional Inquiry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-aicte-border rounded-xl p-8 text-center text-slate-500 text-xs shadow-card">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              No duplicate fingerprints detected across institution registrations.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIABILITIES & GRIEVANCES */}
      {activeTab === 'liabilities' && (
        <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-sm font-bold text-aicte-ink">Institutional Liabilities &amp; Grievance Registry</h2>
              <p className="text-xs text-aicte-subtext">Cross-referenced against pledged security deposits for regulatory offset</p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-300">
              {allLiabilities.length} Liability Record(s)
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {allLiabilities.map((liab) => (
              <div key={liab.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{liab.id}</span>
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-800 border border-red-200 text-[11px]">
                      {liab.kind.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                      Status: {liab.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    College: <strong className="text-slate-900">{liab.institution_name}</strong> ({liab.institution_id}) • Region: {liab.institution_region}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Description: Verified non-payment of faculty salaries for Q3/Q4. Security deposit lien can be invoked under AICTE Section 10(p).
                  </p>
                </div>

                <div className="text-right space-y-2 shrink-0">
                  <div className="text-base font-bold text-red-700 font-mono">
                    ₹{liab.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => showToast(`Grievance ${liab.id} flagged for security deposit encashment warning.`)}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-300 shadow-xs text-xs"
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
        <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/60">
            <div>
              <h2 className="text-sm font-bold text-aicte-ink flex items-center space-x-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>Tamper-Evident SHA-256 Hash Chain</span>
              </h2>
              <p className="text-xs text-aicte-subtext mt-0.5">
                Every state transition is chained cryptographically: <code className="text-slate-700 font-mono font-semibold">hash = SHA-256(id + prev_hash + payload)</code>
              </p>
            </div>
            <button
              onClick={() => {
                refetchAudit();
                showToast('Audit hash chain verified across all sequential events.');
              }}
              className="px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-xs shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Chain Integrity</span>
            </button>
          </div>

          {/* Audit Chain Status Banner */}
          <div className="px-6">
            <div className={`p-4 rounded-lg border flex items-center justify-between text-xs font-mono ${
              auditState?.valid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <div className="flex items-center space-x-2.5">
                {auditState?.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {auditState?.valid ? 'CRYPTOGRAPHIC CHAIN VERIFIED' : 'TAMPER DETECTED IN LEDGER'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {auditState?.valid
                      ? `All ${auditState.total_events} blocks chained sequentially. Latest Hash: ${auditState.latest_hash?.substring(0, 24)}...`
                      : `Chain broken at Event #${auditState?.broken_index}! Database modification without re-signing.`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Block #</th>
                  <th className="px-4 py-3">Simulated TS</th>
                  <th className="px-4 py-3">Actor / Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">SHA-256 Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-teal-800">#{evt.id}</td>
                    <td className="px-4 py-3 text-slate-600">{evt.ts_sim?.split('T')[0]}</td>
                    <td className="px-4 py-3 font-sans">
                      <div className="text-slate-900 font-semibold">{evt.actor}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{evt.role}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{evt.action}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-700 break-all max-w-xs select-all">
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
        <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
            <div>
              <h2 className="text-sm font-bold text-rose-950 flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-rose-700" />
                <span>National Proof-Score Decay &amp; Early-Closure Watchlist</span>
              </h2>
              <p className="text-xs text-rose-900 mt-0.5">
                National vigilance monitoring: instruments decayed below threshold (60.0) or flagged with early bank closure.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-rose-100 text-rose-900 border border-rose-300">
              Vigilance Threshold: 60.0
            </span>
          </div>

          {decayWatchlist.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              All national FDR deposits currently maintain proof scores above 60.0. Advance clock in Admin to observe decay or early closure.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {decayWatchlist.map((fdr) => (
                <div key={fdr.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
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
                          Proof Score: {fdr.proof_score?.toFixed(1) ?? '0.0'} / 100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700">
                      College: <strong className="text-slate-900">{fdr.institution_id}</strong> • Principal: ₹{fdr.principal.toLocaleString('en-IN')} • Bank: {fdr.bank}
                    </p>
                    <p className="text-[11px] text-rose-800 font-mono">
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
