from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import solver  # ★追加: ソルバーを読み込む
from database import engine, get_db

# データベースのテーブルを自動作成 (初回起動時)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS設定 (フロントエンドからのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# staticディレクトリ内のファイルを /static というURLで公開する設定
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 動作確認用 ---
@app.get("/")
def read_root():
    return {"message": "Shift App Backend is running!"}

#  Staff API (スタッフ管理)

@app.get("/api/staff", response_model=List[schemas.Staff])
def read_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Staff).offset(skip).limit(limit).all()

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

@app.delete("/api/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    db.delete(db_staff)
    db.commit()
    return {"message": "Deleted successfully"}

#  Skill & Task API (業務管理)

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

@app.delete("/api/task/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Deleted successfully"}

#  AbsenceRequest API (希望休)

@app.get("/api/absence", response_model=List[schemas.AbsenceRequest])
def read_absences(db: Session = Depends(get_db)):
    return db.query(models.AbsenceRequest).all()

@app.post("/api/absence", response_model=schemas.AbsenceRequest)
def create_absence(req: schemas.AbsenceRequestCreate, db: Session = Depends(get_db)):
    # 重複チェック
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

#  DailyRequirement API (日次要件)

@app.get("/api/requirements", response_model=List[schemas.DailyRequirement])
def read_requirements(db: Session = Depends(get_db)):
    return db.query(models.DailyRequirement).all()

@app.post("/api/requirements", response_model=schemas.DailyRequirement)
def create_or_update_requirement(req: schemas.DailyRequirementCreate, db: Session = Depends(get_db)):
    # 既存設定の検索
    existing = db.query(models.DailyRequirement).filter(
        models.DailyRequirement.date == req.date,
        models.DailyRequirement.task_id == req.task_id
    ).first()
    
    if existing:
        # 更新
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

#  シフト生成実行 API (★NEW)

@app.post("/api/generate-shift")
def generate_shift(req: schemas.GenerateRequest, db: Session = Depends(get_db)):
    """
    指定された年月のシフトを自動生成し、ExcelのダウンロードURLを返す
    """
    print(f"★シフト生成開始: {req.year}年{req.month}月")

    # 1. データベースから必要な全データを取得
    staffs = db.query(models.Staff).all()
    tasks = db.query(models.Task).all()
    absences = db.query(models.AbsenceRequest).all()
    requirements = db.query(models.DailyRequirement).all()

    # 2. ソルバー(solver.py)を呼び出して計算実行
    # 成功すれば Excelファイルのパス (例: "static/shift_2025_12_xxx.xlsx") と shift_data が返る
    excel_path, shift_data = solver.generate_shift_excel(
        staffs, tasks, requirements, absences, req.year, req.month
    )

    # 3. 結果の返却
    if excel_path:
        # ブラウザからアクセスできるURLに変換
        # excel_path は "static/shift..." なので、頭に "/" をつけるだけでOK
        download_url = "/" + excel_path
        return {
            "download_url": download_url,
            "shift_data": shift_data
        }
    else:
        # 解が見つからなかった場合
        raise HTTPException(
            status_code=400,
            detail="シフトを作成できませんでした。制約条件が厳しすぎるか、人が足りません。"
        )