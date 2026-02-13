from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from backend.core.database import Base
from datetime import datetime

# --- スタッフ (Staff) ---
class Staff(Base):
    __tablename__ = "staffs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    work_limit = Column(Integer, default=20)   # 月の勤務上限

    # 免許タイプ (0:なし, 1:普通車のみ, 2:ワゴン可)
    license_type = Column(Integer, default=0)

    # パートフラグ (True:パート/運転不可, False:常勤)
    is_part_time = Column(Boolean, default=False)

    # 訓練限定フラグ (True:訓練と運転のみ可, False:全業務可)
    can_only_train = Column(Boolean, default=False)

    # 看護師資格フラグ (True:看護師, False:その他/介護士)
    is_nurse = Column(Boolean, default=False)

# --- スキル (Skill) ---
class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

# --- 業務 (Task) ---
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    required_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)

# --- 希望休 (AbsenceRequest) ---
class AbsenceRequest(Base):
    __tablename__ = "absence_requests"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staffs.id"))
    date = Column(String, index=True)

# --- 日次要件 (DailyRequirement) ---
class DailyRequirement(Base):
    __tablename__ = "daily_requirements"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    count = Column(Integer, default=1)


# --- 休暇申請 (RequestedDayOff) ---
class RequestedDayOff(Base):
    __tablename__ = "requested_days_off"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staffs.id"), nullable=False, index=True)
    request_date = Column(Date, nullable=False, index=True)
    reason = Column(String(500), nullable=True)
    status = Column(String(20), default="pending", index=True)  # pending/approved/rejected
    rejection_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String(100), nullable=True)  # Approver name (simplified, no User table)

    # Relationships
    staff = relationship("Staff", backref="requested_days_off")
