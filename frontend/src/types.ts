export type UserRole =
  | 'INSTITUTION_MAKER'
  | 'INSTITUTION_CHECKER'
  | 'REGIONAL_OFFICER'
  | 'SCRUTINY_OFFICER'
  | 'BANK_VERIFIER'
  | 'AICTE_ADMIN';

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CHECKER_APPROVED'
  | 'RO_APPROVED'
  | 'RO_REJECTED'
  | 'CLARIFICATION_REQUESTED'
  | 'RETURNED_TO_MAKER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  institution_id?: string | null;
  institution_name?: string | null;
  region?: string | null;
  bank?: string | null;
  verifier_id?: string | null;
  name: string;
  email: string;
}

export interface DemoUser {
  id: string;
  username: string;
  role: UserRole;
  institution_id?: string | null;
  institution_name?: string | null;
  region?: string | null;
  bank?: string | null;
  verifier_id?: string | null;
  name: string;
  email: string;
  persona_title: string;
  persona_description: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ClockState {
  current_time_iso: string;
  days_elapsed: number;
  base_time_iso: string;
  advanced_by?: number;
}

export interface AuditVerify {
  valid: boolean;
  broken_index: number | null;
  chain_position: number | null;
  total_events: number;
  latest_hash: string | null;
  expected_prev_hash?: string;
  recorded_prev_hash?: string;
  computed_hash?: string;
  recorded_hash?: string;
  message?: string;
}

export interface AuditEvent {
  id: number;
  ts_sim: string;
  actor: string;
  role: string;
  action: string;
  payload: Record<string, any>;
  prev_hash: string;
  hash: string;
}

export interface FieldClaim {
  id: number;
  field: string;
  claimed_value: string;
  bank_value: string | null;
  trust_level: 'claimed' | 'document_checked' | 'bank_confirmed' | 'reverified';
  verified_at: string | null;
  source: string;
}

export interface FDR {
  id: string;
  institution_id: string;
  institution_name?: string;
  receipt_no: string;
  parent_receipt_id: string | null;
  bank: string;
  branch: string;
  ifsc: string;
  principal: number;
  issue_date: string;
  maturity_date: string;
  lien_clause_ok: boolean;
  status: 'active' | 'closed_early' | 'matured' | 'discrepancy_locked' | 'returned_for_correction' | 'duplicate_flagged';
  workflow_status: WorkflowStatus;
  created_by?: string | null;
  checked_by?: string | null;
  checker_remarks?: string | null;
  ro_by?: string | null;
  ro_remarks?: string | null;
  submitted_at?: string | null;
  checked_at?: string | null;
  ro_action_at?: string | null;
  proof_score?: number | null;
  fingerprint: string;
  doc_hash: string | null;
  field_claims: FieldClaim[];
  duplicate_count: number;
}

export interface Liability {
  id: string;
  institution_id: string;
  kind: 'grievance' | 'arrears' | 'refund';
  amount: number;
  status: 'open' | 'resolved' | 'disputed';
}

export interface Institution {
  id: string;
  name: string;
  region: string;
  category: string;
  intake: number;
  annual_fee: number;
  faculty_count: number;
  avg_monthly_salary: number;
  exempt: boolean;
  trust_id: string | null;
  fdrs: FDR[];
  liabilities: Liability[];
  total_fdr_principal: number;
}

export interface RuleItem {
  key: string;
  value: Record<string, any>;
  effective_year: number;
  version: number;
}

export interface DemoStatus {
  system: string;
  phase: string;
  honesty_badge: string;
  clock: ClockState;
  audit_chain: AuditVerify;
  counts: {
    institutions: number;
    fdrs: number;
    verifiers: number;
    users?: number;
    liabilities?: number;
  };
  adapters: {
    bank: Record<string, any>;
    grievance: Record<string, any>;
    vigilance: Record<string, any>;
    esign: Record<string, any>;
  };
}

export interface FDRCreateData {
  receipt_no: string;
  bank: string;
  branch: string;
  ifsc: string;
  principal: number;
  issue_date: string;
  maturity_date: string;
  lien_clause_ok: boolean;
  doc_hash?: string;
}

export interface DuplicateInstitution {
  institution_id: string;
  institution_name: string;
  region: string;
  fdr_id: string;
  receipt_no: string;
  bank: string;
  branch: string;
  principal: number;
  workflow_status: string;
}

export interface DuplicateCluster {
  fingerprint: string;
  duplicate_count: number;
  distinct_institutions_count: number;
  severity: string;
  signal_type: string;
  signal_notice: string;
  institutions_involved: DuplicateInstitution[];
}

export interface DuplicateSummary {
  total_duplicates_found: number;
  status: string;
  duplicates: DuplicateCluster[];
}
