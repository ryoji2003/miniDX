from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text, inspect as sa_inspect

from backend.core.config import settings
from backend.core.logging import setup_logging, get_logger
from backend.models.models import Base
from backend.core.database import engine
from backend.api.endpoints import staffs, tasks, shifts, requests, auth
import os

setup_logging()
logger = get_logger(__name__)

# データベースのテーブルを自動作成 (初回起動時)
Base.metadata.create_all(bind=engine)

# staffsテーブルに認証用カラムが存在しない場合は追加するマイグレーション
with engine.connect() as conn:
    inspector = sa_inspect(engine)
    existing_columns = [col["name"] for col in inspector.get_columns("staffs")]
    if "hashed_password" not in existing_columns:
        conn.execute(text("ALTER TABLE staffs ADD COLUMN hashed_password VARCHAR"))
        conn.commit()
        logger.info("staffs.hashed_password カラムを追加しました")
    if "is_admin" not in existing_columns:
        conn.execute(text("ALTER TABLE staffs ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"))
        conn.commit()
        logger.info("staffs.is_admin カラムを追加しました")

# monthly_rest_day_settingsテーブルが存在しない場合はBase.metadata.create_allで自動作成済みだが、
# 既存DBでテーブルが存在するか確認してなければ作成
with engine.connect() as conn:
    inspector = sa_inspect(engine)
    if "monthly_rest_day_settings" not in inspector.get_table_names():
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS monthly_rest_day_settings "
            "(id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "year INTEGER NOT NULL, "
            "month INTEGER NOT NULL, "
            "additional_days INTEGER NOT NULL DEFAULT 0)"
        ))
        conn.commit()
        logger.info("monthly_rest_day_settings テーブルを作成しました")

app = FastAPI()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


# CORS設定 (フロントエンドからのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("static"):
    os.makedirs("static")


# staticディレクトリ内のファイルを /static というURLで公開する設定
app.mount("/static", StaticFiles(directory="static"), name="static")

# ルーターを登録
app.include_router(auth.router)
app.include_router(staffs.router)
app.include_router(tasks.router)
app.include_router(shifts.router)
app.include_router(requests.router)


# --- 動作確認用 ---
@app.get("/")
def read_root():
    return {"message": "Shift App Backend is running!"}
