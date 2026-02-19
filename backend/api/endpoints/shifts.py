from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.schemas import schemas
from backend.core.database import get_db
from backend.core.logging import get_logger
from backend.crud import crud_shift
from backend.solver import engine as shift_solver

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

    excel_path, shift_data = shift_solver.generate_shift_excel(
        staffs, tasks, requirements, absences, req.year, req.month, holidays
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
