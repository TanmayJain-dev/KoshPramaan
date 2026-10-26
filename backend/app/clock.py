from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .models import SystemState
from .database import SessionLocal

BASE_SIMULATED_TIME = "2026-04-01T09:00:00+05:30"
CLOCK_KEY_TIME = "clock_current_time"
CLOCK_KEY_DAYS = "clock_days_elapsed"


class ClockService:
    def __init__(self, base_time_iso: str = BASE_SIMULATED_TIME):
        self.base_time_iso = base_time_iso

    def get_state(self, db: Session) -> dict:
        time_record = db.query(SystemState).filter(SystemState.key == CLOCK_KEY_TIME).first()
        days_record = db.query(SystemState).filter(SystemState.key == CLOCK_KEY_DAYS).first()

        if not time_record:
            time_record = SystemState(key=CLOCK_KEY_TIME, value=self.base_time_iso)
            db.add(time_record)
        if not days_record:
            days_record = SystemState(key=CLOCK_KEY_DAYS, value="0")
            db.add(days_record)
        db.commit()

        return {
            "current_time_iso": time_record.value,
            "days_elapsed": int(days_record.value),
            "base_time_iso": self.base_time_iso,
        }

    def now(self, db: Session = None) -> datetime:
        """Returns the current simulated datetime. Backend logic MUST call this, never system time."""
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True
        try:
            state = self.get_state(db)
            return datetime.fromisoformat(state["current_time_iso"])
        finally:
            if should_close:
                db.close()

    def now_iso(self, db: Session = None) -> str:
        """Returns the current simulated ISO string."""
        return self.now(db).isoformat()

    def advance(self, db: Session, days: int) -> dict:
        """Advance the simulated clock by given days."""
        if days < 0:
            raise ValueError("Days to advance must be non-negative")

        state = self.get_state(db)
        curr_dt = datetime.fromisoformat(state["current_time_iso"])
        new_dt = curr_dt + timedelta(days=days)
        new_days = state["days_elapsed"] + days

        time_record = db.query(SystemState).filter(SystemState.key == CLOCK_KEY_TIME).first()
        days_record = db.query(SystemState).filter(SystemState.key == CLOCK_KEY_DAYS).first()

        time_record.value = new_dt.isoformat()
        days_record.value = str(new_days)
        db.commit()

        return {
            "current_time_iso": new_dt.isoformat(),
            "days_elapsed": new_days,
            "advanced_by": days,
            "base_time_iso": self.base_time_iso,
        }

    def reset(self, db: Session) -> dict:
        """Reset the simulated clock to baseline Day 0."""
        time_record = db.query(SystemState).filter(SystemState.key == CLOCK_KEY_TIME).first()
        days_record = db.query(SystemState).filter(SystemState.key == CLOCK_KEY_DAYS).first()

        if time_record:
            time_record.value = self.base_time_iso
        else:
            db.add(SystemState(key=CLOCK_KEY_TIME, value=self.base_time_iso))

        if days_record:
            days_record.value = "0"
        else:
            db.add(SystemState(key=CLOCK_KEY_DAYS, value="0"))

        db.commit()

        return {
            "current_time_iso": self.base_time_iso,
            "days_elapsed": 0,
            "advanced_by": 0,
            "base_time_iso": self.base_time_iso,
        }


# Global Clock instance
clock = ClockService()
