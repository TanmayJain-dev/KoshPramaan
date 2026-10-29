import React from 'react';
import { ShieldAlert, Server, GitCommit, Landmark } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-aicte-border bg-white text-aicte-subtext py-5 text-xs shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Honesty badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 border border-amber-300 text-amber-800">
            <ShieldAlert className="h-3 w-3 mr-1 text-amber-600" />
            Demo data, mocked integrations
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500">
            All bank connectors &amp; eSign are mocked behind strict adapter contracts.
          </span>
        </div>

        {/* Right: Technical specifications & Govt signature */}
        <div className="flex flex-wrap items-center gap-4 text-slate-500 font-mono text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Server className="h-3.5 w-3.5 text-aicte-blue" />
            <span>Clock-driven deterministic runtime</span>
          </div>
          <span className="text-slate-300 hidden md:inline">•</span>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <GitCommit className="h-3.5 w-3.5 text-emerald-600" />
            <span>SHA-256 Tamper-evident Chain</span>
          </div>
        </div>

      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
        <p>© 2026 All India Council for Technical Education (AICTE), Ministry of Education, Govt. of India. All Rights Reserved.</p>
        <p className="mt-1 sm:mt-0 font-sans">Designed for SIH 2026 • Live Statutory Surveillance</p>
      </div>
    </footer>
  );
};

