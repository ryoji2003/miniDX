from sqlalchemy.orm import Session
from backend.models.models import (
    Staff, Task, AbsenceRequest, DailyRequirement, RequestedDayOff, Holiday,
    MonthlyRestDaySetting,
)
from backend.schemas.schemas import AbsenceRequestCreate, DailyRequirementCreate, HolidayCreate


# --- AbsenceRequest ---

def get_absences(db: Session):
    return db.query(AbsenceRequest).all()


def get_absence_duplicate(db: Session, staff_id: int, date: str):
    return db.query(AbsenceRequest).filter(
        AbsenceRequest.staff_id == staff_id,
        AbsenceRequest.date == date,
    ).first()


def create_absence(db: Session, req: AbsenceRequestCreate):
    db_req = AbsenceRequest(staff_id=req.staff_id, date=req.date)
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req


def get_absence_by_id(db: Session, absence_id: int):
    return db.query(AbsenceRequest).filter(AbsenceRequest.id == absence_id).first()


def delete_absence(db: Session, db_req: AbsenceRequest):
    db.delete(db_req)
    db.commit()


# --- DailyRequirement ---

def get_requirements(db: Session):
    return db.query(DailyRequirement).all()


def get_requirement_by_date_task(db: Session, date: str, task_id: int):
    return db.query(DailyRequirement).filter(
        DailyRequirement.date == date,
        DailyRequirement.task_id == task_id,
    ).first()


def create_requirement(db: Session, req: DailyRequirementCreate):
    db_req = DailyRequirement(date=req.date, task_id=req.task_id, count=req.count)
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req


def update_requirement(db: Session, existing: DailyRequirement, count: int):
    existing.count = count
    db.commit()
    db.refresh(existing)
    return existing


# --- Holiday (施設休日) ---

def get_holidays(db: Session, year: int, month: int):
    """指定年月の休日一覧を取得"""
    prefix = f"{year}-{str(month).zfill(2)}-"
    return db.query(Holiday).filter(Holiday.date.startswith(prefix)).all()


def create_holiday(db: Session, holiday: HolidayCreate):
    """休日を登録"""
    db_holiday = Holiday(date=holiday.date, description=holiday.description)
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday


def get_holiday_by_date(db: Session, date: str):
    """指定日の休日レコードを取得"""
    return db.query(Holiday).filter(Holiday.date == date).first()


def delete_holiday(db: Session, date: str):
    """休日を削除"""
    db_holiday = get_holiday_by_date(db, date)
    if db_holiday:
        db.delete(db_holiday)
        db.commit()
    return db_holiday


def is_holiday(db: Session, date: str) -> bool:
    """指定日が休日か判定"""
    return get_holiday_by_date(db, date) is not None


# --- MonthlyRestDaySetting ---

def get_monthly_rest_setting(db: Session, year: int, month: int):
    return db.query(MonthlyRestDaySetting).filter(
        MonthlyRestDaySetting.year == year,
        MonthlyRestDaySetting.month == month,
    ).first()


def upsert_monthly_rest_setting(db: Session, year: int, month: int, additional_days: int):
    existing = get_monthly_rest_setting(db, year, month)
    if existing:
        existing.additional_days = additional_days
        db.commit()
        db.refresh(existing)
        return existing
    else:
        setting = MonthlyRestDaySetting(year=year, month=month, additional_days=additional_days)
        db.add(setting)
        db.commit()
        db.refresh(setting)
        return setting


# --- Shift generation data ---

def get_all_shift_data(db: Session):
    """Fetch all data needed for shift generation."""
    staffs = db.query(Staff).all()
    tasks = db.query(Task).all()
    approved_requests = db.query(RequestedDayOff).filter(RequestedDayOff.status == "approved").all()

    class MockAbsence:
        def __init__(self, staff_id, date_str):
            self.staff_id = staff_id
            self.date = date_str

    absences = [MockAbsence(r.staff_id, r.request_date.strftime("%Y-%m-%d")) for r in approved_requests]
    requirements = db.query(DailyRequirement).all()
    holidays = db.query(Holiday).all()
    return staffs, tasks, absences, requirements, holidays
