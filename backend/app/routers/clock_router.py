from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..clock import clock
from ..audit import record_event
from ..schemas import ClockResponse, ClockAdvanceRequest

router = APIRouter(prefix="/clock", tags=["Clock"])


@router.get("", response_model=ClockResponse)
def get_clock(db: Session = Depends(get_db)):
    state = clock.get_state(db)
    return ClockResponse(**state)


@router.post("/advance", response_model=ClockResponse)
def advance_clock(
    req: ClockAdvanceRequest,
    x_user_role: str = Header(default="SYSTEM", alias="X-User-Role"),
    x_user_actor: str = Header(default="SYSTEM_CLOCK", alias="X-User-Actor"),
    db: Session = Depends(get_db),
):
    role = x_user_role if isinstance(x_user_role, str) else "SYSTEM"
    actor = x_user_actor if isinstance(x_user_actor, str) else "SYSTEM_CLOCK"
    result = clock.advance(db, req.days)
    record_event(
        db=db,
        actor=actor,
        role=role,
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
    x_user_role: str = Header(default="SYSTEM", alias="X-User-Role"),
    x_user_actor: str = Header(default="SYSTEM_CLOCK", alias="X-User-Actor"),
    db: Session = Depends(get_db),
):
    role = x_user_role if isinstance(x_user_role, str) else "SYSTEM"
    actor = x_user_actor if isinstance(x_user_actor, str) else "SYSTEM_CLOCK"
    result = clock.reset(db)
    record_event(
        db=db,
        actor=actor,
        role=role,
        action="CLOCK_RESET",
        payload={"message": "Clock reset to baseline Day 0"},
        ts_sim=result["current_time_iso"],
    )
    return ClockResponse(**result)

