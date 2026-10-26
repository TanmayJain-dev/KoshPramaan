import React from 'react';
import { Server, Activity, ShieldCheck, Key, FileCheck, Landmark } from 'lucide-react';

interface AdaptersStatusProps {
  adapters: {
    bank?: Record<string, any>;
    grievance?: Record<string, any>;
    vigilance?: Record<string, any>;
    esign?: Record<string, any>;
  };
}

export const AdaptersStatus: React.FC<AdaptersStatusProps> = ({ adapters }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow">
      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 mb-4">
        <Activity className="h-5 w-5 text-teal-400" />
        <div>
          <h3 className="text-sm font-bold text-slate-100">
            Adapter Interface Subsystem (Mocked Connectors)
          </h3>
          <p className="text-xs text-slate-400">
            Per Honesty Rules: External banking, grievance, vigilance, and eSign interfaces are safely abstracted behind clean adapters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Bank Adapter */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center">
              <Landmark className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
              Bank API Connector
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Scripted per FDR (Clean, 10x Mismatch, Day-200 Early Liquidation).
          </div>
        </div>

        {/* Grievance Adapter */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center">
              <FileCheck className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Grievance Portal
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Active feed checking unpaid student refunds &amp; faculty arrears.
          </div>
        </div>

        {/* Vigilance Adapter */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              Vigilance &amp; Legal Cell
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Automated legal hold / clearance check for release gates.
          </div>
        </div>

        {/* eSign Adapter */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center">
              <Key className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
              National eSign Gateway
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Cryptographic SHA256-RSA mock signature generation for release NOC.
          </div>
        </div>

      </div>
    </div>
  );
};
