import json
from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Event
from ..audit import verify_chain
from ..schemas import AuditVerifyResponse, EventOut

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/verify", response_model=AuditVerifyResponse)
def get_audit_verify(db: Session = Depends(get_db)):
    result = verify_chain(db)
    return AuditVerifyResponse(**result)


@router.get("/events", response_model=List[EventOut])
def list_events(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    events = db.query(Event).order_by(Event.id.desc()).limit(limit).all()
    out = []
    for e in events:
        try:
            payload_dict = json.loads(e.payload)
        except Exception:
            payload_dict = {"raw": e.payload}
        out.append(
            EventOut(
                id=e.id,
                ts_sim=e.ts_sim,
                actor=e.actor,
                role=e.role,
                action=e.action,
                payload=payload_dict,
                prev_hash=e.prev_hash,
                hash=e.hash,
            )
        )
    return out


@router.post("/tamper-demo")
def simulate_tampering(
    event_id: int = Query(..., description="ID of event to subtly tamper with in sandbox"),
    db: Session = Depends(get_db),
):
    """Simulates unauthorized database tampering by mutating the payload of an event without recalculating hashes."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    try:
        data = json.loads(event.payload)
        data["_tampered_flag"] = "MALICIOUS_MODIFICATION"
        event.payload = json.dumps(data)
    except Exception:
        event.payload = event.payload + "_TAMPERED"

    db.commit()
    return {
        "status": "tampered",
        "tampered_event_id": event_id,
        "message": "Event payload maliciously modified. Running GET /audit/verify will now fail at this index.",
    }
