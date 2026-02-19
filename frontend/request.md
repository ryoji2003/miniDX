# Objective
スタッフの「休暇申請（RequestedDayOff）」機能が実装され運用可能になったため、古い手入力用の「希望休・制約条件（ConstraintPage.jsx / AbsenceRequest）」機能をUIから削除し、シフト自動生成AIが新しい承認済み休暇データを読み込むようにバックエンドを改修します。

# Background
現状、シフト生成の最適化ソルバーは `AbsenceRequest` テーブルのデータのみを参照しています。単にフロントエンドから `ConstraintPage.jsx` を削除するだけでは、スタッフが申請し承認された `RequestedDayOff` のデータがシフトに反映されなくなってしまいます。
そのため、最初にバックエンドでソルバーに渡すデータを「承認済みの `RequestedDayOff`」にすげ替える改修を行い、その後に不要になったフロントエンドの導線を削除します。

# Tasks

## Task 1: バックエンドのデータ参照元の変更
対象ファイル: `backend/crud/crud_shift.py`

`get_all_shift_data` 関数を修正し、`AbsenceRequest` の代わりに `RequestedDayOff` テーブルから `status == "approved"` のデータを取得してソルバーに渡すようにしてください。

**具体的な修正内容:**
1. ファイル上部のインポートに `RequestedDayOff` を追加してください。
   `from backend.models.models import Staff, Task, AbsenceRequest, DailyRequirement, RequestedDayOff`
2. `get_all_shift_data` 関数内の `absences = db.query(AbsenceRequest).all()` の部分を以下のように書き換えてください。
   - `RequestedDayOff` テーブルから `status == "approved"` のレコードをすべて取得する。
   - 取得したレコードを、ソルバーが期待する形式（`staff_id`属性と、`YYYY-MM-DD`形式の文字列の `date`属性 を持つオブジェクト）のリストに変換し、それを `absences` として返す。

（参考実装イメージ）
```python
    # absences = db.query(AbsenceRequest).all() # 削除
    
    approved_requests = db.query(RequestedDayOff).filter(RequestedDayOff.status == "approved").all()
    
    class MockAbsence:
        def __init__(self, staff_id, date_str):
            self.staff_id = staff_id
            self.date = date_str

    absences = [MockAbsence(r.staff_id, r.request_date.strftime("%Y-%m-%d")) for r in approved_requests]
```

## Task 2: フロントエンドのサイドバーからの導線削除
対象ファイル: `frontend/src/components/AdminLayout.jsx`

サイドバーのナビゲーションメニューから、「希望休・制約条件」ページへのリンクを削除してください。
- `<Link to="/admin/constraints">` で囲まれた `<Button>` コンポーネント（「希望休・制約条件」というテキストと `UserX` アイコンを含むブロック）を丸ごと削除、またはコメントアウトしてください。

## Task 3: フロントエンドのルーティングからの削除
対象ファイル: `frontend/src/App.jsx`

`ConstraintPage` へのルーティングを削除してください。
1. `import ConstraintPage from './pages/ConstraintPage';` のインポート文を削除、またはコメントアウト。
2. `<Route path="/admin/constraints" element={<ConstraintPage />} />` のルート定義を削除、またはコメントアウト。

# Verification
すべてのタスクが完了したら、以下の点を確認してください。
1. バックエンドのサーバーがエラーなく立ち上がること。
2. フロントエンドの管理者画面のサイドバーから「希望休・制約条件」が消えていること。
3. `App.jsx` のルーティングエラーが発生していないこと。