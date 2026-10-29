import React, { useState } from 'react';
import { AuditVerify, AuditEvent } from '../types';
import { ShieldCheck, ShieldAlert, Bug, RefreshCw, ChevronDown, ChevronUp, Hash } from 'lucide-react';

interface AuditChainStatusProps {
  auditState: AuditVerify | null;
  events: AuditEvent[];
  onVerify: () => void;
  onSimulateTamper: (eventId: number) => void;
  onRestore: () => void;
  isLoading: boolean;
}

export const AuditChainStatus: React.FC<AuditChainStatusProps> = ({
  auditState,
  events,
  onVerify,
  onSimulateTamper,
  onRestore,
  isLoading,
}) => {
  const [showEvents, setShowEvents] = useState(false);

  if (!auditState) return null;

  return (
    <div className={`rounded-xl border p-5 shadow-card transition-all ${
      auditState.valid 
        ? 'bg-white border-aicte-border' 
        : 'bg-red-50 border-red-300'
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Status indicator */}
        <div className="flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-lg border ${
            auditState.valid 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-red-100 border-red-300 text-red-700 animate-pulse'
          }`}>
            {auditState.valid ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-aicte-ink">
                Tamper-Evident Audit Ledger (SHA-256 Hash-Chained)
              </h3>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                auditState.valid 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-100 text-red-900 border-red-300'
              }`}>
                {auditState.valid ? 'CRYPTO-VERIFIED VALID' : `CHAIN BROKEN AT EVENT #${auditState.broken_index}`}
              </span>
            </div>
            <p className="text-xs text-aicte-subtext mt-0.5">
              Append-only cryptographic chain: <code className="font-mono text-slate-700 font-semibold">hash = SHA256(prev_hash + ts_sim + actor + action + payload)</code>
            </p>
          </div>
        </div>

        {/* Metrics & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-mono text-slate-700 shadow-xs">
            <span className="text-slate-500 mr-1.5">Events:</span>
            <span className="font-bold text-slate-900">{auditState.total_events}</span>
          </div>

          <div className="hidden sm:block bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-mono text-slate-600 max-w-xs truncate shadow-xs" title={auditState.latest_hash || ''}>
            <span className="text-slate-500 mr-1.5">Tip Hash:</span>
            <span className="text-slate-800">{auditState.latest_hash?.slice(0, 16)}...</span>
          </div>

          <button
            onClick={onVerify}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-aicte-blue ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verify Chain</span>
          </button>

          {auditState.valid ? (
            <button
              onClick={() => onSimulateTamper(1)}
              className="px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-medium transition flex items-center space-x-1.5 shadow-xs"
              title="Maliciously alters event #1 payload in DB to test cryptographic break detection"
            >
              <Bug className="h-3.5 w-3.5 text-amber-700" />
              <span>Simulate Tamper</span>
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restore Chain Baseline</span>
            </button>
          )}

          <button
            onClick={() => setShowEvents(!showEvents)}
            className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs transition flex items-center space-x-1 shadow-xs"
          >
            <span>Audit Log</span>
            {showEvents ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>

      {/* Chain Break Alert Details */}
      {!auditState.valid && (
        <div className="mt-4 p-4 rounded-lg bg-red-100/80 border border-red-300 text-xs text-red-900">
          <div className="font-bold text-xs mb-1 flex items-center text-red-800 uppercase tracking-wide">
            <ShieldAlert className="h-4 w-4 mr-1.5 text-red-600" />
            Cryptographic Integrity Alert: Chain validation failure at Event ID #{auditState.broken_index}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
            {auditState.computed_hash && (
              <div className="bg-white p-2.5 rounded border border-red-200">
                <span className="text-slate-500 block font-sans font-semibold">Computed Hash from DB payload:</span>
                <span className="break-all text-red-700">{auditState.computed_hash}</span>
              </div>
            )}
            {auditState.recorded_hash && (
              <div className="bg-white p-2.5 rounded border border-red-200">
                <span className="text-slate-500 block font-sans font-semibold">Recorded Cryptographic Hash:</span>
                <span className="break-all text-slate-800">{auditState.recorded_hash}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-red-800 font-sans">
            The database ledger was altered out-of-band without recalculating downstream SHA-256 links. The cryptographic seal has been broken.
          </p>
        </div>
      )}

      {/* Expandable Events Table */}
      {showEvents && (
        <div className="mt-4 border-t border-slate-200 pt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">Sim Time</th>
                <th className="py-2 px-2">Actor</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2">Payload</th>
                <th className="py-2 px-2">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-slate-900 font-bold">#{ev.id}</td>
                  <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{ev.ts_sim.slice(0, 19)}</td>
                  <td className="py-2 px-2 text-indigo-700 font-semibold whitespace-nowrap">{ev.actor}</td>
                  <td className="py-2 px-2 text-slate-800 whitespace-nowrap">{ev.action}</td>
                  <td className="py-2 px-2 text-slate-600 max-w-xs truncate" title={JSON.stringify(ev.payload)}>
                    {JSON.stringify(ev.payload)}
                  </td>
                  <td className="py-2 px-2 text-slate-400 text-[10px] whitespace-nowrap select-all" title={ev.hash}>
                    {ev.hash.slice(0, 14)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
