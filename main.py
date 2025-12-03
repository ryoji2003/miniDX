from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# データベースのテーブルを自動作成 (初回起動時)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- 動作確認用 ---
@app.get("/")
def read_root():
    return {"message": "Shift App Backend is running!"}

# --- Staff API ---
# スタッフ一覧取得
@app.get("/api/staff", response_model=List[schemas.Staff])
def read_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    staffs = db.query(models.Staff).offset(skip).limit(limit).all()
    return staffs

# スタッフ新規登録
@app.post("/api/staff", response_model=schemas.Staff)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = models.Staff(name=staff.name, work_limit=staff.work_limit)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

# --- Skill API ---
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

# --- Task API ---
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