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

@app.get("/api/absence", response_model=List[schemas.AbsenceRequest])
def read_absences(db: Session = Depends(get_db)):
    # 全員の希望休を返します
    return db.query(models.AbsenceRequest).all()

@app.post("/api/absence", response_model=schemas.AbsenceRequest)
def create_absence(req: schemas.AbsenceRequestCreate, db: Session = Depends(get_db)):
    # 重複チェック: 同じスタッフが同じ日に申請済みなら、既存のデータを返す(何もしない)
    existing = db.query(models.AbsenceRequest).filter(
        models.AbsenceRequest.staff_id == req.staff_id,
        models.AbsenceRequest.date == req.date
    ).first()
    
    if existing:
        return existing

    db_req = models.AbsenceRequest(staff_id=req.staff_id, date=req.date)
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@app.delete("/api/absence/{id}")
def delete_absence(id: int, db: Session = Depends(get_db)):
    db_req = db.query(models.AbsenceRequest).filter(models.AbsenceRequest.id == id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Not found")
    
    db.delete(db_req)
    db.commit()
    return {"message": "Deleted successfully"}


#  日次要件 API (DailyRequirement)
@app.get("/api/requirements", response_model=List[schemas.DailyRequirement])
def read_requirements(db: Session = Depends(get_db)):
    return db.query(models.DailyRequirement).all()

@app.post("/api/requirements", response_model=schemas.DailyRequirement)
def create_or_update_requirement(req: schemas.DailyRequirementCreate, db: Session = Depends(get_db)):
    # 「ある日付」の「ある業務」の要件が既に登録されているか探す
    existing = db.query(models.DailyRequirement).filter(
        models.DailyRequirement.date == req.date,
        models.DailyRequirement.task_id == req.task_id
    ).first()
    
    if existing:
        # 既に設定があれば、人数を更新(上書き)
        existing.count = req.count
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # 新規作成
        db_req = models.DailyRequirement(date=req.date, task_id=req.task_id, count=req.count)
        db.add(db_req)
        db.commit()
        db.refresh(db_req)
        return db_req