import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import jwt
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

JWT_SECRET = os.getenv("JWT_SECRET", "koshpramaan-sih-2026-secret-key-salt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None


def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_institution_id: Optional[str] = Header(None, alias="X-Institution-Id"),
    x_user_actor: Optional[str] = Header(None, alias="X-User-Actor"),
    db: Session = Depends(get_db),
) -> User:
    # 1. Bearer Token Authentication
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and "user_id" in payload:
            user = db.query(User).filter(User.id == payload["user_id"]).first()
            if user:
                return user

    # 2. Seamless Header Fallback (for testing / backward compatibility)
    if x_user_role:
        normalized_role = x_user_role.upper()
        # Map legacy roles if passed
        role_map = {
            "INSTITUTION": "INSTITUTION_MAKER",
            "SCRUTINY_OFFICER": "SCRUTINY_OFFICER",
            "ASSISTANT_DIRECTOR": "INSTITUTION_CHECKER",
            "REGIONAL_OFFICER": "REGIONAL_OFFICER",
            "SYSTEM": "AICTE_ADMIN",
            "ADMIN": "AICTE_ADMIN",
        }
        target_role = role_map.get(normalized_role, normalized_role)

        query = db.query(User).filter(User.role == target_role)
        if x_institution_id and target_role in ["INSTITUTION_MAKER", "INSTITUTION_CHECKER"]:
            query = query.filter(User.institution_id == x_institution_id)
        
        user = query.first()
        if user:
            return user
        
        # If user not found in DB, search by first user of role
        fallback_user = db.query(User).filter(User.role == target_role).first()
        if fallback_user:
            return fallback_user

    # 3. Default to AICTE_ADMIN or raise 401 if unauthenticated
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials not provided. Please log in or provide Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{current_user.role}' is not authorized to access this resource. Required roles: {allowed_roles}",
            )
        return current_user

    return role_checker
