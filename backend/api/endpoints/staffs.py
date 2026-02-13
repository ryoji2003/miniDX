from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.schemas import schemas
from backend.core.database import get_db
from backend.crud import crud_staff

router = APIRouter(prefix="/api", tags=["staff"])


@router.get("/staff", response_model=List[schemas.Staff])
def read_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_staff.get_staffs(db, skip=skip, limit=limit)


@router.post("/staff", response_model=schemas.Staff)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    return crud_staff.create_staff(db, staff)


@router.put("/staff/{staff_id}", response_model=schemas.Staff)
def update_staff(staff_id: int, staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = crud_staff.get_staff_by_id(db, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return crud_staff.update_staff(db, db_staff, staff)


@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = crud_staff.get_staff_by_id(db, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    crud_staff.delete_staff(db, db_staff)
    return {"message": "Deleted successfully"}
