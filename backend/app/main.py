from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.core.logging import setup_logging, get_logger
from backend.models.models import Base
from backend.core.database import engine
from backend.api.endpoints import staffs, tasks, shifts, requests

setup_logging()
logger = get_logger(__name__)

# データベースのテーブルを自動作成 (初回起動時)
Base.metadata.create_all(bind=engine)

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

# staticディレクトリ内のファイルを /static というURLで公開する設定
app.mount("/static", StaticFiles(directory="static"), name="static")

# ルーターを登録
app.include_router(staffs.router)
app.include_router(tasks.router)
app.include_router(shifts.router)
app.include_router(requests.router)


# --- 動作確認用 ---
@app.get("/")
def read_root():
    return {"message": "Shift App Backend is running!"}
