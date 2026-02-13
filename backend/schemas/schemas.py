from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime

# --- Staff用スキーマ ---
class StaffBase(BaseModel):
    name: str
    work_limit: int = 20
    license_type: int = 0      # 0:なし, 1:普通, 2:ワゴン
    is_part_time: bool = False # パート区分
    can_only_train: bool = False # 訓練限定
    is_nurse: bool = False

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    id: int
    class Config:
        from_attributes = True

# --- Skill用スキーマ ---
class SkillBase(BaseModel):
    name: str

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int
    class Config:
        from_attributes = True

# --- Task用スキーマ ---
class TaskBase(BaseModel):
    name: str
    required_skill_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    class Config:
        from_attributes = True

# --- 希望休 (AbsenceRequest) ---
class AbsenceRequestBase(BaseModel):
    staff_id: int
    date: str  # YYYY-MM-DD形式

class AbsenceRequestCreate(AbsenceRequestBase):
    pass

class AbsenceRequest(AbsenceRequestBase):
    id: int
    # 誰の休みか名前も返すと便利なので、本来はjoinするが今回は簡易的にID管理

    class Config:
        from_attributes = True

# --- 日次要件 (DailyRequirement) ---
class DailyRequirementBase(BaseModel):
    date: str
    task_id: int
    count: int = 1

class DailyRequirementCreate(DailyRequirementBase):
    pass

class DailyRequirement(DailyRequirementBase):
    id: int
    class Config:
        from_attributes = True

class GenerateRequest(BaseModel):
    year: int
    month: int


# --- 休暇申請 (RequestedDayOff) ---
class RequestedDayOffBase(BaseModel):
    staff_id: int
    request_date: date
    reason: Optional[str] = Field(None, max_length=500)

class RequestedDayOffCreate(RequestedDayOffBase):
    """Schema for creating a single day-off request"""
    pass

class RequestedDayOffBulkCreate(BaseModel):
    """Schema for creating multiple day-off requests at once"""
    staff_id: int
    request_dates: List[date]
    reason: Optional[str] = Field(None, max_length=500)

class RequestedDayOffUpdate(BaseModel):
    """Schema for updating a day-off request"""
    request_date: Optional[date] = None
    reason: Optional[str] = Field(None, max_length=500)

class RequestedDayOffApprove(BaseModel):
    """Schema for approving a day-off request"""
    approved_by: str = Field(..., max_length=100)

class RequestedDayOffReject(BaseModel):
    """Schema for rejecting a day-off request"""
    rejection_reason: str = Field(..., max_length=500)
    rejected_by: str = Field(..., max_length=100)

class RequestedDayOff(RequestedDayOffBase):
    """Schema for returning a day-off request"""
    id: int
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    staff_name: Optional[str] = None  # For joined queries

    class Config:
        from_attributes = True

class RequestedDayOffCalendarItem(BaseModel):
    """Schema for calendar view items"""
    id: int
    staff_id: int
    staff_name: str
    request_date: date
    status: str

class RequestedDayOffStatistics(BaseModel):
    """Schema for day-off statistics"""
    date: date
    total_requests: int
    approved_count: int
    pending_count: int
    staff_names: List[str]
