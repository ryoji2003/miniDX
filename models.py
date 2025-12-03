from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# --- スタッフ (Staff) ---
class Staff(Base):
    __tablename__ = "staffs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)          # 名前 (例: Aさん)
    work_limit = Column(Integer, default=20)   # 月の勤務上限 (例: 20日)
    
    # StaffとSkillの多対多リレーションなどは今後追加

# --- スキル (Skill) ---
class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # スキル名 (例: 看護師)

# --- 業務 (Task) ---
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)          # 業務名 (例: 看護業務)
    required_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True) # 必要なスキルID