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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-400" /> Active
          </span>
        );
      case 'discrepancy_locked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-700 animate-pulse">
            <Lock className="w-3 h-3 mr-1 text-red-400" /> Discrepancy Lock
          </span>
        );
      case 'duplicate_flagged':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700">
            <Copy className="w-3 h-3 mr-1 text-amber-400" /> Duplicate Fingerprint
          </span>
        );
      case 'closed_early':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800">
            <AlertCircle className="w-3 h-3 mr-1 text-red-400" /> Closed Early
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
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
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Step 3: Bank Attested
          </span>
        );
      case 'document_checked':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            Step 2: Doc Checked
          </span>
        );
      case 'claimed':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            Step 1: Claimed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Institution Security Deposit Proof Objects
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Scanned FDRs treated as dynamic Proof Objects with cryptographic trust progression.
          </p>
        </div>

        {/* Institution selector tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {institutions.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInstId(inst.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedInstId === inst.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="text-left">
                <div className="font-semibold">{inst.name}</div>
                <div className="text-[10px] opacity-75 font-mono">{inst.region}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeInstitution && (
        <div className="space-y-6">
          
          {/* Institution Metadata Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Category &amp; Intake</span>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {activeInstitution.category}
              </div>
              <div className="text-xs font-mono text-teal-400 mt-0.5">
                {activeInstitution.intake} Approved Seats
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Annual Student Fee</span>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {formatRupees(activeInstitution.annual_fee)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">per student / annum</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Faculty Payroll Base</span>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {activeInstitution.faculty_count} Faculty
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Avg: {formatRupees(activeInstitution.avg_monthly_salary)} / mo
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Total Security Deposits</span>
              <div className="text-lg font-bold text-teal-300 mt-1 font-mono">
                {formatRupees(activeInstitution.total_fdr_principal)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {activeInstitution.fdrs.length} FDR records registered
              </div>
            </div>
          </div>

          {/* Open Liabilities Alert (Hero institution faculty arrears) */}
          {activeInstitution.liabilities.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 flex items-start space-x-3.5">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-amber-200">
                    Open Registered Liability: Faculty Salary Arrears
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-300 font-mono font-semibold">
                    {formatRupees(activeInstitution.liabilities[0].amount)}
                  </span>
                </div>
                <p className="text-xs text-amber-300/80 mt-1">
                  Active grievance on file for 5 Assistant Professors. This liability blocks final deposit release until verified cleared by AICTE Grievance Cell.
                </p>
              </div>
            </div>
          )}

          {/* Cross-Institution Duplicate Alert (Officer view only) */}
          {role !== 'INSTITUTION' && activeInstitution.fdrs.some(f => f.duplicate_count > 0) && (
            <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 flex items-start space-x-3.5">
              <BadgeAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-red-300">
                    Cross-Institution Duplicate Fingerprint Alert (Officer Confidential)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-900 text-red-200 font-mono font-semibold">
                    Collusion Risk Signal
                  </span>
                </div>
                <p className="text-xs text-red-200/90 mt-1">
                  A matching SHA-256 FDR fingerprint <code className="font-mono text-red-300">(Receipt + Bank + Branch)</code> has been uploaded across multiple distinct institutions. Institutions are isolated and cannot see each other's data.
                </p>
              </div>
            </div>
          )}

          {/* FDR List Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Landmark className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Fixed Deposit Receipts (FDRs)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {activeInstitution.fdrs.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">FDR Ref / Receipt</th>
                    <th className="py-3 px-4">Bank &amp; Branch</th>
                    <th className="py-3 px-4">Principal (Claim vs Bank)</th>
                    <th className="py-3 px-4">Tenure / Maturity</th>
                    <th className="py-3 px-4">Lien Clause</th>
                    <th className="py-3 px-4">Status &amp; Trust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeInstitution.fdrs.map((fdr) => {
                    const principalClaim = fdr.field_claims.find(c => c.field === 'principal');
                    const hasMismatch = principalClaim && principalClaim.bank_value && parseFloat(principalClaim.bank_value) !== fdr.principal;

                    return (
                      <tr key={fdr.id} className="hover:bg-slate-800/40 transition">
                        
                        {/* ID & Receipt */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100">{fdr.id}</div>
                          <div className="text-[11px] font-mono text-slate-400">{fdr.receipt_no}</div>
                          {role !== 'INSTITUTION' && fdr.duplicate_count > 0 && (
                            <div className="text-[10px] text-amber-400 font-bold mt-0.5 flex items-center">
                              <Copy className="h-2.5 w-2.5 mr-1" /> Duplicate Fingerprint ({fdr.duplicate_count})
                            </div>
                          )}
                        </td>

                        {/* Bank & Branch */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{fdr.bank}</div>
                          <div className="text-[11px] text-slate-400">{fdr.branch}</div>
                          <div className="text-[10px] font-mono text-slate-500">IFSC: {fdr.ifsc}</div>
                        </td>

                        {/* Principal (Dual Truth comparison) */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100 text-sm font-mono">
                            {formatRupees(fdr.principal)}
                          </div>
                          {hasMismatch && principalClaim && (
                            <div className="mt-1 p-1.5 rounded bg-red-950/80 border border-red-800 text-[10px] text-red-300 font-mono">
                              <span className="font-bold block text-red-200 font-sans">Core Banking Ledger:</span>
                              {formatRupees(parseFloat(principalClaim.bank_value!))} (10x mismatch!)
                            </div>
                          )}
                          {!hasMismatch && principalClaim?.trust_level === 'bank_confirmed' && (
                            <div className="text-[10px] text-emerald-400 flex items-center mt-0.5">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" /> CBS ledger matched
                            </div>
                          )}
                        </td>

                        {/* Tenure & Maturity */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-slate-300">Matures: {fdr.maturity_date}</div>
                          <div className="text-slate-500 text-[10px]">Issued: {fdr.issue_date}</div>
                          {fdr.id === 'FDR-APEX-003' && (
                            <div className="text-[10px] text-amber-400 mt-0.5 font-sans">
                              Scripted early closure at Day 200
                            </div>
                          )}
                        </td>

                        {/* Lien Clause */}
                        <td className="py-3.5 px-4">
                          {fdr.lien_clause_ok ? (
                            <span className="inline-flex items-center text-xs text-emerald-300 font-medium">
                              <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                              AICTE Lien Ok
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-amber-300 font-medium">
                              <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-400" />
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
