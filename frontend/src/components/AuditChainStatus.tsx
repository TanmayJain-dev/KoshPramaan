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
    <div className={`rounded-xl border p-5 shadow-lg transition-all ${
      auditState.valid 
        ? 'bg-slate-900/60 border-slate-800' 
        : 'bg-red-950/30 border-red-800/80'
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Status indicator */}
        <div className="flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-lg border ${
            auditState.valid 
              ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400' 
              : 'bg-red-950 border-red-700 text-red-400 animate-pulse'
          }`}>
            {auditState.valid ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold text-slate-100">
                Tamper-Evident Audit Ledger (SHA-256 Hash-Chained)
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                auditState.valid 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60' 
                  : 'bg-red-900 text-red-200 border-red-600'
              }`}>
                {auditState.valid ? 'CRYPTO-VERIFIED VALID' : `CHAIN BROKEN AT EVENT #${auditState.broken_index}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only chain: <code className="font-mono text-teal-300">hash = SHA256(prev_hash + ts_sim + actor + action + payload)</code>
            </p>
          </div>
        </div>

        {/* Metrics & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300">
            <span className="text-slate-500 mr-1.5">Events:</span>
            <span className="font-bold text-teal-400">{auditState.total_events}</span>
          </div>

          <div className="hidden sm:block bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-400 max-w-xs truncate" title={auditState.latest_hash || ''}>
            <span className="text-slate-500 mr-1.5">Tip:</span>
            <span className="text-slate-300">{auditState.latest_hash?.slice(0, 16)}...</span>
          </div>

          <button
            onClick={onVerify}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 border border-blue-700/60 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verify Chain</span>
          </button>

          {auditState.valid ? (
            <button
              onClick={() => onSimulateTamper(1)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 text-xs font-medium transition flex items-center space-x-1.5"
              title="Maliciously alters event #1 payload in DB to test cryptographic break detection"
            >
              <Bug className="h-3.5 w-3.5" />
              <span>Simulate Tamper</span>
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-600 text-xs font-bold transition flex items-center space-x-1.5 shadow"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restore Chain Baseline</span>
            </button>
          )}

          <button
            onClick={() => setShowEvents(!showEvents)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition flex items-center space-x-1"
          >
            <span>Audit Log</span>
            {showEvents ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>

      {/* Chain Break Alert Details */}
      {!auditState.valid && (
        <div className="mt-4 p-4 rounded-lg bg-red-950/80 border border-red-700 text-xs text-red-200">
          <div className="font-bold text-sm mb-1 flex items-center text-red-300">
            <ShieldAlert className="h-4 w-4 mr-1.5 text-red-400" />
            Cryptographic Integrity Alert: Chain validation failure at Event ID #{auditState.broken_index}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
            {auditState.computed_hash && (
              <div className="bg-red-950/90 p-2 rounded border border-red-800">
                <span className="text-red-400 block font-sans">Computed Hash from DB payload:</span>
                <span className="break-all">{auditState.computed_hash}</span>
              </div>
            )}
            {auditState.recorded_hash && (
              <div className="bg-red-950/90 p-2 rounded border border-red-800">
                <span className="text-red-400 block font-sans">Recorded Cryptographic Hash:</span>
                <span className="break-all">{auditState.recorded_hash}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-slate-300 font-sans">
            The ledger payload has been altered without recalculating downstream SHA-256 links. The cryptographic seal was breached.
          </p>
        </div>
      )}

      {/* Expandable Events Table */}
      {showEvents && (
        <div className="mt-4 border-t border-slate-800 pt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">Sim Time</th>
                <th className="py-2 px-2">Actor</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2">Payload</th>
                <th className="py-2 px-2">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-2 text-teal-400 font-bold">#{ev.id}</td>
                  <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{ev.ts_sim.slice(0, 19)}</td>
                  <td className="py-2 px-2 text-amber-300 whitespace-nowrap">{ev.actor}</td>
                  <td className="py-2 px-2 text-blue-300 whitespace-nowrap">{ev.action}</td>
                  <td className="py-2 px-2 text-slate-300 max-w-xs truncate" title={JSON.stringify(ev.payload)}>
                    {JSON.stringify(ev.payload)}
                  </td>
                  <td className="py-2 px-2 text-slate-400 text-[10px] whitespace-nowrap" title={ev.hash}>
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
