import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Rule
from ..schemas import RuleOut

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get("", response_model=List[RuleOut])
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(Rule).all()
    out = []
    for r in rules:
        try:
            val = json.loads(r.value_json)
        except Exception:
            val = {"raw": r.value_json}
        out.append(
            RuleOut(
                key=r.key,
                value=val,
                effective_year=r.effective_year,
                version=r.version,
            )
        )
    return out


@router.get("/{key}", response_model=RuleOut)
def get_rule(key: str, db: Session = Depends(get_db)):
    r = db.query(Rule).filter(Rule.key == key).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rule key not found")
    try:
        val = json.loads(r.value_json)
    except Exception:
        val = {"raw": r.value_json}
    return RuleOut(
        key=r.key,
        value=val,
        effective_year=r.effective_year,
        version=r.version,
    )
