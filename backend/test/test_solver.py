import pytest
from ortools.sat.python import cp_model
from backend.solver.engine import generate_shift_excel
# テストに必要なダミーデータのクラス定義（簡易版）
from backend.models.models import Staff, Task, DailyRequirement, AbsenceRequest

def test_simple_solver_scenario():
    """
    最小限のデータでソルバーが解（Feasible/Optimal）を出せるかテスト
    """
    # 1. テストデータの準備 (Arrange)
    staffs = [
        Staff(id=1, name="Aさん", is_nurse=False, work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
        Staff(id=2, name="Bさん", is_nurse=True, work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
        Staff(id=3, name="Cさん", is_nurse=False, work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
    ]
    tasks = [
        Task(id=1, name="通常業務"),
        Task(id=2, name="看護業務"),
    ]
    # 毎日Task1に1人必要
    reqs = [] # 要件なし（C2制約は人数指定があれば発動）
    
    # Task1に毎日1人必要という設定を追加してみる
    # 日付は 2024-02-01 とする
    reqs.append(DailyRequirement(date="2024-02-01", task_id=1, count=1))

    absences = [] # 欠勤なし

    year = 2024
    month = 2

    # 2. 実行 (Act)
    # Excelパスとシフトデータが返ってくるはず
    excel_path, shift_data = generate_shift_excel(staffs, tasks, reqs, absences, year, month)

    # 3. 検証 (Assert)
    assert excel_path is not None, "解が見つかればExcelパスが返るはず"
    assert shift_data is not None, "解が見つかればシフトデータが返るはず"
    
    # 2月1日のデータが含まれているか
    assert "2024-02-01" in shift_data
    
    # 2月1日に誰か1人が割り当てられているか
    assigned_count = len(shift_data["2024-02-01"])
    assert assigned_count >= 1

    print("\n✅ テスト成功: シンプルなシナリオでシフト生成できました")

# 実行方法:
# ターミナルで backend ディレクトリに移動し、以下のコマンドを実行
# pytest tests/test_solver.py