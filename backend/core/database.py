from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from backend.core.config import settings

# データベースエンジンの作成
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)

# セッション（DBとの会話用）の作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデルのベースクラス
Base = declarative_base()

# DBセッションを取得する依存関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
