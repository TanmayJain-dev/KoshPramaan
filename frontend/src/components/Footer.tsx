import React from 'react';
import { ShieldAlert, Server, GitCommit } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 text-slate-400 py-6 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Honesty badge */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-950/50 border border-amber-800/60 text-amber-300">
            <ShieldAlert className="h-3 w-3 mr-1 text-amber-400" />
            Demo data, mocked integrations
          </span>
          <span className="text-slate-500">•</span>
          <span>All bank connectors &amp; eSign are mocked behind strict adapter contracts.</span>
        </div>

        {/* Right: Technical specifications */}
        <div className="flex items-center space-x-4 text-slate-500 font-mono text-[11px]">
          <div className="flex items-center space-x-1">
            <Server className="h-3 w-3 text-teal-400" />
            <span>Clock-driven deterministic runtime</span>
          </div>
          <div className="flex items-center space-x-1">
            <GitCommit className="h-3 w-3 text-blue-400" />
            <span>SHA-256 Tamper-evident Audit Chain</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
