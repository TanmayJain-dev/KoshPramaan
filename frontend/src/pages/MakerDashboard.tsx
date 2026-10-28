import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuth } from '../context/AuthContext';
import { FDR, FDRCreateData } from '../types';
import { 
  Building2, 
  Plus, 
  Send, 
  FileCheck, 
  Upload, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileText,
  Hash,
  Landmark,
  X
} from 'lucide-react';

export const MakerDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<FDRCreateData>({
    receipt_no: '',
    bank: 'State Bank of India',
    branch: 'Main Branch New Delhi',
    ifsc: 'SBIN0000691',
    principal: 500000,
    issue_date: '2026-04-01',
    maturity_date: '2034-04-01',
    lien_clause_ok: true,
    doc_hash: '',
  });
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const { data: fdrs = [], isLoading } = useQuery({
    queryKey: ['fdrs', user?.role, user?.institution_id],
    queryFn: () => apiClient.getFDRs(),
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institution', user?.institution_id],
    queryFn: () => apiClient.getInstitutions(user?.institution_id || undefined),
  });

  const institution = institutions[0];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FDRCreateData) => apiClient.createDraftFDR(data),
    onSuccess: (newFdr) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      setIsCreateModalOpen(false);
      setFormData({
        receipt_no: '',
        bank: 'State Bank of India',
        branch: 'Main Branch New Delhi',
        ifsc: 'SBIN0000691',
        principal: 500000,
        issue_date: '2026-04-01',
        maturity_date: '2034-04-01',
        lien_clause_ok: true,
        doc_hash: '',
      });
      setUploadedFileName('');
      showToast(`Draft claim ${newFdr.id} created successfully! You can now forward it to the Checker.`);
    },
    onError: (err: any) => showToast(err.message),
  });

  const submitMutation = useMutation({
    mutationFn: (fdrId: string) => apiClient.submitFDRToChecker(fdrId, 'Submitted for annual compliance renewal'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      showToast(`Claim ${updated.id} submitted to Institution Checker for internal verification.`);
    },
    onError: (err: any) => showToast(err.message),
  });

  // Client-side SHA-256 calculation for upload dropzone
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsHashing(true);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFormData((prev) => ({ ...prev, doc_hash: hashHex }));
    } catch (err) {
      console.error('Hashing failed:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const getWorkflowBadge = (status: FDR['workflow_status']) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">Draft</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Under Checker Review</span>;
      case 'CHECKER_APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Checker Approved</span>;
      case 'RO_APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sanctioned by RO</span>;
      case 'RO_REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-800">Rejected by RO</span>;
      case 'RETURNED_TO_MAKER':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Returned for Revision</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const lockedFDRs = fdrs.filter((f) => f.status === 'discrepancy_locked');

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-teal-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Institution Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                Maker Workspace
              </span>
              <span className="text-xs text-slate-400 font-mono">Isolated Scope: {user?.institution_id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <span>{institution?.name || 'Apex Institute of Technology'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Affiliated Region: <span className="text-slate-200 font-medium">{institution?.region || 'Northern Region'}</span> • Total FDRs: <span className="text-slate-200 font-medium">{fdrs.length}</span>
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition flex items-center space-x-2 shadow-lg shadow-teal-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>New FDR Claim</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Lock Alert Banner (if any) */}
      {lockedFDRs.length > 0 && (
        <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2.5 text-red-300 font-bold text-sm">
            <Lock className="w-5 h-5 text-red-400" />
            <span>ATTENTION: Bank Discrepancy Lock Active on {lockedFDRs.length} FDR Record(s)</span>
          </div>
          <p className="text-xs text-red-200/90 leading-relaxed">
            State Bank of India Core Banking System (CBS) reported a balance mismatch on receipt <strong>{lockedFDRs[0]?.receipt_no}</strong>. Deposit has been locked by regulatory authorities pending bank re-attestation.
          </p>
        </div>
      )}

      {/* Claims List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Security Deposit Claims</h2>
            <p className="text-xs text-slate-400">View and manage claims under Maker preparation</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {fdrs.length} Record(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">FDR ID / Receipt</th>
                <th className="px-6 py-3.5">Bank &amp; Branch</th>
                <th className="px-6 py-3.5">Principal</th>
                <th className="px-6 py-3.5">Workflow Status</th>
                <th className="px-6 py-3.5">Tripartite Lien</th>
                <th className="px-6 py-3.5">Proof Score</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {fdrs.map((fdr) => (
                <tr key={fdr.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{fdr.receipt_no}</div>
                    <div className="text-[11px] font-mono text-slate-400">{fdr.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{fdr.bank}</div>
                    <div className="text-[11px] text-slate-400">{fdr.branch}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-teal-300">
                    ₹{fdr.principal.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    {getWorkflowBadge(fdr.workflow_status)}
                    {fdr.workflow_status === 'RETURNED_TO_MAKER' && fdr.checker_remarks && (
                      <div className="mt-1 text-[11px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-900/60 max-w-xs">
                        <strong>Checker Note:</strong> {fdr.checker_remarks}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {fdr.lien_clause_ok ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marked
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (fdr.proof_score ?? 100) >= 70 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {fdr.proof_score?.toFixed(1) ?? '95.0'} / 100
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {(fdr.workflow_status === 'DRAFT' || fdr.workflow_status === 'RETURNED_TO_MAKER') ? (
                      <button
                        onClick={() => submitMutation.mutate(fdr.id)}
                        disabled={submitMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition inline-flex items-center space-x-1 shadow-md shadow-blue-900/40"
                      >
                        <Send className="w-3 h-3" />
                        <span>Submit to Checker</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">Locked in workflow</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Draft Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Create Draft FDR Claim</h3>
                <p className="text-xs text-slate-400">Maker Entry: Scanned FDR &amp; Metadata</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">FDR Receipt Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.receipt_no}
                    onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                    placeholder="e.g. SBI-DEL-2026-9999"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Bank Name *</label>
                  <select
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Canara Bank">Canara Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Principal Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Maturity Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.maturity_date}
                    onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tripartite Lien Clause */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  id="lien_clause"
                  checked={formData.lien_clause_ok}
                  onChange={(e) => setFormData({ ...formData, lien_clause_ok: e.target.checked })}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="lien_clause" className="text-xs text-slate-300 cursor-pointer">
                  <strong>Tripartite Lien Clause Present:</strong> Deposit explicitly lien-marked in joint favor of AICTE &amp; Institution.
                </label>
              </div>

              {/* Document Upload & Client-Side SHA-256 Dropzone */}
              <div className="bg-slate-950/80 border-2 border-dashed border-slate-700 rounded-xl p-4 text-center space-y-2">
                <Upload className="w-6 h-6 text-teal-400 mx-auto" />
                <div className="text-xs text-slate-300 font-medium">
                  {uploadedFileName ? (
                    <span className="text-teal-300 font-semibold">{uploadedFileName}</span>
                  ) : (
                    <span>Upload FDR Certificate Scan (PDF / JPG / PNG)</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Client-side SHA-256 cryptographic digest is computed immediately upon selection.
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700 cursor-pointer"
                />
                {isHashing && <p className="text-xs text-amber-400 animate-pulse">Calculating SHA-256 hash...</p>}
                {formData.doc_hash && (
                  <div className="bg-slate-900 p-2 rounded text-[10px] font-mono text-teal-400 break-all text-left border border-slate-800">
                    <span className="text-slate-400">SHA-256: </span>{formData.doc_hash}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || isHashing}
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-900/30"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Draft Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
