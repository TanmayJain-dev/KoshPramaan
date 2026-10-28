from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Institution, FDR, User
from ..auth import get_current_user
from ..schemas import InstitutionOut, FDROut, FieldClaimOut, LiabilityOut

router = APIRouter(prefix="/institutions", tags=["Institutions"])


def build_institution_out(inst: Institution, db: Session, current_user: Optional[User] = None) -> InstitutionOut:
    fdr_outs = []
    total_principal = 0.0

    user_role = current_user.role if current_user else "AICTE_ADMIN"
    user_bank = current_user.bank if current_user else None

    # Filter FDRs if bank verifier
    fdrs_to_process = inst.fdrs
    if user_role == "BANK_VERIFIER" and user_bank:
        fdrs_to_process = [f for f in inst.fdrs if f.bank == user_bank]

    is_institution_role = user_role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER", "INSTITUTION"]

    for f in fdrs_to_process:
        total_principal += f.principal
        # Count duplicates with same fingerprint across institutions
        dup_count = (
            db.query(FDR)
            .filter(FDR.fingerprint == f.fingerprint, FDR.institution_id != inst.id)
            .count()
        )
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
            for c in f.field_claims
        ]
        fdr_outs.append(
            FDROut(
                id=f.id,
                institution_id=f.institution_id,
                institution_name=inst.name,
                receipt_no=f.receipt_no,
                parent_receipt_id=f.parent_receipt_id,
                bank=f.bank,
                branch=f.branch,
                ifsc=f.ifsc,
                principal=f.principal,
                issue_date=f.issue_date,
                maturity_date=f.maturity_date,
                lien_clause_ok=f.lien_clause_ok,
                status=f.status,
                fingerprint=f.fingerprint,
                doc_hash=f.doc_hash,
                field_claims=claims,
                # Honesty rule: Institution roles NEVER see cross-institution duplicate flags
                duplicate_count=0 if is_institution_role else dup_count,
                workflow_status=getattr(f, "workflow_status", "CHECKER_APPROVED"),
                created_by=getattr(f, "created_by", None),
                checked_by=getattr(f, "checked_by", None),
                checker_remarks=getattr(f, "checker_remarks", None),
                ro_by=getattr(f, "ro_by", None),
                ro_remarks=getattr(f, "ro_remarks", None),
                submitted_at=getattr(f, "submitted_at", None),
                checked_at=getattr(f, "checked_at", None),
                ro_action_at=getattr(f, "ro_action_at", None),
            )
        )

    liabs = [
        LiabilityOut(
            id=l.id,
            institution_id=l.institution_id,
            kind=l.kind,
            amount=l.amount,
            status=l.status,
        )
        for l in inst.liabilities
    ]

    return InstitutionOut(
        id=inst.id,
        name=inst.name,
        region=inst.region,
        category=inst.category,
        intake=inst.intake,
        annual_fee=inst.annual_fee,
        faculty_count=inst.faculty_count,
        avg_monthly_salary=inst.avg_monthly_salary,
        exempt=inst.exempt,
        trust_id=inst.trust_id,
        fdrs=fdr_outs,
        liabilities=liabs,
        total_fdr_principal=total_principal,
    )


@router.get("", response_model=List[InstitutionOut])
def list_institutions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_institution_id: Optional[str] = Header(None, alias="X-Institution-Id"),
):
    """Lists institutions strictly scoped by the user's role and geographic/organizational boundary."""
    if not isinstance(current_user, User):
        role = x_user_role or "AICTE_ADMIN"
        if role == "INSTITUTION":
            target_inst = x_institution_id or "INST-001"
            current_user = db.query(User).filter(User.role == "INSTITUTION_MAKER", User.institution_id == target_inst).first()
        else:
            current_user = db.query(User).filter(User.role == role).first()
        if not current_user:
            current_user = db.query(User).first()

    query = db.query(Institution)

    # 1. Institution Maker & Checker: strictly own institution
    if current_user.role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
        query = query.filter(Institution.id == current_user.institution_id)

    # 2. Regional Officer: strictly institutions in officer's designated region
    elif current_user.role == "REGIONAL_OFFICER":
        query = query.filter(Institution.region == current_user.region)

    # 3. Bank Verifier: only institutions with deposits at this bank
    elif current_user.role == "BANK_VERIFIER":
        inst_ids = (
            db.query(FDR.institution_id)
            .filter(FDR.bank == current_user.bank)
            .distinct()
            .all()
        )
        allowed_ids = [i[0] for i in inst_ids]
        query = query.filter(Institution.id.in_(allowed_ids))

    # 4. Scrutiny Officer & HQ Admin: national visibility across all regions
    institutions = query.all()
    return [build_institution_out(inst, db, current_user) for inst in institutions]


@router.get("/{id}", response_model=InstitutionOut)
def get_institution(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """Retrieves single institution detail, enforcing strict organizational/regional access isolation."""
    if not isinstance(current_user, User):
        role = x_user_role or "AICTE_ADMIN"
        current_user = db.query(User).filter(User.role == role).first() or db.query(User).first()

    """Retrieves single institution detail, enforcing strict organizational/regional access isolation."""
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    # Scope checks:
    if current_user.role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
        if inst.id != current_user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: you are only authorized to access your own institution ({current_user.institution_id}).",
            )

    elif current_user.role == "REGIONAL_OFFICER":
        if inst.region != current_user.region:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: institution is in '{inst.region}', outside your jurisdiction '{current_user.region}'.",
            )

    elif current_user.role == "BANK_VERIFIER":
        has_fdr_in_bank = any(f.bank == current_user.bank for f in inst.fdrs)
        if not has_fdr_in_bank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: institution has no deposits with {current_user.bank}.",
            )

    return build_institution_out(inst, db, current_user)
