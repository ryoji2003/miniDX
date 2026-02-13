from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.models.models import Base
from backend.core.database import engine
from backend.api.endpoints import staffs, tasks, shifts, requests

# データベースのテーブルを自動作成 (初回起動時)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS設定 (フロントエンドからのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
