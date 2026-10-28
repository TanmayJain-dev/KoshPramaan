from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserOut, DemoUserOut, LoginRequest, LoginResponse
from ..auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

ROLE_METADATA = {
    "INSTITUTION_MAKER": {
        "role_name": "Institution Maker",
        "badge": "College Maker",
        "description": "Creates/edits draft FDR claims, uploads scan proofs, sees own discrepancy locks, submits to Checker.",
    },
    "INSTITUTION_CHECKER": {
        "role_name": "Institution Checker",
        "badge": "College Checker",
        "description": "Reviews queue of Maker submissions, approves or sends back with remarks. Cannot approve own submissions.",
    },
    "REGIONAL_OFFICER": {
        "role_name": "Regional Officer (RO)",
        "badge": "Regional Authority",
        "description": "Review queue of Checker-approved claims for their region, SLA timers, bank status, approve/reject, decay watchlist.",
    },
    "SCRUTINY_OFFICER": {
        "role_name": "Scrutiny / Vigilance Officer",
        "badge": "National Scrutiny",
        "description": "Cross-region duplicate fingerprint detector, forensics risk signals, liabilities/grievances, audit ledger verification.",
    },
    "BANK_VERIFIER": {
        "role_name": "Bank Verifier",
        "badge": "Bank Attestation",
        "description": "Reconciles FDRs assigned to their specific bank, confirms Core Banking matches or flags discrepancies.",
    },
    "AICTE_ADMIN": {
        "role_name": "AICTE HQ Admin",
        "badge": "HQ Administrator",
        "description": "National multi-region dashboard, versioned rules governance, and exclusive Demo Time-Machine & Tamper Controls.",
    },
}


@router.get("/demo-users", response_model=List[DemoUserOut])
def get_demo_users(db: Session = Depends(get_db)):
    """Returns all seeded demo personas with their role scopes, organizations, and descriptions."""
    users = db.query(User).all()
    out = []
    for u in users:
        meta = ROLE_METADATA.get(u.role, {
            "role_name": u.role,
            "badge": u.role,
            "description": "System User",
        })
        out.append(
            DemoUserOut(
                id=u.id,
                username=u.username,
                name=u.name,
                role=u.role,
                role_name=meta["role_name"],
                org_name=u.org_name or u.institution_id or "AICTE",
                badge=meta["badge"],
                description=meta["description"],
                institution_id=u.institution_id,
                region=u.region,
                bank=u.bank,
            )
        )
    return out


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Demo login endpoint: generates a signed JWT token containing role, user_id, institution, region and bank."""
    query = db.query(User).filter((User.username == req.username) | (User.id == req.username) | (User.role == req.username))
    user = query.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{req.username}' not found. Please pick from /auth/demo-users.",
        )

    token_data = {
        "sub": user.id,
        "user_id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "institution_id": user.institution_id,
        "region": user.region,
        "bank": user.bank,
        "verifier_id": user.verifier_id,
    }
    token = create_access_token(token_data)

    user_out = UserOut(
        id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        institution_id=user.institution_id,
        region=user.region,
        bank=user.bank,
        verifier_id=user.verifier_id,
        designation=user.designation,
        org_name=user.org_name,
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user_out,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile of currently authenticated user from JWT token."""
    return UserOut(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        institution_id=current_user.institution_id,
        region=current_user.region,
        bank=current_user.bank,
        verifier_id=current_user.verifier_id,
        designation=current_user.designation,
        org_name=current_user.org_name,
    )
