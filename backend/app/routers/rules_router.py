import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Rule, User
from ..auth import require_roles
from ..schemas import RuleOut

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get("", response_model=List[RuleOut])
def list_rules(
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "SCRUTINY_OFFICER", "REGIONAL_OFFICER"])),
    db: Session = Depends(get_db),
):
    if not isinstance(current_user, User):
        current_user = db.query(User).filter(User.role == "AICTE_ADMIN").first()

    if not current_user or current_user.role not in ["AICTE_ADMIN", "SCRUTINY_OFFICER", "REGIONAL_OFFICER"]:
        raise HTTPException(status_code=403, detail="Access denied: Rules are restricted to Officers and AICTE Admin.")

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
def get_rule(
    key: str,
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "SCRUTINY_OFFICER", "REGIONAL_OFFICER"])),
    db: Session = Depends(get_db),
):
    if not isinstance(current_user, User):
        current_user = db.query(User).filter(User.role == "AICTE_ADMIN").first()

    if not current_user or current_user.role not in ["AICTE_ADMIN", "SCRUTINY_OFFICER", "REGIONAL_OFFICER"]:
        raise HTTPException(status_code=403, detail="Access denied: Rules are restricted to Officers and AICTE Admin.")

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
