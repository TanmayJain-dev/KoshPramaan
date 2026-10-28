import hashlib
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FDR, Institution, FieldClaim, User, Rule
from ..schemas import (
    FDROut,
    FieldClaimOut,
    FDRCreateRequest,
    FDRUpdateRequest,
    FDRSubmitRequest,
    FDRCheckerReviewRequest,
    FDRROReviewRequest,
    FDRBankVerifyRequest,
)
from ..auth import get_current_user, require_roles
from ..clock import clock
from ..audit import record_event

router = APIRouter(prefix="/fdrs", tags=["FDRs"])


def compute_fdr_fingerprint(receipt_no: str, bank: str, branch: str) -> str:
    normalized = f"{receipt_no.strip().upper()}:{bank.strip().upper()}:{branch.strip().upper()}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def compute_fdr_proof_score(fdr: FDR, db: Session, days_elapsed: int) -> float:
    """Calculates dynamically decaying proof score from rules table."""
    rule_record = db.query(Rule).filter(Rule.key == "proof_score_parameters").first()
    half_life = 180
    penalties_config = {"open_mismatch": 40.0, "missed_canary": 30.0}

    if rule_record:
        try:
            val = json.loads(rule_record.value_json)
            half_life = val.get("half_life_days", 180)
            penalties_config = val.get("penalties", penalties_config)
        except Exception:
            pass

    # Find highest trust level
    base_score = 20.0
    for c in fdr.field_claims:
        if c.trust_level in ["bank_confirmed", "reverified"]:
            base_score = max(base_score, 100.0)
        elif c.trust_level == "document_checked":
            base_score = max(base_score, 40.0)

    # Half life decay
    decay_factor = 0.5 ** (days_elapsed / half_life)
    decayed_score = base_score * decay_factor

    # Apply penalties
    penalty = 0.0
    principal_claim = next((c for c in fdr.field_claims if c.field == "principal"), None)
    if principal_claim and principal_claim.bank_value and float(principal_claim.bank_value) != fdr.principal:
        penalty += penalties_config.get("open_mismatch", 40.0)

    if fdr.status == "discrepancy_locked":
        penalty += penalties_config.get("open_mismatch", 40.0)

    return max(0.0, round(decayed_score - penalty, 1))


def build_fdr_out(fdr: FDR, db: Session, current_user: Optional[User] = None) -> FDROut:
    dup_count = (
        db.query(FDR)
        .filter(FDR.fingerprint == fdr.fingerprint, FDR.institution_id != fdr.institution_id)
        .count()
    )
    inst = db.query(Institution).filter(Institution.id == fdr.institution_id).first()
    inst_name = inst.name if inst else "Unknown"

    user_role = current_user.role if current_user else "AICTE_ADMIN"
    is_institution_role = user_role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER", "INSTITUTION"]

    clock_state = clock.get_state(db)
    days_elapsed = clock_state.get("days_elapsed", 0)
    proof_score = compute_fdr_proof_score(fdr, db, days_elapsed)
    decay_risk = proof_score < 60.0

    claims = [
        FieldClaimOut(
            id=c.id,
            field=c.field,
            claimed_value=c.claimed_value,
            bank_value=c.bank_value,
            trust_level=c.trust_level,
            verified_at=c.verified_at,
            source=c.source,
        )
        for c in fdr.field_claims
    ]

    return FDROut(
        id=fdr.id,
        institution_id=fdr.institution_id,
        institution_name=inst_name,
        receipt_no=fdr.receipt_no,
        parent_receipt_id=fdr.parent_receipt_id,
        bank=fdr.bank,
        branch=fdr.branch,
        ifsc=fdr.ifsc,
        principal=fdr.principal,
        issue_date=fdr.issue_date,
        maturity_date=fdr.maturity_date,
        lien_clause_ok=fdr.lien_clause_ok,
        status=fdr.status,
        fingerprint=fdr.fingerprint,
        doc_hash=fdr.doc_hash,
        field_claims=claims,
        # Honesty rule: Institution role NEVER sees cross-institution duplicate warnings
        duplicate_count=0 if is_institution_role else dup_count,
        workflow_status=getattr(fdr, "workflow_status", "CHECKER_APPROVED"),
        created_by=getattr(fdr, "created_by", None),
        checked_by=getattr(fdr, "checked_by", None),
        checker_remarks=getattr(fdr, "checker_remarks", None),
        ro_by=getattr(fdr, "ro_by", None),
        ro_remarks=getattr(fdr, "ro_remarks", None),
        submitted_at=getattr(fdr, "submitted_at", None),
        checked_at=getattr(fdr, "checked_at", None),
        ro_action_at=getattr(fdr, "ro_action_at", None),
        proof_score=proof_score,
        decay_risk=decay_risk,
    )


@router.get("", response_model=List[FDROut])
def list_fdrs(
    institution_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_institution_id: Optional[str] = Header(None, alias="X-Institution-Id"),
):
    """Lists FDRs strictly isolated within the user's role scope (institution, region, or bank)."""
    if not isinstance(current_user, User):
        role = x_user_role or "AICTE_ADMIN"
        if role == "INSTITUTION":
            target_inst = x_institution_id or institution_id or "INST-001"
            current_user = db.query(User).filter(User.role == "INSTITUTION_MAKER", User.institution_id == target_inst).first()
        else:
            current_user = db.query(User).filter(User.role == role).first()
        if not current_user:
            current_user = db.query(User).first()

    query = db.query(FDR)

    # 1. Institution Maker & Checker: strictly own institution
    if current_user.role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
        query = query.filter(FDR.institution_id == current_user.institution_id)

    # 2. Regional Officer: only institutions in their region
    elif current_user.role == "REGIONAL_OFFICER":
        inst_ids = (
            db.query(Institution.id)
            .filter(Institution.region == current_user.region)
            .all()
        )
        allowed_ids = [i[0] for i in inst_ids]
        query = query.filter(FDR.institution_id.in_(allowed_ids))
        if institution_id:
            if institution_id not in allowed_ids:
                return []
            query = query.filter(FDR.institution_id == institution_id)

    # 3. Bank Verifier: only FDRs issued by their bank
    elif current_user.role == "BANK_VERIFIER":
        query = query.filter(FDR.bank == current_user.bank)
        if institution_id:
            query = query.filter(FDR.institution_id == institution_id)

    # 4. Scrutiny Officer & HQ Admin: national scope
    elif institution_id:
        query = query.filter(FDR.institution_id == institution_id)

    fdrs = query.all()
    return [build_fdr_out(f, db, current_user) for f in fdrs]


@router.get("/watchlist/decay", response_model=List[FDROut])
def get_decay_watchlist(
    current_user: User = Depends(require_roles(["REGIONAL_OFFICER", "SCRUTINY_OFFICER", "AICTE_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Returns FDRs whose proof score has decayed below the regulatory threshold (60.0) in the user's region."""
    if not isinstance(current_user, User):
        role = "REGIONAL_OFFICER"
        current_user = db.query(User).filter(User.role == role).first() or db.query(User).first()

    if not current_user or current_user.role not in ["REGIONAL_OFFICER", "SCRUTINY_OFFICER", "AICTE_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: proof-score decay watchlist is restricted to Regional Officers, Scrutiny Officers, and AICTE Admin.",
        )

    query = db.query(FDR)
    if current_user.role == "REGIONAL_OFFICER":
        inst_ids = (
            db.query(Institution.id)
            .filter(Institution.region == current_user.region)
            .all()
        )
        query = query.filter(FDR.institution_id.in_([i[0] for i in inst_ids]))

    fdrs = query.all()
    clock_state = clock.get_state(db)
    days_elapsed = clock_state.get("days_elapsed", 0)

    decayed = []
    for f in fdrs:
        score = compute_fdr_proof_score(f, db, days_elapsed)
        if score < 60.0:
            decayed.append(build_fdr_out(f, db, current_user))

    return decayed


@router.get("/duplicates/summary")
def get_duplicate_summary(
    current_user: User = Depends(require_roles(["SCRUTINY_OFFICER", "AICTE_ADMIN"])),
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """Confidential cross-institution duplicate fingerprint detector (Scrutiny/Vigilance Officer only)."""
    if not isinstance(current_user, User):
        role = x_user_role or "SCRUTINY_OFFICER"
        if role in ["INSTITUTION", "INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
            raise HTTPException(status_code=403, detail="Institutions are not authorized to view cross-institution alerts.")
        current_user = db.query(User).filter(User.role == role).first() or db.query(User).first()

    if not current_user or current_user.role not in ["SCRUTINY_OFFICER", "AICTE_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: confidential cross-institution vigilance alerts are restricted to Scrutiny Officers and AICTE Admin.",
        )

    fdrs = db.query(FDR).all()
    fp_map = {}
    for f in fdrs:
        fp_map.setdefault(f.fingerprint, []).append(f)

    duplicates = []
    for fp, items in fp_map.items():
        if len(items) > 1:
            inst_ids = list({f.institution_id for f in items})
            # Multi-institution collusion risk
            if len(inst_ids) > 1:
                institutions = db.query(Institution).filter(Institution.id.in_(inst_ids)).all()
                inst_lookup = {i.id: i.name for i in institutions}
                inst_regions = {i.id: i.region for i in institutions}

                duplicates.append({
                    "fingerprint": fp,
                    "duplicate_count": len(items),
                    "distinct_institutions_count": len(inst_ids),
                    "severity": "CRITICAL_COLLUSION_RISK",
                    "signal_type": "CROSS_INSTITUTION_DUPLICATE_FINGERPRINT",
                    "signal_notice": "Signals, not verdicts: Scrutiny officer investigation required before adverse action.",
                    "institutions_involved": [
                        {
                            "institution_id": f.institution_id,
                            "institution_name": inst_lookup.get(f.institution_id, "Unknown"),
                            "region": inst_regions.get(f.institution_id, "Unknown"),
                            "fdr_id": f.id,
                            "receipt_no": f.receipt_no,
                            "bank": f.bank,
                            "branch": f.branch,
                            "principal": f.principal,
                            "workflow_status": f.workflow_status,
                        }
                        for f in items
                    ],
                })

    return {
        "total_duplicates_found": len(duplicates),
        "status": "scrutiny_alert" if duplicates else "clean",
        "duplicates": duplicates,
    }


@router.get("/{id}", response_model=FDROut)
def get_fdr(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """Retrieves single FDR with access isolation enforcement."""
    if not isinstance(current_user, User):
        role = x_user_role or "AICTE_ADMIN"
        current_user = db.query(User).filter(User.role == role).first() or db.query(User).first()

    """Retrieves single FDR with access isolation enforcement."""
    fdr = db.query(FDR).filter(FDR.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    # Scope validation
    if current_user.role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
        if fdr.institution_id != current_user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: you can only view FDRs of your own institution.",
            )

    elif current_user.role == "REGIONAL_OFFICER":
        inst = db.query(Institution).filter(Institution.id == fdr.institution_id).first()
        if inst and inst.region != current_user.region:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: FDR belongs to institution outside your region ({current_user.region}).",
            )

    elif current_user.role == "BANK_VERIFIER":
        if fdr.bank != current_user.bank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: FDR is held with {fdr.bank}, not {current_user.bank}.",
            )

    return build_fdr_out(fdr, db, current_user)


# =========================================================================
# WORKFLOW STATE MACHINE ENDPOINTS
# =========================================================================

@router.post("", response_model=FDROut, status_code=status.HTTP_201_CREATED)
def create_draft_fdr(
    req: FDRCreateRequest,
    current_user: User = Depends(require_roles(["INSTITUTION_MAKER"])),
    db: Session = Depends(get_db),
):
    """Maker Action: Creates a new draft FDR claim for their institution."""
    if not isinstance(current_user, User) or current_user.role != "INSTITUTION_MAKER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Institution Maker can create draft FDR claims.")

    inst_id = current_user.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="User is not attached to an institution.")

    fdr_id = f"FDR-{inst_id}-{uuid.uuid4().hex[:6].upper()}"
    fp = compute_fdr_fingerprint(req.receipt_no, req.bank, req.branch)

    new_fdr = FDR(
        id=fdr_id,
        institution_id=inst_id,
        receipt_no=req.receipt_no,
        bank=req.bank,
        branch=req.branch,
        ifsc=req.ifsc,
        principal=req.principal,
        issue_date=req.issue_date,
        maturity_date=req.maturity_date,
        lien_clause_ok=req.lien_clause_ok,
        status="active",
        workflow_status="DRAFT",
        created_by=current_user.id,
        fingerprint=fp,
        doc_hash=req.doc_hash or hashlib.sha256(f"{fdr_id}-PROOF".encode()).hexdigest(),
    )
    db.add(new_fdr)
    db.commit()

    # Create initial field claims
    claims = [
        FieldClaim(fdr_id=fdr_id, field="principal", claimed_value=str(req.principal), trust_level="claimed", verified_at=clock.now(db), source="institution_claim"),
        FieldClaim(fdr_id=fdr_id, field="maturity_date", claimed_value=req.maturity_date, trust_level="claimed", verified_at=clock.now(db), source="institution_claim"),
        FieldClaim(fdr_id=fdr_id, field="lien_clause", claimed_value=str(req.lien_clause_ok).lower(), trust_level="claimed", verified_at=clock.now(db), source="institution_claim"),
    ]
    db.add_all(claims)
    db.commit()

    record_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="FDR_DRAFT_CREATED",
        payload={
            "fdr_id": fdr_id,
            "institution_id": inst_id,
            "receipt_no": req.receipt_no,
            "principal": req.principal,
            "bank": req.bank,
        },
        ts_sim=clock.now(db),
    )

    return build_fdr_out(new_fdr, db, current_user)


@router.put("/{id}", response_model=FDROut)
def update_draft_fdr(
    id: str,
    req: FDRUpdateRequest,
    current_user: User = Depends(require_roles(["INSTITUTION_MAKER"])),
    db: Session = Depends(get_db),
):
    """Maker Action: Modifies an existing draft or returned FDR claim."""
    if not isinstance(current_user, User) or current_user.role != "INSTITUTION_MAKER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Institution Maker can modify draft FDR claims.")

    fdr = db.query(FDR).filter(FDR.id == id, FDR.institution_id == current_user.institution_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR draft not found in your institution.")

    if fdr.workflow_status not in ["DRAFT", "RETURNED_TO_MAKER"]:
        raise HTTPException(status_code=400, detail=f"Cannot edit FDR in state '{fdr.workflow_status}'. Only DRAFT or RETURNED_TO_MAKER can be modified.")

    if req.receipt_no is not None:
        fdr.receipt_no = req.receipt_no
    if req.bank is not None:
        fdr.bank = req.bank
    if req.branch is not None:
        fdr.branch = req.branch
    if req.ifsc is not None:
        fdr.ifsc = req.ifsc
    if req.principal is not None:
        fdr.principal = req.principal
    if req.issue_date is not None:
        fdr.issue_date = req.issue_date
    if req.maturity_date is not None:
        fdr.maturity_date = req.maturity_date
    if req.lien_clause_ok is not None:
        fdr.lien_clause_ok = req.lien_clause_ok

    fdr.fingerprint = compute_fdr_fingerprint(fdr.receipt_no, fdr.bank, fdr.branch)
    db.commit()

    record_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="FDR_DRAFT_MODIFIED",
        payload={"fdr_id": fdr.id, "receipt_no": fdr.receipt_no, "principal": fdr.principal},
        ts_sim=clock.now(db),
    )

    return build_fdr_out(fdr, db, current_user)


@router.post("/{id}/submit", response_model=FDROut)
def submit_fdr_to_checker(
    id: str,
    req: FDRSubmitRequest,
    current_user: User = Depends(require_roles(["INSTITUTION_MAKER"])),
    db: Session = Depends(get_db),
):
    """Maker Action: Submits draft FDR claim to Institution Checker for internal verification."""
    if not isinstance(current_user, User) or current_user.role != "INSTITUTION_MAKER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Institution Maker can submit claims to Checker.")
    fdr = db.query(FDR).filter(FDR.id == id, FDR.institution_id == current_user.institution_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found in your institution.")

    if fdr.workflow_status not in ["DRAFT", "RETURNED_TO_MAKER"]:
        raise HTTPException(status_code=400, detail=f"Cannot submit FDR in '{fdr.workflow_status}' state.")

    now_sim = clock.now(db)
    fdr.workflow_status = "SUBMITTED"
    fdr.created_by = current_user.id
    fdr.submitted_at = now_sim
    db.commit()

    record_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="FDR_SUBMITTED_TO_CHECKER",
        payload={
            "fdr_id": fdr.id,
            "institution_id": fdr.institution_id,
            "submitted_by": current_user.id,
            "notes": req.notes,
        },
        ts_sim=now_sim,
    )

    return build_fdr_out(fdr, db, current_user)


@router.post("/{id}/checker-review", response_model=FDROut)
def checker_review_fdr(
    id: str,
    req: FDRCheckerReviewRequest,
    current_user: User = Depends(require_roles(["INSTITUTION_CHECKER"])),
    db: Session = Depends(get_db),
):
    """Checker Action: Approves submission to RO or returns with remarks. Enforces maker != checker segregation."""
    if not isinstance(current_user, User) or current_user.role != "INSTITUTION_CHECKER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Institution Checker can review Maker submissions.")

    fdr = db.query(FDR).filter(FDR.id == id, FDR.institution_id == current_user.institution_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR not found in your institution.")

    if fdr.workflow_status != "SUBMITTED":
        raise HTTPException(status_code=400, detail=f"FDR is in state '{fdr.workflow_status}', not 'SUBMITTED'.")

    # STRICT MAKER != CHECKER ENFORCEMENT
    if fdr.created_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maker-Checker Segregation Violation: As the Maker who created this claim, you cannot approve it. An independent Checker must verify.",
        )

    now_sim = clock.now(db)
    fdr.checked_by = current_user.id
    fdr.checked_at = now_sim
    fdr.checker_remarks = req.remarks

    if req.action == "approve":
        fdr.workflow_status = "CHECKER_APPROVED"
        action_name = "FDR_CHECKER_APPROVED"
    elif req.action == "return":
        fdr.workflow_status = "RETURNED_TO_MAKER"
        action_name = "FDR_RETURNED_TO_MAKER"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Allowed: 'approve' or 'return'.")

    db.commit()

    record_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action=action_name,
        payload={
            "fdr_id": fdr.id,
            "checked_by": current_user.id,
            "action": req.action,
            "remarks": req.remarks,
        },
        ts_sim=now_sim,
    )

    return build_fdr_out(fdr, db, current_user)


@router.post("/{id}/ro-review", response_model=FDROut)
def ro_review_fdr(
    id: str,
    req: FDRROReviewRequest,
    current_user: User = Depends(require_roles(["REGIONAL_OFFICER"])),
    db: Session = Depends(get_db),
):
    """Regional Officer Action: Approves, rejects, or requests clarification on Checker-approved claims."""
    if not isinstance(current_user, User) or current_user.role != "REGIONAL_OFFICER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Regional Officers can review Checker-approved claims.")

    fdr = db.query(FDR).filter(FDR.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found.")

    inst = db.query(Institution).filter(Institution.id == fdr.institution_id).first()
    if not inst or inst.region != current_user.region:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: FDR belongs to institution outside your region ({current_user.region}).",
        )

    now_sim = clock.now(db)
    fdr.ro_by = current_user.id
    fdr.ro_action_at = now_sim
    fdr.ro_remarks = req.remarks

    if req.action == "approve":
        fdr.workflow_status = "RO_APPROVED"
        fdr.status = "active"
        action_name = "FDR_RO_APPROVED"
    elif req.action == "reject":
        fdr.workflow_status = "RO_REJECTED"
        action_name = "FDR_RO_REJECTED"
    elif req.action == "clarify":
        fdr.workflow_status = "CLARIFICATION_REQUESTED"
        action_name = "FDR_RO_CLARIFICATION_REQUESTED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Allowed: 'approve', 'reject', or 'clarify'.")

    db.commit()

    record_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action=action_name,
        payload={
            "fdr_id": fdr.id,
            "ro_by": current_user.id,
            "action": req.action,
            "remarks": req.remarks,
        },
        ts_sim=now_sim,
    )

    return build_fdr_out(fdr, db, current_user)


@router.post("/{id}/bank-verify", response_model=FDROut)
def bank_verify_fdr(
    id: str,
    req: FDRBankVerifyRequest,
    current_user: User = Depends(require_roles(["BANK_VERIFIER"])),
    db: Session = Depends(get_db),
):
    """Bank Verifier Action: Attests deposit against Core Banking System (confirm or flag mismatch)."""
    if not isinstance(current_user, User) or current_user.role != "BANK_VERIFIER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Bank Verifiers can submit CBS reconciliation actions.")
    fdr = db.query(FDR).filter(FDR.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found.")

    if fdr.bank != current_user.bank:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: you can only attest deposits held at {current_user.bank}.",
        )

    now_sim = clock.now(db)

    # Find principal field claim
    principal_claim = next((c for c in fdr.field_claims if c.field == "principal"), None)
    if not principal_claim:
        principal_claim = FieldClaim(
            fdr_id=fdr.id,
            field="principal",
            claimed_value=str(fdr.principal),
            trust_level="claimed",
            source="institution_claim",
        )
        db.add(principal_claim)

    if req.action == "confirm":
        principal_claim.trust_level = "bank_confirmed"
        principal_claim.bank_value = str(fdr.principal)
        principal_claim.verified_at = now_sim
        fdr.status = "active"
        action_name = "BANK_ATTESTATION_CONFIRMED"
    elif req.action == "flag_mismatch":
        bank_val = req.bank_value or str(fdr.principal / 10.0)
        principal_claim.bank_value = bank_val
        principal_claim.trust_level = "claimed"
        principal_claim.verified_at = now_sim
        fdr.status = "discrepancy_locked"
        action_name = "BANK_DISCREPANCY_FLAGGED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Allowed: 'confirm' or 'flag_mismatch'.")

    db.commit()

    record_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action=action_name,
        payload={
            "fdr_id": fdr.id,
            "bank": current_user.bank,
            "verifier_id": current_user.verifier_id or current_user.id,
            "action": req.action,
            "bank_value": principal_claim.bank_value,
            "notes": req.notes,
        },
        ts_sim=now_sim,
    )

    return build_fdr_out(fdr, db, current_user)
