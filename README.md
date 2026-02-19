# miniDX - 介護施設向けシフト管理システム

Google OR-Tools を用いた制約充足ソルバーで月次シフトを自動生成する Web アプリケーションです。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | FastAPI + Uvicorn |
| ORM / DB | SQLAlchemy + SQLite |
| 最適化ソルバー | Google OR-Tools (CP-SAT) |
| Excel 出力 | openpyxl |
| 認証 | JWT (python-jose) + bcrypt |
| フロントエンド | React 18 + Vite + Tailwind CSS |
| カレンダー UI | FullCalendar |

## ディレクトリ構成

```
miniDX/
├── backend/
│   ├── app/main.py           # FastAPI アプリケーション本体
│   ├── api/endpoints/        # APIルーター（auth, staffs, tasks, shifts, requests）
│   ├── core/                 # 設定・DB・認証・ロギング
│   ├── models/models.py      # SQLAlchemy テーブル定義
│   ├── schemas/              # Pydantic スキーマ・定数（enums）
│   ├── crud/                 # DB操作（staff, task, shift, request）
│   └── solver/
│       ├── engine.py         # ソルバー起動・Excel/JSON出力
│       ├── constraints.py    # 制約ロジック (C1〜C10, S1)
│       └── exporter.py       # Excel 書式設定
├── frontend/
│   └── src/
│       ├── api/              # fetch ラッパー（auth, staff, task, shift, request）
│       ├── contexts/         # AuthContext（スタッフ/管理者トークン管理）
│       ├── pages/            # 各画面コンポーネント
│       └── components/       # UI パーツ
├── static/                   # 生成 Excel の出力先
├── requirement.txt
└── .env.example
```

## セットアップ

### 前提条件

- Python 3.9 以上
- Node.js 16 以上

### バックエンド

```bash
# 仮想環境を作成・有効化
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 依存関係をインストール
pip install -r requirement.txt

# 環境変数を設定
cp .env.example .env
# 必要に応じて .env を編集

# サーバー起動
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### アクセス URL

| 用途 | URL |
|------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

## 環境変数 (.env)

| 変数名 | 説明 | デフォルト |
|--------|------|---------|
| `DATABASE_URL` | DB 接続文字列 | `sqlite:///./shift.db` |
| `SECRET_KEY` | JWT 署名用秘密鍵 | （本番では必ず変更） |
| `ADMIN_USERNAME` | 管理者ユーザー名 | `admin` |
| `ADMIN_PASSWORD` | 管理者パスワード | `admin123` |
| `CORS_ORIGINS` | 許可オリジン（JSON 配列） | `["http://localhost:5173"]` |

## データモデル

### Staff（スタッフ）

| カラム | 型 | 説明 |
|--------|-----|------|
| `license_type` | int | 0: 免許なし / 1: 普通車 / 2: ワゴン可 |
| `is_part_time` | bool | パート区分 |
| `can_only_train` | bool | 訓練業務のみ担当可能 |
| `is_nurse` | bool | 看護師資格 |
| `work_limit` | int | 月の勤務日数上限（デフォルト: 20） |

### Task（業務）

業務名にキーワードを含めることで、ソルバーが自動的に制約を適用します（後述）。

### DailyRequirement（日次要件）

日付 × 業務 × 必要人数の組み合わせで必要配置人数を指定します。デフォルト人数が 0 の業務（事務・研修など）は、必要な日のみ登録します。

### Holiday（施設休日）

登録した日は全スタッフの全業務割り当てが 0 に強制されます。

### RequestedDayOff（休暇申請）

スタッフが申請 → 管理者が承認/却下 のワークフローを持ちます。

## 業務一覧

| 業務名 | デフォルト必要人数 | 備考 |
|--------|----------------|------|
| 相談 | 1 | |
| 看護師 | 2 | |
| 訓練 | 1 | |
| 看護 | 1 | 看護師資格が必要 |
| 特浴 | 1 | |
| 風呂 | 5 | |
| リーダー | 1 | |
| サブリーダー | 1 | |
| 運転手 | 6 以上 | |
| 事務 | 0 | フリー枠。必要な日のみ設定 |
| 研修 | 0 | フリー枠。必要な日のみ設定 |

## シフト制約

### ハード制約（必ず満たす）

| ID | 内容 |
|----|------|
| **C1** | 1日1人1業務まで |
| **C2** | 日次要件で指定した業務別必要人数を充足する |
| **C3** | 希望休として登録された日は、該当スタッフをシフトに入れない |
| **C4** | 業務名に「看護」を含むタスクは `is_nurse == True` のスタッフのみ割り当て可能 |
| **C5** | `can_only_train == True` のスタッフは訓練業務のみ担当可能 |
| **C6** | 毎日 `license_type >= 1` かつ常勤のスタッフが 6 人以上出勤する |
| **C7** | 施設休日は全スタッフ・全業務の割り当てを禁止 |
| **C8** | 業務名に「リーダー」または「サブリーダー」を含むタスクは、`is_nurse == True` または `can_only_train == False` のスタッフのみ割り当て可能 |
| **C9** | 業務名に「ワゴン」を含むタスクは `license_type == 2` のみ可。「普通車」または汎用「運転」タスクは `license_type >= 1` のみ可 |
| **C10** | `is_part_time == True` のスタッフは業務名に「運転」または「送迎」を含むタスクへの割り当てを禁止 |

### ソフト制約（できれば満たす）

| ID | 内容 |
|----|------|
| **S1** | 各スタッフの月間勤務日数が `work_limit` を超えない |

### 事務・研修（フリー枠）の特別ルール

- 必要な日のみ DailyRequirement で人数を設定する
- 職種不問で割り当て可能
- フリー枠に割り当てられたスタッフは現場の 11 名枠にカウントしない
- 看護師が研修に入った場合、その日の看護業務の充足は別の看護師で行う必要がある

## API エンドポイント概要

### 認証 `/api/auth`

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/login` | スタッフログイン |
| POST | `/setup-password` | 初回パスワード設定 |
| POST | `/admin-login` | 管理者ログイン |
| POST | `/staff/{id}/reset-password` | パスワードリセット（管理者操作） |

### スタッフ `/api/staff`

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/staff` | 一覧取得 |
| POST | `/staff` | 作成 |
| PUT | `/staff/{id}` | 更新 |
| DELETE | `/staff/{id}` | 削除 |

### 業務・スキル `/api`

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/task` | 業務一覧取得 / 作成 |
| DELETE | `/task/{id}` | 業務削除 |
| GET/POST | `/skill` | スキル一覧取得 / 作成 |

### シフト生成 `/api`

| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/absence` | 希望休一覧 / 登録 |
| DELETE | `/absence/{id}` | 希望休削除 |
| GET/POST | `/requirements` | 日次要件一覧 / 登録 |
| GET/POST | `/holidays` | 施設休日一覧 / 登録 |
| DELETE | `/holidays/{date}` | 施設休日削除 |
| POST | `/generate-shift` | シフト自動生成（Excel + JSON 返却） |

### 休暇申請 `/api`

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/staff/requested-days-off` | スタッフ: 申請作成 |
| POST | `/staff/requested-days-off/bulk` | スタッフ: 複数日一括申請 |
| GET | `/staff/requested-days-off` | スタッフ: 自分の申請一覧 |
| PUT | `/staff/requested-days-off/{id}` | スタッフ: 申請更新（pending のみ） |
| DELETE | `/staff/requested-days-off/{id}` | スタッフ: 申請削除（pending のみ） |
| GET | `/admin/requested-days-off` | 管理者: 全申請一覧 |
| PUT | `/admin/requested-days-off/{id}/approve` | 管理者: 承認 |
| PUT | `/admin/requested-days-off/{id}/reject` | 管理者: 却下 |
| PUT | `/admin/requested-days-off/bulk-approve` | 管理者: 一括承認 |

## シフト生成フロー

```
POST /api/generate-shift { year, month }
  ↓
全スタッフ × 全日 × 全業務 の BoolVar を生成
  ↓
C1〜C10 ハード制約を追加
  ↓
S1 ソフト制約を追加
  ↓
OR-Tools CP-SAT ソルバーで求解
  ↓
Feasible → Excel（/static/ に保存）+ JSON をレスポンス
Infeasible → エラー（解なし）を返却
```

## 努力目標

- フリー枠（事務・研修など）を柔軟に追加・管理できるようにする
