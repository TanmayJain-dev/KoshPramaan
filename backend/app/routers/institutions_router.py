from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Institution, FDR, User
from ..auth import get_current_user
from ..schemas import InstitutionOut, LiabilityOut
from .fdrs_router import build_fdr_out

router = APIRouter(prefix="/institutions", tags=["Institutions"])


def build_institution_out(inst: Institution, db: Session, current_user: Optional[User] = None) -> InstitutionOut:
    user_role = current_user.role if current_user else "AICTE_ADMIN"
    user_bank = current_user.bank if current_user else None

    # Filter FDRs based on role
    fdrs_to_process = inst.fdrs
    if user_role == "BANK_VERIFIER" and user_bank:
        fdrs_to_process = [f for f in fdrs_to_process if f.bank == user_bank]

    if user_role in ["REGIONAL_OFFICER", "BANK_VERIFIER"]:
        fdrs_to_process = [
            f for f in fdrs_to_process
            if f.workflow_status not in ["DRAFT", "SUBMITTED", "RETURNED_TO_MAKER"]
        ]

    fdr_outs = [build_fdr_out(f, db, current_user) for f in fdrs_to_process]
    total_principal = sum(f.principal for f in fdr_outs)

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
):
    """Lists institutions strictly scoped by the user's role and geographic/organizational boundary."""
    query = db.query(Institution)

    # 1. Institution Maker & Checker: strictly own institution
    if current_user.role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
        query = query.filter(Institution.id == current_user.institution_id)

    # 2. Regional Officer: strictly institutions in officer's designated region
    elif current_user.role == "REGIONAL_OFFICER":
        query = query.filter(Institution.region == current_user.region)

    # 3. Bank Verifier: only institutions with deposits at this bank that passed Checker
    elif current_user.role == "BANK_VERIFIER":
        inst_ids = (
            db.query(FDR.institution_id)
            .filter(FDR.bank == current_user.bank)
            .filter(FDR.workflow_status.notin_(["DRAFT", "SUBMITTED", "RETURNED_TO_MAKER"]))
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
):
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
        has_fdr_in_bank = any(
            f.bank == current_user.bank and f.workflow_status not in ["DRAFT", "SUBMITTED", "RETURNED_TO_MAKER"]
            for f in inst.fdrs
        )
        if not has_fdr_in_bank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: institution has no deposits with {current_user.bank}.",
            )

    return build_institution_out(inst, db, current_user)
