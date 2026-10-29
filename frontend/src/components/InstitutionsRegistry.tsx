import React, { useState } from 'react';
import { Institution, FDR, UserRole } from '../types';
import { 
  Building2, 
  Landmark, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Copy, 
  HelpCircle,
  FileText,
  AlertTriangle,
  BadgeAlert
} from 'lucide-react';

interface InstitutionsRegistryProps {
  institutions: Institution[];
  role: UserRole;
}

export const InstitutionsRegistry: React.FC<InstitutionsRegistryProps> = ({ institutions, role }) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || 'INST-001');

  const activeInstitution = institutions.find((inst) => inst.id === selectedInstId) || institutions[0];

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: FDR['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> Active
          </span>
        );
      case 'discrepancy_locked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-300">
            <Lock className="w-3 h-3 mr-1 text-red-600" /> Discrepancy Lock
          </span>
        );
      case 'duplicate_flagged':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Copy className="w-3 h-3 mr-1 text-amber-600" /> Duplicate Fingerprint
          </span>
        );
      case 'closed_early':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-300">
            <AlertCircle className="w-3 h-3 mr-1 text-red-600" /> Closed Early
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  const getTrustLadderPill = (trustLevel: string) => {
    switch (trustLevel) {
      case 'bank_confirmed':
      case 'reverified':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Step 3: Bank Attested
          </span>
        );
      case 'document_checked':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Step 2: Doc Checked
          </span>
        );
      case 'claimed':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            Step 1: Claimed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-aicte-blue" />
            <h2 className="text-base font-bold text-aicte-ink">
              Institutional Statutory Security Deposit Proof Objects
            </h2>
          </div>
          <p className="text-xs text-aicte-subtext">
            Scanned FDRs treated as dynamic Proof Objects with cryptographic trust progression and live bank reconciliation.
          </p>
        </div>

        {/* Institution selector tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {institutions.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInstId(inst.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                selectedInstId === inst.id
                  ? 'bg-aicte-navy text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <div className="text-left">
                <div>{inst.name}</div>
                <div className="text-[10px] opacity-80 font-mono">{inst.region}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeInstitution && (
        <div className="space-y-5">
          
          {/* Institution Metadata Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs text-aicte-subtext font-semibold uppercase tracking-wider text-[10px]">Category &amp; Intake</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {activeInstitution.category}
              </div>
              <div className="text-xs font-mono text-aicte-blue mt-0.5 font-medium">
                {activeInstitution.intake} Approved Seats
              </div>
            </div>

            <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs text-aicte-subtext font-semibold uppercase tracking-wider text-[10px]">Annual Student Fee</span>
              <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                {formatRupees(activeInstitution.annual_fee)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">per student / annum</div>
            </div>

            <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs text-aicte-subtext font-semibold uppercase tracking-wider text-[10px]">Faculty Payroll Base</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {activeInstitution.faculty_count} Faculty
              </div>
              <div className="text-xs font-mono text-slate-600 mt-0.5">
                Avg: {formatRupees(activeInstitution.avg_monthly_salary)} / mo
              </div>
            </div>

            <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs text-aicte-subtext font-semibold uppercase tracking-wider text-[10px]">Total Security Deposits</span>
              <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                {formatRupees(activeInstitution.total_fdr_principal)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {activeInstitution.fdrs.length} FDR records registered
              </div>
            </div>
          </div>

          {/* Open Liabilities Alert */}
          {activeInstitution.liabilities.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start space-x-3.5 shadow-subtle">
              <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Open Registered Liability: Faculty Salary Arrears
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300">
                    {formatRupees(activeInstitution.liabilities[0].amount)}
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1">
                  Active grievance on file for 5 Assistant Professors. This liability blocks final deposit release until verified cleared by AICTE Grievance Cell.
                </p>
              </div>
            </div>
          )}

          {/* Cross-Institution Duplicate Alert (Officer view only) */}
          {role !== 'INSTITUTION_MAKER' && role !== 'INSTITUTION_CHECKER' && activeInstitution.fdrs.some(f => f.duplicate_count > 0) && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start space-x-3.5 shadow-subtle">
              <BadgeAlert className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                    Cross-Institution Duplicate Fingerprint Alert (Officer Confidential)
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-900 font-mono font-bold border border-red-300">
                    Risk Signal, Needs Officer Review
                  </span>
                </div>
                <p className="text-xs text-red-900 mt-1">
                  A matching SHA-256 FDR fingerprint <code className="font-mono text-red-800 font-bold">(Receipt + Bank + Branch)</code> has been uploaded across multiple distinct institutions. Institutions are isolated and cannot see each other's data.
                </p>
              </div>
            </div>
          )}

          {/* FDR List Table */}
          <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <Landmark className="h-4 w-4 text-aicte-blue" />
                <h3 className="text-sm font-bold text-aicte-ink">
                  Fixed Deposit Receipts (FDRs)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300">
                {activeInstitution.fdrs.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">FDR Ref / Receipt</th>
                    <th className="py-3 px-4">Bank &amp; Branch</th>
                    <th className="py-3 px-4">Principal (Claim vs Bank)</th>
                    <th className="py-3 px-4">Tenure / Maturity</th>
                    <th className="py-3 px-4">Lien Clause</th>
                    <th className="py-3 px-4">Status &amp; Trust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {activeInstitution.fdrs.map((fdr) => {
                    const principalClaim = fdr.field_claims.find(c => c.field === 'principal');
                    const hasMismatch = principalClaim && principalClaim.bank_value && parseFloat(principalClaim.bank_value) !== fdr.principal;

                    return (
                      <tr key={fdr.id} className="hover:bg-slate-50/70 transition">
                        
                        {/* ID & Receipt */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-aicte-ink">{fdr.id}</div>
                          <div className="text-[11px] font-mono text-slate-500">{fdr.receipt_no}</div>
                          {role !== 'INSTITUTION_MAKER' && role !== 'INSTITUTION_CHECKER' && fdr.duplicate_count > 0 && (
                            <div className="text-[10px] text-amber-800 font-bold mt-0.5 flex items-center">
                              <Copy className="h-2.5 w-2.5 mr-1 text-amber-600" /> Duplicate Fingerprint ({fdr.duplicate_count})
                            </div>
                          )}
                        </td>

                        {/* Bank & Branch */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{fdr.bank}</div>
                          <div className="text-[11px] text-slate-500">{fdr.branch}</div>
                          <div className="text-[10px] font-mono text-slate-500">IFSC: {fdr.ifsc}</div>
                        </td>

                        {/* Principal (Dual Truth comparison) */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm font-mono">
                            {formatRupees(fdr.principal)}
                          </div>
                          {hasMismatch && principalClaim && (
                            <div className="mt-1 p-1.5 rounded bg-red-50 border border-red-300 text-[10px] text-red-900 font-mono">
                              <span className="font-bold block text-red-800 font-sans">Core Banking Ledger:</span>
                              {formatRupees(parseFloat(principalClaim.bank_value!))} (10x mismatch!)
                            </div>
                          )}
                          {!hasMismatch && principalClaim?.trust_level === 'bank_confirmed' && (
                            <div className="text-[10px] text-emerald-700 font-semibold flex items-center mt-0.5">
                              <CheckCircle className="h-2.5 w-2.5 mr-1 text-emerald-600" /> CBS ledger matched
                            </div>
                          )}
                        </td>

                        {/* Tenure & Maturity */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-slate-800">Matures: {fdr.maturity_date}</div>
                          <div className="text-slate-500 text-[10px]">Issued: {fdr.issue_date}</div>
                          {fdr.id === 'FDR-APEX-003' && (
                            <div className="text-[10px] text-amber-700 mt-0.5 font-sans font-medium">
                              Scripted early closure at Day 200
                            </div>
                          )}
                        </td>

                        {/* Lien Clause */}
                        <td className="py-3.5 px-4">
                          {fdr.lien_clause_ok ? (
                            <span className="inline-flex items-center text-xs text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              AICTE Lien Ok
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                              Missing Clause
                            </span>
                          )}
                        </td>

                        {/* Status & Trust Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-1.5 items-start">
                            {getStatusBadge(fdr.status)}
                            {principalClaim && getTrustLadderPill(principalClaim.trust_level)}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
