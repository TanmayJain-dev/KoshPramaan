export type UserRole = 
  | 'INSTITUTION' 
  | 'SCRUTINY_OFFICER' 
  | 'ASSISTANT_DIRECTOR' 
  | 'REGIONAL_OFFICER';

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
  };
  adapters: {
    bank: Record<string, any>;
    grievance: Record<string, any>;
    vigilance: Record<string, any>;
    esign: Record<string, any>;
  };
}
