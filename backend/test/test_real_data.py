# backend/test/test_real_data.py
import pytest
from backend.solver.engine import generate_shift_excel
from backend.models.models import Staff, Task, DailyRequirement

def test_real_data_scenario():
    """
    提供された実際のデータ（R8.1.26.xlsx および R7勤務表.xlsx）を
    シミュレートしてシフト生成が可能かテストする。
    """
    # 1. スタッフデータの設定 (17名)
    staffs = [
        Staff(id=1, name="A", is_nurse=False, work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=2, name="B", is_nurse=False, work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=3, name="C", is_nurse=False, work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
        Staff(id=4, name="D", is_nurse=False, work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=5, name="E", is_nurse=False, work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=6, name="F", is_nurse=True,  work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=7, name="G", is_nurse=True,  work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=8, name="H", is_nurse=True,  work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
        Staff(id=9, name="I", is_nurse=False, work_limit=20, license_type=2, is_part_time=False, can_only_train=False),
        Staff(id=10, name="J", is_nurse=False, work_limit=20, license_type=1, is_part_time=False, can_only_train=False),
        Staff(id=11, name="K", is_nurse=False, work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
        Staff(id=12, name="L", is_nurse=False, work_limit=20, license_type=0, is_part_time=False, can_only_train=False),
        Staff(id=13, name="M", is_nurse=False, work_limit=20, license_type=1, is_part_time=False, can_only_train=False),
        # パート（出勤日数上限を調整）
        Staff(id=14, name="N", is_nurse=False, work_limit=16, license_type=0, is_part_time=True, can_only_train=False),
        Staff(id=15, name="O", is_nurse=True,  work_limit=16, license_type=0, is_part_time=True, can_only_train=False),
        Staff(id=16, name="P", is_nurse=False, work_limit=11, license_type=0, is_part_time=True, can_only_train=False),
        Staff(id=17, name="Q", is_nurse=False, work_limit=12, license_type=0, is_part_time=True, can_only_train=False),
    ]

    # 2. タスク（業務）の定義
    tasks = [
        Task(id=1, name="相談"),
        Task(id=2, name="看護"),
        Task(id=3, name="訓練"),
        Task(id=4, name="特浴"),
        Task(id=5, name="風呂"),
        Task(id=6, name="リーダー"),
        Task(id=7, name="サブリーダー"),
    ]

    # 3. 日次要件の定義（11月は毎日 計11名必要）
    # 相談(1), 看護(1), 訓練(1), 特浴(1), 風呂(5), リーダー(1), サブリーダー(1) = 11枠
    reqs = []
    task_counts = {1: 1, 2: 1, 3: 1, 4: 1, 5: 5, 6: 1, 7: 1}
    for day in range(1, 31):
        date_str = f"2025-11-{day:02d}"
        for t_id, count in task_counts.items():
            reqs.append(DailyRequirement(date=date_str, task_id=t_id, count=count))

    # 4. 希望休（「／」や「＼」の日）のモックデータ
    class MockAbsence:
        def __init__(self, staff_id, date_str):
            self.staff_id = staff_id
            self.date = date_str

    # ※テスト用として、A〜Eさんの主な休みだけを抽出して設定しています。
    absences_data = {
        1: [4, 12, 14, 18, 22, 24],  # Aさんの休み
        2: [1, 10, 13, 19, 28],      # Bさんの休み
        3: [1, 3, 9, 22, 24],        # Cさんの休み
        4: [4, 12, 14, 18, 21, 26, 28], # Dさんの休み
        5: [6, 8, 15, 19, 20, 26, 28]   # Eさんの休み
    }
    
    absences = []
    for s_id, days in absences_data.items():
        for d in days:
            absences.append(MockAbsence(s_id, f"2025-11-{d:02d}"))

    # 5. 施設休日（日曜日）の設定
    class MockHoliday:
        def __init__(self, date_str):
            self.date = date_str

    import datetime
    holidays = []
    for day in range(1, 31):
        dt = datetime.date(2025, 11, day)
        if dt.weekday() == 6:  # 日曜日
            holidays.append(MockHoliday(f"2025-11-{day:02d}"))

    # 6. ソルバーの実行（11月のシフト生成）
    excel_path, shift_data = generate_shift_excel(staffs, tasks, reqs, absences, 2025, 11, holidays)

    # 6. 検証（エラーにならずにシフトが生成されているか）
    assert excel_path is not None, "シフトが生成できませんでした。制約が厳しすぎる（人が足りないなど）可能性があります。"
    print(f"\n✅ 成功: 実際のデータ構成でシフトが生成されました！ ファイル: {excel_path}")