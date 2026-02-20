import datetime
from backend.schemas.enums import TaskCategory, DRIVER_MIN_COUNT

class ShiftConstraints:
    def __init__(self, model, shifts, staffs, tasks, days, year, month):
        self.model = model
        self.shifts = shifts
        self.staffs = staffs
        self.tasks = tasks
        self.days = days
        self.year = year
        self.month = month

    def add_hard_constraints(self, requirements, absences, holidays=None, additional_days=None):
        """すべてのハード制約（必須ルール）を適用"""
        self._c1_one_task_per_staff()
        self._c2_daily_requirements(requirements, holidays or [])
        # C3は廃止: 希望休はソフト制約（_s2_absence_requests）に変更
        self._c4_nurse_exclusive()
        self._c5_training_exclusive()
        self._c6_drivers_limit(holidays or [])
        self._c7_facility_holidays(holidays or [])
        self._c8_leader_selection()
        self._c9_vehicle_license_requirement()
        self._c10_no_driving_for_part_timers()
        self._c11_training_qualification()
        if additional_days is not None:
            self._c_monthly_rest_days(additional_days)

    def add_soft_constraints(self, absences=None):
        """努力目標（できれば満たしたいルール）。ペナルティ変数リストを返す"""
        self._s1_work_limit()
        penalties = []
        if absences:
            penalties = self._s2_absence_requests(absences)
        return penalties

    def _c1_one_task_per_staff(self):
        """C1: 1日1人1業務まで"""
        for s in self.staffs:
            for d in self.days:
                self.model.Add(sum(self.shifts[(s.id, d, t.id)] for t in self.tasks) <= 1)

    def _c2_daily_requirements(self, requirements, holidays=None):
        """C2: 日ごとの必要人数を満たす（施設休日はスキップ）"""
        holiday_days = set()
        for h in (holidays or []):
            try:
                h_date = datetime.datetime.strptime(h.date, "%Y-%m-%d")
                if h_date.year == self.year and h_date.month == self.month:
                    holiday_days.add(h_date.day)
            except ValueError:
                continue

        req_map = {}
        for r in requirements:
            try:
                r_date = datetime.datetime.strptime(r.date, "%Y-%m-%d")
                if r_date.year == self.year and r_date.month == self.month:
                    req_map[(r_date.day, r.task_id)] = r.count
            except ValueError:
                continue

        for d in self.days:
            if d in holiday_days:
                continue  # 施設休日は要件チェックをスキップ
            for t in self.tasks:
                if (d, t.id) in req_map:
                    count = req_map[(d, t.id)]
                    self.model.Add(sum(self.shifts[(s.id, d, t.id)] for s in self.staffs) == count)

    def _c4_nurse_exclusive(self):
        """C4: 看護業務は看護師のみ"""
        nurse_tasks = [t for t in self.tasks if TaskCategory.NURSING.value in t.name]
        non_nurse_staffs = [s for s in self.staffs if not s.is_nurse]

        for task in nurse_tasks:
            for staff in non_nurse_staffs:
                for day in self.days:
                    self.model.Add(self.shifts[(staff.id, day, task.id)] == 0)

    def _c5_training_exclusive(self):
        """C5: 訓練限定スタッフは訓練のみ"""
        train_tasks = [t for t in self.tasks if TaskCategory.TRAINING.value in t.name]
        train_task_ids = {t.id for t in train_tasks}

        training_only_staffs = [s for s in self.staffs if s.can_only_train]

        # 訓練以外のタスクを特定
        other_tasks = [t for t in self.tasks if t.id not in train_task_ids]

        for staff in training_only_staffs:
            for task in other_tasks:
                for day in self.days:
                    self.model.Add(self.shifts[(staff.id, day, task.id)] == 0)

    def _c6_drivers_limit(self, holidays=None):
        """C6: 運転できる人数を確保（施設休日はスキップ）"""
        holiday_days = set()
        for h in (holidays or []):
            try:
                h_date = datetime.datetime.strptime(h.date, "%Y-%m-%d")
                if h_date.year == self.year and h_date.month == self.month:
                    holiday_days.add(h_date.day)
            except ValueError:
                continue

        # 運転可能かつ常勤のスタッフ
        drivers = [s for s in self.staffs if s.license_type >= 1 and not s.is_part_time]

        # スタッフが十分いる場合のみ制約発動
        if len(drivers) >= DRIVER_MIN_COUNT:
            for d in self.days:
                if d in holiday_days:
                    continue  # 施設休日はスキップ
                # その日働いているドライバーの数
                working_vars = []
                for s in drivers:
                    task_vars = [self.shifts[(s.id, d, t.id)] for t in self.tasks]
                    working_vars.append(sum(task_vars))

                self.model.Add(sum(working_vars) >= DRIVER_MIN_COUNT)

    def _c7_facility_holidays(self, holidays):
        """C7: 施設休日は全スタッフの全タスク割り当てを0に強制"""
        holiday_days = []
        for h in holidays:
            try:
                h_date = datetime.datetime.strptime(h.date, "%Y-%m-%d")
                if h_date.year == self.year and h_date.month == self.month:
                    holiday_days.append(h_date.day)
            except ValueError:
                continue

        for d in holiday_days:
            for s in self.staffs:
                for t in self.tasks:
                    if (s.id, d, t.id) in self.shifts:
                        self.model.Add(self.shifts[(s.id, d, t.id)] == 0)

    def _c8_leader_selection(self):
        """C8: リーダー・サブリーダーは相談・看護・介護職（常勤かつ訓練限定でない）のみ"""
        leader_tasks = [t for t in self.tasks if "リーダー" in t.name or "サブリーダー" in t.name]
        # パートまたは訓練限定のスタッフは割り当て不可
        forbidden_staffs = [s for s in self.staffs if s.is_part_time or s.can_only_train]

        for task in leader_tasks:
            for staff in forbidden_staffs:
                for day in self.days:
                    self.model.Add(self.shifts[(staff.id, day, task.id)] == 0)

    def _c9_vehicle_license_requirement(self):
        """C9: 車種に応じた運転制約"""
        for task in self.tasks:
            if "ワゴン" in task.name:
                # ワゴン可（license_type == 2）のみ許可
                forbidden = [s for s in self.staffs if s.license_type != 2]
            elif "普通車" in task.name:
                # 普通車以上（license_type >= 1）のみ許可
                forbidden = [s for s in self.staffs if s.license_type < 1]
            elif "運転" in task.name:
                # 汎用運転（license_type >= 1）のみ許可
                forbidden = [s for s in self.staffs if s.license_type < 1]
            else:
                continue

            for staff in forbidden:
                for day in self.days:
                    self.model.Add(self.shifts[(staff.id, day, task.id)] == 0)

    def _c10_no_driving_for_part_timers(self):
        """C10: パートスタッフは運転・送迎業務に割り当てない"""
        driving_tasks = [t for t in self.tasks if "運転" in t.name or "送迎" in t.name]
        part_time_staffs = [s for s in self.staffs if s.is_part_time]

        for task in driving_tasks:
            for staff in part_time_staffs:
                for day in self.days:
                    self.model.Add(self.shifts[(staff.id, day, task.id)] == 0)

    def _c11_training_qualification(self):
        """C11: 訓練業務は看護師（is_nurse=True）または訓練限定スタッフ（can_only_train=True）のみ"""
        train_tasks = [t for t in self.tasks if TaskCategory.TRAINING.value in t.name]
        unqualified_staffs = [s for s in self.staffs if not s.is_nurse and not s.can_only_train]

        for task in train_tasks:
            for staff in unqualified_staffs:
                for day in self.days:
                    self.model.Add(self.shifts[(staff.id, day, task.id)] == 0)

    def _c_monthly_rest_days(self, additional_days):
        """月間休日数ハード制約: 各スタッフの月間休日数 = 土曜日数 + 公休数"""
        saturdays_count = sum(
            1 for d in self.days
            if datetime.date(self.year, self.month, d).weekday() == 5  # 5 = 土曜日
        )
        required_rest_days = saturdays_count + additional_days
        required_work_days = len(self.days) - required_rest_days

        for s in self.staffs:
            total_work = sum(
                self.shifts[(s.id, d, t.id)]
                for d in self.days for t in self.tasks
            )
            self.model.Add(total_work == required_work_days)

    def _s1_work_limit(self):
        """S1: 勤務日数上限"""
        for s in self.staffs:
            total_work = sum(self.shifts[(s.id, d, t.id)] for d in self.days for t in self.tasks)
            self.model.Add(total_work <= s.work_limit)

    def _s2_absence_requests(self, absences):
        """S2: 希望休のペナルティ（ソフト制約）- 希望休の日に勤務した場合にペナルティを加算"""
        penalty_vars = []
        for a in absences:
            try:
                a_date = datetime.datetime.strptime(a.date, "%Y-%m-%d")
                if a_date.year == self.year and a_date.month == self.month:
                    s_id = a.staff_id
                    d = a_date.day
                    task_vars = [
                        self.shifts[(s_id, d, t.id)]
                        for t in self.tasks
                        if (s_id, d, t.id) in self.shifts
                    ]
                    if task_vars:
                        penalty_var = self.model.NewBoolVar(f"absence_penalty_s{s_id}_d{d}")
                        self.model.AddMaxEquality(penalty_var, task_vars)
                        penalty_vars.append(penalty_var)
            except ValueError:
                continue
        return penalty_vars
