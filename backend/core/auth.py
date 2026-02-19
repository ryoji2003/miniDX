from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import get_db

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
SETUP_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_hours: int = ACCESS_TOKEN_EXPIRE_HOURS) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=expires_hours)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_setup_token(staff_id: int) -> str:
    """初回パスワード設定用の短命トークンを生成"""
    expire = datetime.utcnow() + timedelta(minutes=SETUP_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(staff_id), "type": "setup", "exp": expire},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効または期限切れのトークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """スタッフ認証が必要なエンドポイント用の依存関係"""
    from backend.models.models import Staff

    payload = decode_token(credentials.credentials)
    if payload.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="スタッフ用のトークンが必要です",
        )
    staff_id = payload.get("sub")
    if staff_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="無効なトークンです")
    try:
        staff = db.query(Staff).filter(Staff.id == int(staff_id)).first()
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="無効なトークンです")
    if staff is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="スタッフが見つかりません")
    return staff


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """管理者認証が必要なエンドポイント用の依存関係"""
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です",
        )
    return payload
