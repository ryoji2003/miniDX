from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from collections import defaultdict

from backend.schemas import schemas
from backend.core.database import get_db
from backend.crud import crud_request
from backend.core.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api", tags=["requests"])


# ============================================================
#  Staff Interface
# ============================================================

@router.post("/staff/requested-days-off", response_model=schemas.RequestedDayOff)
def create_day_off_request(
    req: schemas.RequestedDayOffCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit a single day-off request"""
    if req.staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="他のスタッフの申請は送信できません")
    staff = crud_request.get_staff_by_id(db, req.staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if req.request_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot request day off for past dates")

    existing = crud_request.get_duplicate_request(db, req.staff_id, req.request_date)
    if existing:
        raise HTTPException(status_code=400, detail="Day-off request already exists for this date")

    db_req = crud_request.create_request(db, req.staff_id, req.request_date, req.reason)
    crud_request.commit_and_refresh(db, db_req)

    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name
    return result


@router.post("/staff/requested-days-off/bulk", response_model=List[schemas.RequestedDayOff])
def create_bulk_day_off_requests(
    req: schemas.RequestedDayOffBulkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit multiple day-off requests at once (for date range selection)"""
    if req.staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="他のスタッフの申請は送信できません")
    staff = crud_request.get_staff_by_id(db, req.staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    created_requests = []
    for request_date in req.request_dates:
        if request_date < date.today():
            continue
        existing = crud_request.get_duplicate_request(db, req.staff_id, request_date)
        if existing:
            continue
        db_req = crud_request.create_request(db, req.staff_id, request_date, req.reason)
        created_requests.append(db_req)

    db.commit()

    results = []
    for db_req in created_requests:
        db.refresh(db_req)
        result = schemas.RequestedDayOff.model_validate(db_req)
        result.staff_name = staff.name
        results.append(result)

    return results


@router.get("/staff/requested-days-off", response_model=List[schemas.RequestedDayOff])
def get_staff_day_off_requests(
    staff_id: int = Query(..., description="Staff ID to filter by"),
    status: Optional[str] = Query(None, description="Filter by status: pending/approved/rejected"),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get day-off requests for a specific staff member"""
    if staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="他のスタッフの申請は閲覧できません")
    staff = crud_request.get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    requests = crud_request.get_staff_requests(db, staff_id, status=status, year=year, month=month)

    results = []
    for req in requests:
        result = schemas.RequestedDayOff.model_validate(req)
        result.staff_name = staff.name
        results.append(result)

    return results


@router.get("/staff/requested-days-off/calendar/all", response_model=List[schemas.RequestedDayOffCalendarItem])
def get_all_staff_day_off_calendar(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Get all day-off requests for calendar display (staff view - approved and pending)"""
    requests = crud_request.get_calendar_requests(db, year, month, include_pending=True)

    results = []
    for req in requests:
        staff = crud_request.get_staff_by_id(db, req.staff_id)
        results.append(schemas.RequestedDayOffCalendarItem(
            id=req.id,
            staff_id=req.staff_id,
            staff_name=staff.name if staff else "Unknown",
            request_date=req.request_date,
            status=req.status,
        ))

    return results


@router.get("/staff/requested-days-off/{request_id}", response_model=schemas.RequestedDayOff)
def get_day_off_request_detail(request_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Get details of a specific day-off request"""
    db_req = crud_request.get_request_by_id(db, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    staff = crud_request.get_staff_by_id(db, db_req.staff_id)
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@router.put("/staff/requested-days-off/{request_id}", response_model=schemas.RequestedDayOff)
def update_day_off_request(
    request_id: int,
    update: schemas.RequestedDayOffUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Update a pending day-off request (only pending requests can be modified)"""
    db_req = crud_request.get_request_by_id(db, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    if db_req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be modified")

    if update.request_date is not None:
        if update.request_date < date.today():
            raise HTTPException(status_code=400, detail="Cannot request day off for past dates")

        existing = crud_request.get_duplicate_request(db, db_req.staff_id, update.request_date, exclude_id=request_id)
        if existing:
            raise HTTPException(status_code=400, detail="Day-off request already exists for this date")

        db_req.request_date = update.request_date

    if update.reason is not None:
        db_req.reason = update.reason

    db_req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_req)

    staff = crud_request.get_staff_by_id(db, db_req.staff_id)
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@router.delete("/staff/requested-days-off/{request_id}")
def delete_day_off_request(request_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Delete a day-off request (only pending requests can be deleted)"""
    db_req = crud_request.get_request_by_id(db, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    if db_req.status == "approved":
        raise HTTPException(status_code=400, detail="Approved requests cannot be deleted")

    crud_request.delete_request(db, db_req)
    return {"message": "Day-off request deleted successfully"}


# ============================================================
#  Admin Interface
# ============================================================

@router.get("/admin/requested-days-off", response_model=List[schemas.RequestedDayOff])
def get_all_day_off_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending/approved/rejected"),
    staff_id: Optional[int] = Query(None, description="Filter by staff ID"),
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month"),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Get all day-off requests (admin view)"""
    requests = crud_request.get_all_requests_admin(db, status=status, staff_id=staff_id, year=year, month=month)

    results = []
    for req in requests:
        staff = crud_request.get_staff_by_id(db, req.staff_id)
        result = schemas.RequestedDayOff.model_validate(req)
        result.staff_name = staff.name if staff else "Unknown"
        results.append(result)

    return results


@router.put("/admin/requested-days-off/{request_id}/approve", response_model=schemas.RequestedDayOff)
def approve_day_off_request(
    request_id: int,
    approval: schemas.RequestedDayOffApprove,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Approve a day-off request"""
    db_req = crud_request.get_request_by_id(db, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    db_req.status = "approved"
    db_req.approved_at = datetime.utcnow()
    db_req.approved_by = approval.approved_by
    db_req.rejection_reason = None
    db_req.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_req)

    staff = crud_request.get_staff_by_id(db, db_req.staff_id)
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@router.put("/admin/requested-days-off/{request_id}/reject", response_model=schemas.RequestedDayOff)
def reject_day_off_request(
    request_id: int,
    rejection: schemas.RequestedDayOffReject,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Reject a day-off request"""
    db_req = crud_request.get_request_by_id(db, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    db_req.status = "rejected"
    db_req.rejection_reason = rejection.rejection_reason
    db_req.approved_by = rejection.rejected_by
    db_req.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_req)

    staff = crud_request.get_staff_by_id(db, db_req.staff_id)
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@router.put("/admin/requested-days-off/{request_id}/pending", response_model=schemas.RequestedDayOff)
def reset_day_off_request_to_pending(
    request_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """承認済み・却下済みの申請を承認待ち（pending）に戻す"""
    db_req = crud_request.get_request_by_id(db, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Day-off request not found")

    db_req.status = "pending"
    db_req.approved_at = None
    db_req.approved_by = None
    db_req.rejection_reason = None
    db_req.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_req)

    staff = crud_request.get_staff_by_id(db, db_req.staff_id)
    result = schemas.RequestedDayOff.model_validate(db_req)
    result.staff_name = staff.name if staff else None
    return result


@router.put("/admin/requested-days-off/bulk-approve")
def bulk_approve_day_off_requests(
    request_ids: List[int] = Query(..., description="List of request IDs to approve"),
    approval: Optional[schemas.RequestedDayOffApprove] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Approve multiple day-off requests at once"""
    approved_by = approval.approved_by if approval else "管理者"
    approved_count = 0
    errors = []

    for request_id in request_ids:
        db_req = crud_request.get_request_by_id(db, request_id)
        if not db_req:
            errors.append(f"Request {request_id} not found")
            continue
        if db_req.status != "pending":
            errors.append(f"Request {request_id} is not pending")
            continue
        db_req.status = "approved"
        db_req.approved_at = datetime.utcnow()
        db_req.approved_by = approved_by
        db_req.updated_at = datetime.utcnow()
        approved_count += 1

    db.commit()
    return {"message": f"Approved {approved_count} requests", "approved_count": approved_count}


@router.get("/admin/requested-days-off/calendar", response_model=List[schemas.RequestedDayOffCalendarItem])
def get_admin_day_off_calendar(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    include_pending: bool = Query(True, description="Include pending requests"),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Get all day-off requests for admin calendar (shows all statuses)"""
    if not include_pending:
        requests = crud_request.get_calendar_requests(db, year, month, status_filter="approved")
    else:
        requests = crud_request.get_calendar_requests(db, year, month, include_pending=True)

    results = []
    for req in requests:
        staff = crud_request.get_staff_by_id(db, req.staff_id)
        results.append(schemas.RequestedDayOffCalendarItem(
            id=req.id,
            staff_id=req.staff_id,
            staff_name=staff.name if staff else "Unknown",
            request_date=req.request_date,
            status=req.status,
        ))

    return results


@router.get("/admin/requested-days-off/statistics", response_model=List[schemas.RequestedDayOffStatistics])
def get_day_off_statistics(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month"),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Get day-off statistics per day for the month (for admin calendar warnings)"""
    requests = crud_request.get_statistics_requests(db, year, month)

    date_stats = defaultdict(lambda: {"total": 0, "approved": 0, "pending": 0, "staff_names": []})

    for req in requests:
        staff = crud_request.get_staff_by_id(db, req.staff_id)
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
            staff_names=stats["staff_names"],
        ))

    return results
