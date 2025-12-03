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