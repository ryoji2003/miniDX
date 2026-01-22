from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime
from collections import defaultdict

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


# ============================================================
#  RequestedDayOff API (休暇申請 - Staff Interface)
# ============================================================

@app.post("/api/staff/requested-days-off", response_model=schemas.RequestedDayOff)
def create_day_off_request(req: schemas.RequestedDayOffCreate, db: Session = Depends(get_db)):
    """Submit a single day-off request"""
    # Validate staff exists
    staff = db.query(models.Staff).filter(models.Staff.id == req.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    # Validate date is not in the past
    if req.request_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot request day off for past dates")

    # Check for duplicate requests
    existing = db.query(models.RequestedDayOff).filter(
        models.RequestedDayOff.staff_id == req.staff_id,
        models.RequestedDayOff.request_date == req.request_date
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Day-off request already exists for this date")

    db_req = models.RequestedDayOff(
        staff_id=req.staff_id,
        request_date=req.request_date,
        reason=req.reason
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)

    # Add staff name for response
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name
    return result


@app.post("/api/staff/requested-days-off/bulk", response_model=List[schemas.RequestedDayOff])
def create_bulk_day_off_requests(req: schemas.RequestedDayOffBulkCreate, db: Session = Depends(get_db)):
    """Submit multiple day-off requests at once (for date range selection)"""
    # Validate staff exists
    staff = db.query(models.Staff).filter(models.Staff.id == req.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    created_requests = []
    for request_date in req.request_dates:
        # Skip past dates
        if request_date < date.today():
            continue

        # Skip existing requests
        existing = db.query(models.RequestedDayOff).filter(
            models.RequestedDayOff.staff_id == req.staff_id,
            models.RequestedDayOff.request_date == request_date
        ).first()

        if existing:
            continue

        db_req = models.RequestedDayOff(
            staff_id=req.staff_id,
            request_date=request_date,
            reason=req.reason
        )
        db.add(db_req)
        created_requests.append(db_req)

    db.commit()

    # Refresh and add staff names
    results = []
    for db_req in created_requests:
        db.refresh(db_req)
        result = schemas.RequestedDayOff.model_validate(db_req)
        result.staff_name = staff.name
        results.append(result)

    return results


@app.get("/api/staff/requested-days-off", response_model=List[schemas.RequestedDayOff])
def get_staff_day_off_requests(
    staff_id: int = Query(..., description="Staff ID to filter by"),
    status: Optional[str] = Query(None, description="Filter by status: pending/approved/rejected"),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month"),
    db: Session = Depends(get_db)
):
    """Get day-off requests for a specific staff member"""
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    query = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.staff_id == staff_id)

    if status:
        query = query.filter(models.RequestedDayOff.status == status)

    if year and month:
        # Filter by year-month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        query = query.filter(
            models.RequestedDayOff.request_date >= start_date,
            models.RequestedDayOff.request_date < end_date
        )

    requests = query.order_by(models.RequestedDayOff.request_date).all()

    results = []
    for req in requests:
        result = schemas.RequestedDayOff.model_validate(req)
        result.staff_name = staff.name
        results.append(result)

    return results


@app.get("/api/staff/requested-days-off/{request_id}", response_model=schemas.RequestedDayOff)
def get_day_off_request_detail(request_id: int, db: Session = Depends(get_db)):
    """Get details of a specific day-off request"""
    db_req = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    staff = db.query(models.Staff).filter(models.Staff.id == db_req.staff_id).first()
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@app.put("/api/staff/requested-days-off/{request_id}", response_model=schemas.RequestedDayOff)
def update_day_off_request(
    request_id: int,
    update: schemas.RequestedDayOffUpdate,
    db: Session = Depends(get_db)
):
    """Update a pending day-off request (only pending requests can be modified)"""
    db_req = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    if db_req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be modified")

    if update.request_date is not None:
        if update.request_date < date.today():
            raise HTTPException(status_code=400, detail="Cannot request day off for past dates")

        # Check for duplicate
        existing = db.query(models.RequestedDayOff).filter(
            models.RequestedDayOff.staff_id == db_req.staff_id,
            models.RequestedDayOff.request_date == update.request_date,
            models.RequestedDayOff.id != request_id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Day-off request already exists for this date")

        db_req.request_date = update.request_date

    if update.reason is not None:
        db_req.reason = update.reason

    db_req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_req)

    staff = db.query(models.Staff).filter(models.Staff.id == db_req.staff_id).first()
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@app.delete("/api/staff/requested-days-off/{request_id}")
def delete_day_off_request(request_id: int, db: Session = Depends(get_db)):
    """Delete a day-off request (only pending requests can be deleted)"""
    db_req = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    if db_req.status == "approved":
        raise HTTPException(status_code=400, detail="Approved requests cannot be deleted")

    db.delete(db_req)
    db.commit()
    return {"message": "Day-off request deleted successfully"}


@app.get("/api/staff/requested-days-off/calendar/all", response_model=List[schemas.RequestedDayOffCalendarItem])
def get_all_staff_day_off_calendar(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    db: Session = Depends(get_db)
):
    """Get all approved day-off requests for calendar display (staff view - only shows approved)"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    requests = db.query(models.RequestedDayOff).filter(
        models.RequestedDayOff.request_date >= start_date,
        models.RequestedDayOff.request_date < end_date,
        models.RequestedDayOff.status == "approved"
    ).all()

    results = []
    for req in requests:
        staff = db.query(models.Staff).filter(models.Staff.id == req.staff_id).first()
        results.append(schemas.RequestedDayOffCalendarItem(
            id=req.id,
            staff_id=req.staff_id,
            staff_name=staff.name if staff else "Unknown",
            request_date=req.request_date,
            status=req.status
        ))

    return results


# ============================================================
#  RequestedDayOff API (休暇申請 - Admin Interface)
# ============================================================

@app.get("/api/admin/requested-days-off", response_model=List[schemas.RequestedDayOff])
def get_all_day_off_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending/approved/rejected"),
    staff_id: Optional[int] = Query(None, description="Filter by staff ID"),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month"),
    db: Session = Depends(get_db)
):
    """Get all day-off requests (admin view)"""
    query = db.query(models.RequestedDayOff)

    if status:
        query = query.filter(models.RequestedDayOff.status == status)

    if staff_id:
        query = query.filter(models.RequestedDayOff.staff_id == staff_id)

    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        query = query.filter(
            models.RequestedDayOff.request_date >= start_date,
            models.RequestedDayOff.request_date < end_date
        )

    requests = query.order_by(models.RequestedDayOff.created_at.desc()).all()

    results = []
    for req in requests:
        staff = db.query(models.Staff).filter(models.Staff.id == req.staff_id).first()
        result = schemas.RequestedDayOff.model_validate(req)
        result.staff_name = staff.name if staff else "Unknown"
        results.append(result)

    return results


@app.put("/api/admin/requested-days-off/{request_id}/approve", response_model=schemas.RequestedDayOff)
def approve_day_off_request(
    request_id: int,
    approval: schemas.RequestedDayOffApprove,
    db: Session = Depends(get_db)
):
    """Approve a day-off request"""
    db_req = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    if db_req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    db_req.status = "approved"
    db_req.approved_at = datetime.utcnow()
    db_req.approved_by = approval.approved_by
    db_req.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_req)

    staff = db.query(models.Staff).filter(models.Staff.id == db_req.staff_id).first()
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@app.put("/api/admin/requested-days-off/{request_id}/reject", response_model=schemas.RequestedDayOff)
def reject_day_off_request(
    request_id: int,
    rejection: schemas.RequestedDayOffReject,
    db: Session = Depends(get_db)
):
    """Reject a day-off request"""
    db_req = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    if db_req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    db_req.status = "rejected"
    db_req.rejection_reason = rejection.rejection_reason
    db_req.approved_by = rejection.rejected_by
    db_req.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_req)

    staff = db.query(models.Staff).filter(models.Staff.id == db_req.staff_id).first()
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@app.put("/api/admin/requested-days-off/bulk-approve")
def bulk_approve_day_off_requests(
    request_ids: List[int],
    approval: schemas.RequestedDayOffApprove,
    db: Session = Depends(get_db)
):
    """Approve multiple day-off requests at once"""
    approved_count = 0

    for request_id in request_ids:
        db_req = db.query(models.RequestedDayOff).filter(models.RequestedDayOff.id == request_id).first()
        if db_req and db_req.status == "pending":
            db_req.status = "approved"
            db_req.approved_at = datetime.utcnow()
            db_req.approved_by = approval.approved_by
            db_req.updated_at = datetime.utcnow()
            approved_count += 1

    db.commit()
    return {"message": f"Approved {approved_count} requests", "approved_count": approved_count}


@app.get("/api/admin/requested-days-off/calendar", response_model=List[schemas.RequestedDayOffCalendarItem])
def get_admin_day_off_calendar(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    include_pending: bool = Query(True, description="Include pending requests"),
    db: Session = Depends(get_db)
):
    """Get all day-off requests for admin calendar (shows all statuses)"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    query = db.query(models.RequestedDayOff).filter(
        models.RequestedDayOff.request_date >= start_date,
        models.RequestedDayOff.request_date < end_date
    )

    if not include_pending:
        query = query.filter(models.RequestedDayOff.status == "approved")
    else:
        query = query.filter(models.RequestedDayOff.status.in_(["pending", "approved"]))

    requests = query.all()

    results = []
    for req in requests:
        staff = db.query(models.Staff).filter(models.Staff.id == req.staff_id).first()
        results.append(schemas.RequestedDayOffCalendarItem(
            id=req.id,
            staff_id=req.staff_id,
            staff_name=staff.name if staff else "Unknown",
            request_date=req.request_date,
            status=req.status
        ))

    return results


@app.get("/api/admin/requested-days-off/statistics", response_model=List[schemas.RequestedDayOffStatistics])
def get_day_off_statistics(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    db: Session = Depends(get_db)
):
    """Get day-off statistics per day for the month (for admin calendar warnings)"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    requests = db.query(models.RequestedDayOff).filter(
        models.RequestedDayOff.request_date >= start_date,
        models.RequestedDayOff.request_date < end_date,
        models.RequestedDayOff.status.in_(["pending", "approved"])
    ).all()

    # Group by date
    date_stats = defaultdict(lambda: {"total": 0, "approved": 0, "pending": 0, "staff_names": []})

    for req in requests:
        staff = db.query(models.Staff).filter(models.Staff.id == req.staff_id).first()
        staff_name = staff.name if staff else "Unknown"

        stats = date_stats[req.request_date]
        stats["total"] += 1
        if req.status == "approved":
            stats["approved"] += 1
        else:
            stats["pending"] += 1
        stats["staff_names"].append(staff_name)

    results = []
    for req_date, stats in sorted(date_stats.items()):
        results.append(schemas.RequestedDayOffStatistics(
            date=req_date,
            total_requests=stats["total"],
            approved_count=stats["approved"],
            pending_count=stats["pending"],
            staff_names=stats["staff_names"]
        ))

    return results