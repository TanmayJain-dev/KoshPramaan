from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..clock import clock
from ..audit import record_event
from ..models import User
from ..auth import get_current_user, require_roles
from ..schemas import ClockResponse, ClockAdvanceRequest

router = APIRouter(prefix="/clock", tags=["Clock"])


@router.get("", response_model=ClockResponse)
def get_clock(db: Session = Depends(get_db)):
    state = clock.get_state(db)
    return ClockResponse(**state)


@router.post("/advance", response_model=ClockResponse)
def advance_clock(
    req: ClockAdvanceRequest,
    current_user: User = Depends(require_roles(["AICTE_ADMIN"])),
    db: Session = Depends(get_db),
):
    if not isinstance(current_user, User):
        current_user = db.query(User).filter(User.role == "AICTE_ADMIN").first()

    if not current_user or current_user.role != "AICTE_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied: AICTE HQ Admin required to advance clock.")

    result = clock.advance(db, req.days)
    record_event(
        db=db,
        actor=current_user.username if current_user else "admin",
        role=current_user.role if current_user else "AICTE_ADMIN",
        action="CLOCK_ADVANCE",
        payload={
            "days_advanced": req.days,
            "new_simulated_time": result["current_time_iso"],
            "total_days_elapsed": result["days_elapsed"],
        },
        ts_sim=result["current_time_iso"],
    )
    return ClockResponse(**result)


@router.post("/reset", response_model=ClockResponse)
def reset_clock(
    current_user: User = Depends(require_roles(["AICTE_ADMIN"])),
    db: Session = Depends(get_db),
):
    if not isinstance(current_user, User):
        current_user = db.query(User).filter(User.role == "AICTE_ADMIN").first()

    if not current_user or current_user.role != "AICTE_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied: AICTE HQ Admin required to reset clock.")


    result = clock.reset(db)
    record_event(
        db=db,
        actor=current_user.username if current_user else "admin",
        role=current_user.role if current_user else "AICTE_ADMIN",
        action="CLOCK_RESET",
        payload={"message": "Clock reset to baseline Day 0"},
        ts_sim=result["current_time_iso"],
    )
    return ClockResponse(**result)


