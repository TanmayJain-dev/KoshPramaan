import hashlib
import json
from typing import Any, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from .models import Event
from .clock import clock

GENESIS_HASH = "0" * 64


def canonical_json(data: Any) -> str:
    """Produces a deterministic, canonical JSON string."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def compute_event_hash(prev_hash: str, ts_sim: str, actor: str, action: str, payload_json: str) -> str:
    """Computes SHA-256 hash according to the formula:
    hash = SHA256(prev_hash + ts_sim + actor + action + payload_json)
    """
    to_hash = f"{prev_hash}{ts_sim}{actor}{action}{payload_json}".encode("utf-8")
    return hashlib.sha256(to_hash).hexdigest()


def record_event(
    db: Session,
    actor: str,
    role: str,
    action: str,
    payload: Dict[str, Any],
    ts_sim: Optional[str] = None,
) -> Event:
    """Appends an event to the tamper-evident hash-chained audit log."""
    if ts_sim is None:
        ts_sim = clock.now_iso(db)

    payload_json = canonical_json(payload)

    # Get last event in chain
    last_event = db.query(Event).order_by(Event.id.desc()).first()
    prev_hash = last_event.hash if last_event else GENESIS_HASH

    event_hash = compute_event_hash(
        prev_hash=prev_hash,
        ts_sim=ts_sim,
        actor=actor,
        action=action,
        payload_json=payload_json,
    )

    event = Event(
        ts_sim=ts_sim,
        actor=actor,
        role=role,
        action=action,
        payload=payload_json,
        prev_hash=prev_hash,
        hash=event_hash,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def verify_chain(db: Session) -> Dict[str, Any]:
    """Verifies the entire event hash chain from genesis to tip.
    Returns chain validity, total events, latest hash, and first broken index if invalid.
    """
    events = db.query(Event).order_by(Event.id.asc()).all()

    if not events:
        return {
            "valid": True,
            "broken_index": None,
            "total_events": 0,
            "latest_hash": GENESIS_HASH,
            "message": "Empty audit chain (Genesis state)",
        }

    expected_prev_hash = GENESIS_HASH

    for idx, event in enumerate(events):
        # 1. Verify prev_hash link
        if event.prev_hash != expected_prev_hash:
            return {
                "valid": False,
                "broken_index": event.id,
                "chain_position": idx,
                "reason": "Previous hash link mismatch",
                "expected_prev_hash": expected_prev_hash,
                "recorded_prev_hash": event.prev_hash,
                "total_events": len(events),
            }

        # 2. Recompute hash
        computed = compute_event_hash(
            prev_hash=event.prev_hash,
            ts_sim=event.ts_sim,
            actor=event.actor,
            action=event.action,
            payload_json=event.payload,
        )

        if computed != event.hash:
            return {
                "valid": False,
                "broken_index": event.id,
                "chain_position": idx,
                "reason": "Event content tampered / hash mismatch",
                "computed_hash": computed,
                "recorded_hash": event.hash,
                "total_events": len(events),
            }

        expected_prev_hash = event.hash

    return {
        "valid": True,
        "broken_index": None,
        "total_events": len(events),
        "latest_hash": events[-1].hash,
        "message": "Cryptographic audit chain fully verified",
    }
