from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..seed import seed_database
from ..clock import clock
from ..audit import verify_chain
from ..models import Institution, FDR, Verifier, User
from ..auth import require_roles, get_current_user
from ..adapters import mock_bank, mock_grievance, mock_vigilance, mock_esign

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/reset")
def reset_demo_state(
    current_user: User = Depends(require_roles(["AICTE_ADMIN"])),
    db: Session = Depends(get_db),
):
    if current_user.role != "AICTE_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied: AICTE HQ Admin required to reset demo state.")
    result = seed_database(db)
    return result


@router.get("/status")
def get_demo_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns portal health, clock, audit chain status, and mocked adapter connections."""
    clock_st = clock.get_state(db)
    audit_st = verify_chain(db)
    inst_count = db.query(Institution).count()
    fdr_count = db.query(FDR).count()
    verifier_count = db.query(Verifier).count()

    return {
        "system": "KoshPramaan (कोष-प्रमाण)",
        "phase": "Phase 1: Foundations",
        "honesty_badge": "Demo data, mocked integrations",
        "clock": clock_st,
        "audit_chain": audit_st,
        "counts": {
            "institutions": inst_count,
            "fdrs": fdr_count,
            "verifiers": verifier_count,
        },
        "adapters": {
            "bank": mock_bank.health_check(),
            "grievance": mock_grievance.health_check(),
            "vigilance": mock_vigilance.health_check(),
            "esign": mock_esign.health_check(),
        },
    }
