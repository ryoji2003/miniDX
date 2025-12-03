from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# DB初期化
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# フロントエンド用設定
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"message": "Shift App Backend is running!"}

# --- Staff API ---
# 一覧取得
@app.get("/api/staff", response_model=List[schemas.Staff])
def read_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Staff).offset(skip).limit(limit).all()

# 新規登録
@app.post("/api/staff", response_model=schemas.Staff)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = models.Staff(
        name=staff.name,
        work_limit=staff.work_limit,
        license_type=staff.license_type,
        is_part_time=staff.is_part_time,
        can_only_train=staff.can_only_train,
        is_nurse=staff.is_nurse
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

# 編集
@app.put("/api/staff/{staff_id}", response_model=schemas.Staff)
def update_staff(staff_id: int, staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    # 値を更新
    db_staff.name = staff.name
    db_staff.work_limit = staff.work_limit
    db_staff.license_type = staff.license_type
    db_staff.is_part_time = staff.is_part_time
    db_staff.can_only_train = staff.can_only_train
    db_staff.is_nurse = staff.is_nurse
    
    db.commit()
    db.refresh(db_staff)
    return db_staff

# 削除
@app.delete("/api/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    db.delete(db_staff)
    db.commit()
    return {"message": "Deleted successfully"}

# --- Skill & Task API ---
@app.post("/api/skill", response_model=schemas.Skill)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    db_skill = models.Skill(name=skill.name)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@app.get("/api/skill", response_model=List[schemas.Skill])
def read_skills(db: Session = Depends(get_db)):
    return db.query(models.Skill).all()

@app.post("/api/task", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(name=task.name, required_skill_id=task.required_skill_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/api/task", response_model=List[schemas.Task])
def read_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()