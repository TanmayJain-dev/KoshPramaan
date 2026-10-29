import React from 'react';
import { RuleItem } from '../types';
import { Sliders, CheckCircle2, History, Shield, ChevronRight, Code } from 'lucide-react';

interface RulesRegistryProps {
  rules: RuleItem[];
}

export const RulesRegistry: React.FC<RulesRegistryProps> = ({ rules }) => {
  const formatKeyName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatValue = (val: any): string => {
    if (typeof val === 'number') {
      if (val >= 10000) {
        return `₹${val.toLocaleString('en-IN')}`;
      }
      return val.toString();
    }
    if (typeof val === 'boolean') {
      return val ? 'Enabled (True)' : 'Disabled (False)';
    }
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
    }
    return String(val);
  };

  return (
    <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <Sliders className="h-5 w-5 text-aicte-blue" />
          <div>
            <h3 className="text-sm font-bold text-aicte-ink">
              Versioned Statutory Policy &amp; Regulatory Parameters Table
            </h3>
            <p className="text-xs text-aicte-subtext">
              Zero hardcoded thresholds: Proof-score half-lives, statutory deposit schedules, SLA timers, and release gates are dynamically version-governed.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 shrink-0">
          Statutory Schedule: AY 2026-27 (v1)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => {
          const isObject = typeof rule.value === 'object' && rule.value !== null && !Array.isArray(rule.value);
          const entries = isObject ? Object.entries(rule.value) : [];

          return (
            <div key={rule.key} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                {/* Rule Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-bold text-xs text-aicte-ink block">
                      {formatKeyName(rule.key)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      key: {rule.key}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-aicte-blue border border-blue-200 shrink-0">
                    v{rule.version}
                  </span>
                </div>

                {/* Formatted Parameter Rows */}
                {isObject ? (
                  <div className="space-y-1.5 bg-white p-2.5 rounded border border-slate-200 text-xs">
                    {entries.map(([paramKey, paramVal]) => (
                      <div key={paramKey} className="flex items-baseline justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 font-medium capitalize">
                          {paramKey.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-right">
                          {formatValue(paramVal)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-2.5 rounded border border-slate-200 text-xs font-mono font-bold text-slate-900">
                    {formatValue(rule.value)}
                  </div>
                )}

                {/* Expandable Technical Raw JSON View */}
                <details className="text-[11px] group">
                  <summary className="cursor-pointer text-slate-500 hover:text-aicte-blue flex items-center justify-between font-sans text-[11px] font-medium select-none">
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3 text-slate-400 group-open:text-aicte-blue" />
                      <span>Inspect Raw JSON Payload</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <pre className="mt-2 text-[10px] font-mono text-slate-800 bg-white p-2.5 rounded border border-slate-200 overflow-x-auto max-h-40 shadow-inner">
                    {JSON.stringify(rule.value, null, 2)}
                  </pre>
                </details>
              </div>

              {/* Rule Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Effective: AY {rule.effective_year}</span>
                <span className="flex items-center text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Live in Policy Engine
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
