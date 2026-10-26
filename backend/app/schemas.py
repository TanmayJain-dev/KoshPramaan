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
