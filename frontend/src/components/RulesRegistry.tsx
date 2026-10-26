import React from 'react';
import { RuleItem } from '../types';
import { Sliders, CheckCircle2, History, Shield } from 'lucide-react';

interface RulesRegistryProps {
  rules: RuleItem[];
}

export const RulesRegistry: React.FC<RulesRegistryProps> = ({ rules }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <Sliders className="h-5 w-5 text-teal-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Versioned Policy &amp; Regulatory Rules Table
            </h3>
            <p className="text-xs text-slate-400">
              Zero hardcoded parameters. All half-lives, bases, penalties, SLAs, and deposit schedules are dynamically version-governed.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-teal-300 border border-slate-700">
          Effective Year: 2026 (v1)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div key={rule.key} className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-blue-300">
                  {rule.key}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
                  v{rule.version}
                </span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800/80 overflow-x-auto max-h-48">
                {JSON.stringify(rule.value, null, 2)}
              </pre>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Effective: AY {rule.effective_year}</span>
              <span className="flex items-center text-teal-400">
                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Active in Engine
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
