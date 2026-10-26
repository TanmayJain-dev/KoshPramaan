from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FDR, Institution
from ..schemas import FDROut, FieldClaimOut

router = APIRouter(prefix="/fdrs", tags=["FDRs"])


def build_fdr_out(fdr: FDR, db: Session, user_role: str = "OFFICER") -> FDROut:
    dup_count = (
        db.query(FDR)
        .filter(FDR.fingerprint == fdr.fingerprint, FDR.institution_id != fdr.institution_id)
        .count()
    )
    inst = db.query(Institution).filter(Institution.id == fdr.institution_id).first()
    inst_name = inst.name if inst else "Unknown"

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
        duplicate_count=dup_count if user_role != "INSTITUTION" else 0,
    )


@router.get("", response_model=List[FDROut])
def list_fdrs(
    institution_id: Optional[str] = None,
    x_user_role: str = Header(default="SCRUTINY_OFFICER", alias="X-User-Role"),
    x_institution_id: str = Header(default="", alias="X-Institution-Id"),
    db: Session = Depends(get_db),
):
    role = x_user_role if isinstance(x_user_role, str) else "SCRUTINY_OFFICER"
    inst_id = x_institution_id if isinstance(x_institution_id, str) else ""

    query = db.query(FDR)

    if role == "INSTITUTION":
        target_id = inst_id or institution_id or "INST-001"
        query = query.filter(FDR.institution_id == target_id)
    elif institution_id:
        query = query.filter(FDR.institution_id == institution_id)

    fdrs = query.all()
    return [build_fdr_out(f, db, role) for f in fdrs]


@router.get("/{id}", response_model=FDROut)
def get_fdr(
    id: str,
    x_user_role: str = Header(default="SCRUTINY_OFFICER", alias="X-User-Role"),
    db: Session = Depends(get_db),
):
    role = x_user_role if isinstance(x_user_role, str) else "SCRUTINY_OFFICER"
    fdr = db.query(FDR).filter(FDR.id == id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")
    return build_fdr_out(fdr, db, role)


@router.get("/duplicates/summary")
def get_duplicate_summary(
    x_user_role: str = Header(default="SCRUTINY_OFFICER", alias="X-User-Role"),
    db: Session = Depends(get_db),
):
    """Officer-only duplicate fingerprint alert view."""
    role = x_user_role if isinstance(x_user_role, str) else "SCRUTINY_OFFICER"
    if role == "INSTITUTION":
        raise HTTPException(status_code=403, detail="Institutions are not authorized to view cross-institution alerts.")


    fdrs = db.query(FDR).all()
    fp_map = {}
    for f in fdrs:
        fp_map.setdefault(f.fingerprint, []).append(f)

    duplicates = []
    for fp, items in fp_map.items():
        if len(items) > 1:
            duplicates.append({
                "fingerprint": fp,
                "count": len(items),
                "fdrs": [
                    {
                        "fdr_id": it.id,
                        "institution_id": it.institution_id,
                        "receipt_no": it.receipt_no,
                        "bank": it.bank,
                        "branch": it.branch,
                        "principal": it.principal,
                    }
                    for it in items
                ],
            })

    return {
        "total_duplicates_found": len(duplicates),
        "duplicates": duplicates,
    }
