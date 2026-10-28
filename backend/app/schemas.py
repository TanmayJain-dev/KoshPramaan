from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ClockResponse(BaseModel):
    current_time_iso: str
    days_elapsed: int
    base_time_iso: str
    advanced_by: Optional[int] = 0


class ClockAdvanceRequest(BaseModel):
    days: int


class AuditVerifyResponse(BaseModel):
    valid: bool
    broken_index: Optional[int] = None
    chain_position: Optional[int] = None
    total_events: int
    latest_hash: Optional[str] = None
    expected_prev_hash: Optional[str] = None
    recorded_prev_hash: Optional[str] = None
    computed_hash: Optional[str] = None
    recorded_hash: Optional[str] = None
    message: Optional[str] = None


class EventOut(BaseModel):
    id: int
    ts_sim: str
    actor: str
    role: str
    action: str
    payload: Dict[str, Any]
    prev_hash: str
    hash: str


class RuleOut(BaseModel):
    key: str
    value: Dict[str, Any]
    effective_year: int
    version: int


class FieldClaimOut(BaseModel):
    id: int
    field: str
    claimed_value: str
    bank_value: Optional[str] = None
    trust_level: str
    verified_at: Optional[str] = None
    source: str


class FDROut(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    receipt_no: str
    parent_receipt_id: Optional[str] = None
    bank: str
    branch: str
    ifsc: str
    principal: float
    issue_date: str
    maturity_date: str
    lien_clause_ok: bool
    status: str
    fingerprint: str
    doc_hash: Optional[str] = None
    field_claims: List[FieldClaimOut] = []
    duplicate_count: Optional[int] = 0
    workflow_status: str = "CHECKER_APPROVED"
    created_by: Optional[str] = None
    checked_by: Optional[str] = None
    checker_remarks: Optional[str] = None
    ro_by: Optional[str] = None
    ro_remarks: Optional[str] = None
    submitted_at: Optional[str] = None
    checked_at: Optional[str] = None
    ro_action_at: Optional[str] = None
    proof_score: Optional[float] = 100.0
    decay_risk: Optional[bool] = False



class LiabilityOut(BaseModel):
    id: str
    institution_id: str
    kind: str
    amount: float
    status: str


class InstitutionOut(BaseModel):
    id: str
    name: str
    region: str
    category: str
    intake: int
    annual_fee: float
    faculty_count: int
    avg_monthly_salary: float
    exempt: bool
    trust_id: Optional[str] = None
    fdrs: List[FDROut] = []
    liabilities: List[LiabilityOut] = []
    total_fdr_principal: float = 0.0


class VerifierOut(BaseModel):
    id: str
    name: str
    bank: str
    branch: str
    email: str
    reliability_score: float
    catches: int
    misses: int
    avg_response_days: float


class DemoStatusResponse(BaseModel):
    system: str
    version: str
    simulated_time: str
    days_elapsed: int
    chain_valid: bool
    institutions_count: int
    fdrs_count: int
    verifiers_count: int
    adapters: Dict[str, Any]


class UserOut(BaseModel):
    id: str
    username: str
    name: str
    email: str
    role: str
    institution_id: Optional[str] = None
    region: Optional[str] = None
    bank: Optional[str] = None
    verifier_id: Optional[str] = None
    designation: Optional[str] = None
    org_name: Optional[str] = None


class DemoUserOut(BaseModel):
    id: str
    username: str
    name: str
    role: str
    role_name: str
    org_name: str
    badge: str
    description: str
    institution_id: Optional[str] = None
    region: Optional[str] = None
    bank: Optional[str] = None


class LoginRequest(BaseModel):
    username: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class FDRCreateRequest(BaseModel):
    receipt_no: str
    bank: str
    branch: str
    ifsc: str
    principal: float
    issue_date: str
    maturity_date: str
    lien_clause_ok: bool = True
    doc_hash: Optional[str] = None


class FDRUpdateRequest(BaseModel):
    receipt_no: Optional[str] = None
    bank: Optional[str] = None
    branch: Optional[str] = None
    ifsc: Optional[str] = None
    principal: Optional[float] = None
    issue_date: Optional[str] = None
    maturity_date: Optional[str] = None
    lien_clause_ok: Optional[bool] = None


class FDRSubmitRequest(BaseModel):
    notes: Optional[str] = ""


class FDRCheckerReviewRequest(BaseModel):
    action: str  # approve | return
    remarks: str


class FDRROReviewRequest(BaseModel):
    action: str  # approve | reject | clarify
    remarks: str


class FDRBankVerifyRequest(BaseModel):
    action: str  # confirm | flag_mismatch
    bank_value: Optional[str] = None
    notes: Optional[str] = ""

