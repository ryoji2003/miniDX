from sqlalchemy.orm import Session
from backend.models.models import Skill, Task
from backend.schemas.schemas import SkillCreate, TaskCreate


# --- Skill ---

def get_skills(db: Session):
    return db.query(Skill).all()


def create_skill(db: Session, skill: SkillCreate):
    db_skill = Skill(name=skill.name)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill


# --- Task ---

def get_tasks(db: Session):
    return db.query(Task).all()


def get_task_by_id(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()


def create_task(db: Session, task: TaskCreate):
    db_task = Task(name=task.name, required_skill_id=task.required_skill_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, db_task: Task):
    db.delete(db_task)
    db.commit()
