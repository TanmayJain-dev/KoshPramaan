from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Institution, FDR
from ..schemas import InstitutionOut, FDROut, FieldClaimOut, LiabilityOut

router = APIRouter(prefix="/institutions", tags=["Institutions"])


def build_institution_out(inst: Institution, db: Session, user_role: str = "OFFICER") -> InstitutionOut:
    fdr_outs = []
    total_principal = 0.0

    for f in inst.fdrs:
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
                # Honesty rule: Institution role NEVER sees duplicate flags or cross-institution alerts!
                duplicate_count=dup_count if user_role != "INSTITUTION" else 0,
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
    x_user_role: str = Header(default="SCRUTINY_OFFICER", alias="X-User-Role"),
    x_institution_id: str = Header(default="", alias="X-Institution-Id"),
    db: Session = Depends(get_db),
):
    role = x_user_role if isinstance(x_user_role, str) else "SCRUTINY_OFFICER"
    inst_id = x_institution_id if isinstance(x_institution_id, str) else ""

    query = db.query(Institution)
    # If the user is an Institution, they only see their own institution
    if role == "INSTITUTION" and inst_id:
        query = query.filter(Institution.id == inst_id)

    institutions = query.all()
    return [build_institution_out(inst, db, role) for inst in institutions]


@router.get("/{id}", response_model=InstitutionOut)
def get_institution(
    id: str,
    x_user_role: str = Header(default="SCRUTINY_OFFICER", alias="X-User-Role"),
    db: Session = Depends(get_db),
):
    role = x_user_role if isinstance(x_user_role, str) else "SCRUTINY_OFFICER"
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return build_institution_out(inst, db, role)

