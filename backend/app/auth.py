import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import jwt
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

_DEFAULT_JWT_SECRET = "koshpramaan-sih-2026-secret-key-salt"
if "JWT_SECRET" not in os.environ or not os.environ["JWT_SECRET"]:
    print("\n" + "=" * 78)
    print("⚠️  [SECURITY WARNING] JWT_SECRET environment variable is unset!")
    print("⚠️  Using insecure demo default secret key: 'koshpramaan-sih-2026-secret-key-salt'")
    print("⚠️  DO NOT USE IN PRODUCTION! Set JWT_SECRET in production deployment.")
    print("=" * 78 + "\n")
    JWT_SECRET = _DEFAULT_JWT_SECRET
else:
    JWT_SECRET = os.environ["JWT_SECRET"]

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))


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
    db: Session = Depends(get_db),
) -> User:
    """Strict JWT-only authentication dependency. Rejects any missing, forged, or header-bypass requests."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided. Valid Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token does not exist.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{current_user.role}' is not authorized to access this resource. Required roles: {allowed_roles}",
            )
        return current_user

    return role_checker
