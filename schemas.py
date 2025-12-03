from pydantic import BaseModel
from typing import Optional

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