from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.schemas import schemas
from backend.core.database import get_db
from backend.crud import crud_task

router = APIRouter(prefix="/api", tags=["tasks"])


# --- Skill ---

@router.post("/skill", response_model=schemas.Skill)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    return crud_task.create_skill(db, skill)


@router.get("/skill", response_model=List[schemas.Skill])
def read_skills(db: Session = Depends(get_db)):
    return crud_task.get_skills(db)


# --- Task ---

@router.post("/task", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud_task.create_task(db, task)


@router.get("/task", response_model=List[schemas.Task])
def read_tasks(db: Session = Depends(get_db)):
    return crud_task.get_tasks(db)


@router.delete("/task/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = crud_task.get_task_by_id(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    crud_task.delete_task(db, db_task)
    return {"message": "Deleted successfully"}
