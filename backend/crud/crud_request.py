from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.models.models import RequestedDayOff, Staff


def get_staff_by_id(db: Session, staff_id: int):
    return db.query(Staff).filter(Staff.id == staff_id).first()


def get_request_by_id(db: Session, request_id: int):
    return db.query(RequestedDayOff).filter(RequestedDayOff.id == request_id).first()


def get_duplicate_request(db: Session, staff_id: int, request_date: date, exclude_id: Optional[int] = None):
    query = db.query(RequestedDayOff).filter(
        RequestedDayOff.staff_id == staff_id,
        RequestedDayOff.request_date == request_date,
    )
    if exclude_id:
        query = query.filter(RequestedDayOff.id != exclude_id)
    return query.first()


def create_request(db: Session, staff_id: int, request_date: date, reason: Optional[str] = None):
    db_req = RequestedDayOff(
        staff_id=staff_id,
        request_date=request_date,
        reason=reason,
    )
    db.add(db_req)
    return db_req


def commit_and_refresh(db: Session, db_req: RequestedDayOff):
    db.commit()
    db.refresh(db_req)
    return db_req


def delete_request(db: Session, db_req: RequestedDayOff):
    db.delete(db_req)
    db.commit()


def get_staff_requests(
    db: Session,
    staff_id: int,
    status: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    query = db.query(RequestedDayOff).filter(RequestedDayOff.staff_id == staff_id)

    if status:
        query = query.filter(RequestedDayOff.status == status)

    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        query = query.filter(
            RequestedDayOff.request_date >= start_date,
            RequestedDayOff.request_date < end_date,
        )

    return query.order_by(RequestedDayOff.request_date).all()


def get_calendar_requests(db: Session, year: int, month: int, status_filter: Optional[str] = None, include_pending: bool = False):
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    query = db.query(RequestedDayOff).filter(
        RequestedDayOff.request_date >= start_date,
        RequestedDayOff.request_date < end_date,
    )

    if status_filter:
        query = query.filter(RequestedDayOff.status == status_filter)
    elif include_pending:
        query = query.filter(RequestedDayOff.status.in_(["pending", "approved"]))

    return query.all()


def get_all_requests_admin(
    db: Session,
    status: Optional[str] = None,
    staff_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    query = db.query(RequestedDayOff)

    if status:
        query = query.filter(RequestedDayOff.status == status)
    if staff_id:
        query = query.filter(RequestedDayOff.staff_id == staff_id)
    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        query = query.filter(
            RequestedDayOff.request_date >= start_date,
            RequestedDayOff.request_date < end_date,
        )

    return query.order_by(RequestedDayOff.created_at.desc()).all()


def get_statistics_requests(db: Session, year: int, month: int):
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    return db.query(RequestedDayOff).filter(
        RequestedDayOff.request_date >= start_date,
        RequestedDayOff.request_date < end_date,
        RequestedDayOff.status.in_(["pending", "approved"]),
    ).all()
