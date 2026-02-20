from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.schemas import schemas
from backend.core.database import get_db
from backend.core.logging import get_logger
from backend.crud import crud_shift
from backend.solver import engine as shift_solver
from backend.core.auth import get_current_admin

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["shifts"])


# AbsenceRequest
@router.get("/absence", response_model=List[schemas.AbsenceRequest])
def read_absences(db: Session = Depends(get_db)):
    return crud_shift.get_absences(db)


@router.post("/absence", response_model=schemas.AbsenceRequest)
def create_absence(req: schemas.AbsenceRequestCreate, db: Session = Depends(get_db)):
    existing = crud_shift.get_absence_duplicate(db, req.staff_id, req.date)
    if existing:
        return existing
    return crud_shift.create_absence(db, req)


@router.delete("/absence/{id}")
def delete_absence(id: int, db: Session = Depends(get_db)):
    db_req = crud_shift.get_absence_by_id(db, id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Not found")
    crud_shift.delete_absence(db, db_req)
    return {"message": "Deleted successfully"}

# DailyRequirement

@router.get("/requirements", response_model=List[schemas.DailyRequirement])
def read_requirements(db: Session = Depends(get_db)):
    return crud_shift.get_requirements(db)


@router.post("/requirements", response_model=schemas.DailyRequirement)
def create_or_update_requirement(req: schemas.DailyRequirementCreate, db: Session = Depends(get_db)):
    existing = crud_shift.get_requirement_by_date_task(db, req.date, req.task_id)
    if existing:
        return crud_shift.update_requirement(db, existing, req.count)
    else:
        return crud_shift.create_requirement(db, req)

# Holiday (施設休日)

@router.get("/holidays", response_model=List[schemas.Holiday])
def read_holidays(year: int, month: int, db: Session = Depends(get_db)):
    return crud_shift.get_holidays(db, year, month)


@router.post("/holidays", response_model=schemas.Holiday)
def create_holiday(holiday: schemas.HolidayCreate, db: Session = Depends(get_db)):
    existing = crud_shift.get_holiday_by_date(db, holiday.date)
    if existing:
        return existing
    return crud_shift.create_holiday(db, holiday)


@router.delete("/holidays/{date}")
def delete_holiday(date: str, db: Session = Depends(get_db)):
    db_holiday = crud_shift.delete_holiday(db, date)
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted successfully"}


# Shift Generation

@router.post("/generate-shift")
def generate_shift(req: schemas.GenerateRequest, db: Session = Depends(get_db)):
    """指定された年月のシフトを自動生成し、ExcelのダウンロードURLを返す"""
    logger.info("シフト生成開始: %d年%d月", req.year, req.month)

    staffs, tasks, absences, requirements, holidays = crud_shift.get_all_shift_data(db)

    # 月間公休設定を取得
    rest_setting = crud_shift.get_monthly_rest_setting(db, req.year, req.month)
    additional_days = rest_setting.additional_days if rest_setting else None

    excel_path, shift_data = shift_solver.generate_shift_excel(
        staffs, tasks, requirements, absences, req.year, req.month, holidays,
        additional_days=additional_days
    )

    if excel_path:
        download_url = "/" + excel_path
        return {
            "download_url": download_url,
            "shift_data": shift_data,
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="シフトを作成できませんでした。制約条件が厳しすぎるか、人が足りません。",
        )


# Monthly Rest Day Setting (月間公休設定)

@router.get("/monthly-rest-setting", response_model=schemas.MonthlyRestDaySetting)
def get_monthly_rest_setting(year: int, month: int, db: Session = Depends(get_db)):
    """指定年月の公休設定を取得"""
    setting = crud_shift.get_monthly_rest_setting(db, year, month)
    if not setting:
        raise HTTPException(status_code=404, detail="設定が見つかりません")
    return setting


@router.post("/monthly-rest-setting", response_model=schemas.MonthlyRestDaySetting)
def upsert_monthly_rest_setting(
    req: schemas.MonthlyRestDaySettingCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """月間公休設定を登録・更新（管理者のみ）"""
    return crud_shift.upsert_monthly_rest_setting(db, req.year, req.month, req.additional_days)
