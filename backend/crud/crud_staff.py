from sqlalchemy.orm import Session
from backend.models.models import Staff
from backend.schemas.schemas import StaffCreate


def get_staffs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Staff).offset(skip).limit(limit).all()


def get_staff_by_id(db: Session, staff_id: int):
    return db.query(Staff).filter(Staff.id == staff_id).first()


def create_staff(db: Session, staff: StaffCreate):
    db_staff = Staff(
        name=staff.name,
        work_limit=staff.work_limit,
        license_type=staff.license_type,
        is_part_time=staff.is_part_time,
        can_only_train=staff.can_only_train,
        is_nurse=staff.is_nurse,
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


def update_staff(db: Session, db_staff: Staff, staff: StaffCreate):
    db_staff.name = staff.name
    db_staff.work_limit = staff.work_limit
    db_staff.license_type = staff.license_type
    db_staff.is_part_time = staff.is_part_time
    db_staff.can_only_train = staff.can_only_train
    db_staff.is_nurse = staff.is_nurse
    db.commit()
    db.refresh(db_staff)
    return db_staff


def delete_staff(db: Session, db_staff: Staff):
    db.delete(db_staff)
    db.commit()
