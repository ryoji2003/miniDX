from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas import schemas
from backend.core.database import get_db
from backend.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_setup_token,
    decode_token,
    get_current_admin,
)
from backend.core.config import settings
from backend.models.models import Staff

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def staff_login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    """スタッフログイン。パスワード未設定の場合は setup_required を返す。"""
    staff = db.query(Staff).filter(Staff.name == req.name).first()
    if not staff:
        raise HTTPException(status_code=401, detail="ユーザー名が見つかりません")

    # パスワード未設定 → 初回セットアップ用トークンを返す
    if staff.hashed_password is None:
        setup_token = create_setup_token(staff.id)
        return {
            "status": "setup_required",
            "setup_token": setup_token,
            "staff_id": staff.id,
            "staff_name": staff.name,
        }

    if not req.password or not verify_password(req.password, staff.hashed_password):
        raise HTTPException(status_code=401, detail="パスワードが間違っています")

    token = create_access_token({"sub": str(staff.id), "type": "staff"})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "staff_id": staff.id,
        "staff_name": staff.name,
    }


@router.post("/setup-password")
def setup_password(req: schemas.SetupPasswordRequest, db: Session = Depends(get_db)):
    """セットアップトークンを使って初回パスワードを設定する。"""
    payload = decode_token(req.setup_token)
    if payload.get("type") != "setup":
        raise HTTPException(status_code=400, detail="無効なセットアップトークンです")

    staff_id = int(payload.get("sub"))
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフが見つかりません")

    if len(req.new_password) < 4:
        raise HTTPException(status_code=400, detail="パスワードは4文字以上で設定してください")

    staff.hashed_password = hash_password(req.new_password)
    db.commit()

    token = create_access_token({"sub": str(staff.id), "type": "staff"})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "staff_id": staff.id,
        "staff_name": staff.name,
    }


@router.post("/admin-login")
def admin_login(req: schemas.AdminLoginRequest):
    """管理者ログイン（環境変数のADMIN_USERNAME/ADMIN_PASSWORDと照合）。"""
    if req.username != settings.ADMIN_USERNAME or req.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="ユーザー名またはパスワードが間違っています")

    token = create_access_token({"type": "admin", "sub": req.username})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "admin_name": req.username,
    }


@router.post("/staff/{staff_id}/reset-password")
def reset_staff_password(
    staff_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """管理者がスタッフのパスワードを未設定状態にリセットする。"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフが見つかりません")

    staff.hashed_password = None
    db.commit()
    return {"message": f"{staff.name} のパスワードをリセットしました"}
