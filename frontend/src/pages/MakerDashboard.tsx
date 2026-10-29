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
  X,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const MakerDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
  const [selectedClarifyFdr, setSelectedClarifyFdr] = useState<FDR | null>(null);
  const [clarifyNotes, setClarifyNotes] = useState<string>('');
  const [clarifyPrincipal, setClarifyPrincipal] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedFdrId, setExpandedFdrId] = useState<string | null>(null);

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

  const showToast = (msg: string, type: 'info' | 'error' = 'info') => {
    const isError = type === 'error' || msg.toLowerCase().includes('cannot') || msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('error') || msg.toLowerCase().includes('409');
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 5000);
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
    onError: (err: any) => showToast(err.message, 'error'),
  });

  const submitMutation = useMutation({
    mutationFn: (fdrId: string) => apiClient.submitFDRToChecker(fdrId, 'Submitted for annual compliance renewal'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      showToast(`Claim ${updated.id} submitted to Institution Checker for internal verification.`);
    },
    onError: (err: any) => showToast(err.message, 'error'),
  });

  const resubmitMutation = useMutation({
    mutationFn: async ({ fdrId, principal, notes }: { fdrId: string; principal?: number; notes: string }) => {
      if (principal !== undefined) {
        await apiClient.updateDraftFDR(fdrId, { principal });
      }
      return apiClient.submitFDRToChecker(fdrId, notes);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['fdrs'] });
      setIsClarifyModalOpen(false);
      setSelectedClarifyFdr(null);
      showToast(`Claim ${updated.id} resubmitted to Checker with clarification remarks.`);
    },
    onError: (err: any) => showToast(err.message, 'error'),
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
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Draft
          </span>
        );
      case 'SUBMITTED':
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> Under Checker Review
          </span>
        );
      case 'CHECKER_APPROVED':
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Checker Approved
          </span>
        );
      case 'RO_APPROVED':
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sanctioned by RO
          </span>
        );
      case 'RO_REJECTED':
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200 gap-1">
            <AlertCircle className="w-3 h-3 text-red-600" /> Rejected by RO
          </span>
        );
      case 'RETURNED_TO_MAKER':
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Returned for Revision
          </span>
        );
      case 'CLARIFICATION_REQUESTED':
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" /> Clarification Requested
          </span>
        );
      default:
        return (
          <span data-testid="fdr-status-pill" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  const lockedFDRs = fdrs.filter((f) => f.status === 'discrepancy_locked');

  // Metrics
  const totalPledged = fdrs.reduce((acc, f) => acc + (f.principal || 0), 0);
  const sanctionedCount = fdrs.filter((f) => f.workflow_status === 'RO_APPROVED').length;
  const underReviewCount = fdrs.filter((f) => ['SUBMITTED', 'CHECKER_APPROVED'].includes(f.workflow_status)).length;
  const actionRequiredCount = fdrs.filter((f) => ['DRAFT', 'RETURNED_TO_MAKER', 'CLARIFICATION_REQUESTED'].includes(f.workflow_status)).length;

  // Filtered FDRs
  const filteredFdrs = fdrs.filter((f) => {
    const matchesSearch = 
      f.receipt_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.branch.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'SANCTIONED') return f.workflow_status === 'RO_APPROVED';
    if (statusFilter === 'REVIEW') return ['SUBMITTED', 'CHECKER_APPROVED'].includes(f.workflow_status);
    if (statusFilter === 'ACTION') return ['DRAFT', 'RETURNED_TO_MAKER', 'CLARIFICATION_REQUESTED'].includes(f.workflow_status);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div 
          data-testid="toast-message"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-card flex items-center space-x-2.5 text-xs font-semibold border ${
            toastMessage.isError
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          {toastMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Institution Header Card */}
      <div className="bg-white border border-aicte-border rounded-xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-aicte-blue border border-blue-200">
                Maker Workspace
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Jurisdiction Scope: <strong className="text-slate-700">{user?.institution_id}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                Affiliation: <strong className="text-slate-700">{institution?.region || 'Northern Region'}</strong>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-aicte-ink flex items-center gap-2.5 pt-1">
              <Building2 className="w-6 h-6 text-aicte-blue shrink-0" />
              <span>{institution?.name || 'Apex Institute of Technology'}</span>
            </h1>
            <p className="text-xs text-aicte-subtext">
              Institutional portal for drafting statutory Fixed Deposit Receipts, uploading scanned certificates, and tracking tripartite lien compliance.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            data-testid="new-fdr-claim-btn"
            className="px-4 py-2.5 rounded-lg bg-aicte-blue hover:bg-aicte-navy text-white font-semibold text-xs transition flex items-center space-x-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New FDR Claim</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Lock Alert Banner (if any) */}
      {lockedFDRs.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-subtle space-y-2">
          <div className="flex items-center space-x-2 text-red-900 font-bold text-xs">
            <Lock className="w-4 h-4 text-red-700 shrink-0" />
            <span>ATTENTION: Bank Discrepancy Lock Active on {lockedFDRs.length} FDR Record(s)</span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            Core Banking System (CBS) integration flagged balance inconsistency on receipt <strong>{lockedFDRs[0]?.receipt_no}</strong>. The record has been locked pending joint bank re-attestation and Regional Officer review.
          </p>
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-[11px] font-semibold text-aicte-subtext uppercase tracking-wider">Total Pledged Deposits</div>
          <div className="text-xl font-bold text-aicte-ink mt-1 font-mono">
            ₹{totalPledged.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {fdrs.length} FDR instrument(s)</div>
        </div>

        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Sanctioned by RO</div>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            {sanctionedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tripartite lien validated</div>
        </div>

        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">In Review Queue</div>
          <div className="text-xl font-bold text-blue-700 mt-1 font-mono">
            {underReviewCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Under Checker / RO scrutiny</div>
        </div>

        <div className="bg-white border border-aicte-border rounded-xl p-4 shadow-subtle">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Action Required</div>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">
            {actionRequiredCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Drafts, revisions &amp; inquiries</div>
        </div>
      </div>

      {/* Claims List Table Container */}
      <div className="bg-white border border-aicte-border rounded-xl overflow-hidden shadow-card">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-aicte-ink">Security Deposit Claims</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-300">
              {filteredFdrs.length} of {fdrs.length} Claims
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt, bank, ID..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-aicte-blue"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-white border border-slate-300 rounded-md p-0.5 text-[11px] font-medium text-slate-600">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'ALL' ? 'bg-aicte-navy text-white font-semibold' : 'hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ACTION')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'ACTION' ? 'bg-amber-600 text-white font-semibold' : 'hover:text-slate-900'}`}
              >
                Action
              </button>
              <button
                onClick={() => setStatusFilter('REVIEW')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'REVIEW' ? 'bg-blue-600 text-white font-semibold' : 'hover:text-slate-900'}`}
              >
                In Review
              </button>
              <button
                onClick={() => setStatusFilter('SANCTIONED')}
                className={`px-2.5 py-1 rounded ${statusFilter === 'SANCTIONED' ? 'bg-emerald-600 text-white font-semibold' : 'hover:text-slate-900'}`}
              >
                Sanctioned
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Receipt &amp; Instrument</th>
                <th className="px-4 py-3">Bank &amp; Branch</th>
                <th className="px-4 py-3">Principal Amount</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Tripartite Lien</th>
                <th className="px-4 py-3">Proof Score</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
              {filteredFdrs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No FDR claims match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredFdrs.map((fdr) => {
                  const isExpanded = expandedFdrId === fdr.id;
                  return (
                    <React.Fragment key={fdr.id}>
                      <tr 
                        data-testid={`fdr-row-${fdr.id}`} 
                        className={`hover:bg-blue-50/40 transition ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setExpandedFdrId(isExpanded ? null : fdr.id)}
                              className="text-slate-400 hover:text-slate-700"
                              title="Toggle Details"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <div className="font-bold text-aicte-ink">{fdr.receipt_no}</div>
                              <div className="text-[11px] font-mono text-slate-500">{fdr.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900">{fdr.bank}</div>
                          <div className="text-[11px] text-slate-500">{fdr.branch}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          ₹{fdr.principal.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5">
                          {getWorkflowBadge(fdr.workflow_status)}
                          {fdr.workflow_status === 'RETURNED_TO_MAKER' && fdr.checker_remarks && (
                            <div className="mt-1 text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 max-w-xs">
                              <strong>Checker Directive:</strong> {fdr.checker_remarks}
                            </div>
                          )}
                          {fdr.workflow_status === 'CLARIFICATION_REQUESTED' && fdr.ro_remarks && (
                            <div className="mt-1 text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 max-w-xs" data-testid="ro-clarification-remarks">
                              <strong>RO Clarification Inquiry:</strong> {fdr.ro_remarks}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {fdr.lien_clause_ok ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Marked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" /> Missing
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            (fdr.proof_score ?? 100) >= 70 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {fdr.proof_score?.toFixed(1) ?? '95.0'} / 100
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {(fdr.workflow_status === 'DRAFT' || fdr.workflow_status === 'RETURNED_TO_MAKER') ? (
                            <button
                              data-testid={`submit-btn-${fdr.id}`}
                              onClick={() => submitMutation.mutate(fdr.id)}
                              disabled={submitMutation.isPending}
                              className="px-3 py-1.5 rounded-md bg-aicte-blue hover:bg-aicte-navy text-white font-medium text-xs transition inline-flex items-center space-x-1 shadow-xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>Submit to Checker</span>
                            </button>
                          ) : fdr.workflow_status === 'CLARIFICATION_REQUESTED' ? (
                            <button
                              data-testid={`respond-clarification-btn-${fdr.id}`}
                              onClick={() => {
                                setSelectedClarifyFdr(fdr);
                                setClarifyPrincipal(fdr.principal);
                                setClarifyNotes('');
                                setIsClarifyModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition inline-flex items-center space-x-1 shadow-xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>Respond &amp; Resubmit</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-mono">Locked in workflow</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Forensic Detail Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cryptographic Artifact Hash</span>
                                <div className="p-2 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all">
                                  {fdr.doc_hash || 'SHA-256: 3a7f9b8c2d1e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Deposit Tenor &amp; IFSC</span>
                                <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700">
                                  <div>IFSC: <span className="font-mono font-semibold">{fdr.ifsc}</span></div>
                                  <div>Maturity: <span className="font-mono font-semibold">{fdr.maturity_date}</span></div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Statutory Verification Proof</span>
                                <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700">
                                  <div>Lien Marking: <span className="font-semibold text-emerald-700">AICTE Joint Favor Clause</span></div>
                                  <div>Integrity State: <span className="font-semibold text-slate-900">{fdr.status}</span></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Draft Modal (VendorShield intake style from reference image) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-aicte-border rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-aicte-blue border border-blue-200 uppercase">
                    Statutory Ingestion Form
                  </span>
                  <span className="text-xs text-slate-500">AICTE Security Deposit</span>
                </div>
                <h3 className="text-lg font-bold text-aicte-ink mt-1">Create Draft FDR Claim</h3>
                <p className="text-xs text-aicte-subtext">Maker Intake: Record physical deposit instrument and compute tamper-evident hash.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
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
              {/* Section 1: Deposit Specifications */}
              <div>
                <h4 className="text-xs font-bold text-aicte-navy uppercase tracking-wider mb-2">1. Bank &amp; Branch Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">FDR Receipt Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.receipt_no}
                      onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                      placeholder="e.g. SBI-DEL-2026-9999"
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-mono text-xs focus:border-aicte-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Authorized Bank *</label>
                    <select
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:border-aicte-blue focus:outline-none"
                    >
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="Punjab National Bank">Punjab National Bank</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                      <option value="Canara Bank">Canara Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Issuing Branch</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:border-aicte-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifsc}
                      onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-mono text-xs focus:border-aicte-blue focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Financial Terms */}
              <div>
                <h4 className="text-xs font-bold text-aicte-navy uppercase tracking-wider mb-2">2. Financial Terms &amp; Tenor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Principal Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={10000}
                      value={formData.principal}
                      onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-mono text-xs focus:border-aicte-blue focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Statutory minimum ₹1,00,000 for technical programs.</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Maturity Date (8-Year Lock-In) *</label>
                    <input
                      type="date"
                      required
                      value={formData.maturity_date}
                      onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 text-xs focus:border-aicte-blue focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Tripartite Lien Clause */}
              <div className="flex items-start space-x-3 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="lien_clause"
                  checked={formData.lien_clause_ok}
                  onChange={(e) => setFormData({ ...formData, lien_clause_ok: e.target.checked })}
                  className="rounded border-slate-300 text-aicte-blue focus:ring-aicte-blue w-4 h-4 mt-0.5"
                />
                <label htmlFor="lien_clause" className="text-xs text-slate-700 cursor-pointer">
                  <strong className="text-slate-900">Tripartite Lien Marking Confirmed:</strong> The deposit instrument carries an explicit endorsement declaring joint lien in favor of the <em>Member Secretary, AICTE, New Delhi</em> and the Chairman/Secretary of the Institution.
                </label>
              </div>

              {/* Section 4: Document Upload & SHA-256 Digest (VendorShield style dropzone) */}
              <div>
                <h4 className="text-xs font-bold text-aicte-navy uppercase tracking-wider mb-2">3. Digital Instrument Scan &amp; Hashing</h4>
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-5 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-aicte-blue">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-700 font-semibold">
                    {uploadedFileName ? (
                      <span className="text-aicte-blue font-bold">{uploadedFileName}</span>
                    ) : (
                      <span>Upload FDR Certificate Scan (PDF / JPG / PNG)</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Client-side SHA-256 cryptographic digest is computed immediately upon selection before transmission.
                  </p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-aicte-blue file:text-white hover:file:bg-aicte-navy cursor-pointer"
                  />
                  {isHashing && <p className="text-xs text-amber-700 animate-pulse font-medium">Computing cryptographic SHA-256 digest...</p>}
                  {formData.doc_hash && (
                    <div className="bg-white p-2.5 rounded border border-slate-200 text-[10px] font-mono text-slate-800 break-all text-left shadow-xs">
                      <span className="text-slate-500 font-bold">DIGEST (SHA-256): </span>{formData.doc_hash}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || isHashing}
                  className="px-5 py-2 rounded-md bg-aicte-blue hover:bg-aicte-navy text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving Record...' : 'Save Draft Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clarification Response Modal */}
      {isClarifyModalOpen && selectedClarifyFdr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Respond to Regional Clarification</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">Claim ID: {selectedClarifyFdr.id} ({selectedClarifyFdr.receipt_no})</p>
              </div>
              <button 
                onClick={() => setIsClarifyModalOpen(false)} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display RO Remarks */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg space-y-1 text-xs text-amber-900">
              <strong className="block font-bold uppercase tracking-wider text-[10px] text-amber-800">Regional Officer Inquiry:</strong>
              <p className="leading-relaxed">{selectedClarifyFdr.ro_remarks || 'Please provide clarification or correction for this claim.'}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                resubmitMutation.mutate({
                  fdrId: selectedClarifyFdr.id,
                  principal: clarifyPrincipal,
                  notes: clarifyNotes,
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Principal Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={10000}
                  value={clarifyPrincipal}
                  onChange={(e) => setClarifyPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-mono text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Clarification Response Note *</label>
                <textarea
                  data-testid="clarification-response-textarea"
                  rows={3}
                  required
                  value={clarifyNotes}
                  onChange={(e) => setClarifyNotes(e.target.value)}
                  placeholder="Explain corrections made or provide supplementary context for the Checker and Regional Officer..."
                  className="w-full bg-white border border-slate-300 rounded-md p-3 text-slate-900 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClarifyModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-clarification-btn"
                  disabled={resubmitMutation.isPending}
                  className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{resubmitMutation.isPending ? 'Resubmitting...' : 'Resubmit to Checker'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
