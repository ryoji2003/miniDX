from sqlalchemy.orm import Session
from backend.models.models import (
    Staff, Task, AbsenceRequest, DailyRequirement,
)
from backend.schemas.schemas import AbsenceRequestCreate, DailyRequirementCreate


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


# --- Shift generation data ---

def get_all_shift_data(db: Session):
    """Fetch all data needed for shift generation."""
    staffs = db.query(Staff).all()
    tasks = db.query(Task).all()
    absences = db.query(AbsenceRequest).all()
    requirements = db.query(DailyRequirement).all()
    return staffs, tasks, absences, requirements
