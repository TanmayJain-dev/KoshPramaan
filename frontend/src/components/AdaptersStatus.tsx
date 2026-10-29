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
    <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card space-y-4">
      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-200">
        <Activity className="h-5 w-5 text-aicte-blue" />
        <div>
          <h3 className="text-sm font-bold text-aicte-ink">
            Statutory Integration Adapters (Strict Interface Subsystem)
          </h3>
          <p className="text-xs text-aicte-subtext">
            Architectural Invariant: External banking, grievance, legal vigilance, and national eSign interfaces are decoupled behind strict contract adapters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Bank Adapter */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center">
              <Landmark className="h-3.5 w-3.5 mr-1.5 text-aicte-blue" />
              Bank CBS Connector
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Automated reconciliation per FDR (Deterministic Clean, 10x Mismatch, Early Liquidation).
          </div>
        </div>

        {/* Grievance Adapter */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center">
              <FileCheck className="h-3.5 w-3.5 mr-1.5 text-amber-700" />
              Grievance Portal
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Active feed cross-referencing faculty salary arrears &amp; student fee refund liabilities.
          </div>
        </div>

        {/* Vigilance Adapter */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-indigo-700" />
              Vigilance &amp; Legal Cell
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Automated legal hold / administrative court stay verification for release gates.
          </div>
        </div>

        {/* eSign Adapter */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center">
              <Key className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
              National eSign Gateway
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
              Mocked
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Cryptographic SHA256-RSA digital signature synthesis for statutory release NOC issuance.
          </div>
        </div>

      </div>
    </div>
  );
};
