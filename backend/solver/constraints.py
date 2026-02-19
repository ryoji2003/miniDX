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

    def add_hard_constraints(self, requirements, absences, holidays=None):
        """すべてのハード制約（必須ルール）を適用"""
        self._c1_one_task_per_staff()
        self._c2_daily_requirements(requirements)
        self._c3_absence_requests(absences)
        self._c4_nurse_exclusive()
        self._c5_training_exclusive()
        self._c6_drivers_limit()
        self._c7_facility_holidays(holidays or [])

    def add_soft_constraints(self):
        """努力目標（できれば満たしたいルール）"""
        self._s1_work_limit()

    def _c1_one_task_per_staff(self):
        """C1: 1日1人1業務まで"""
        for s in self.staffs:
            for d in self.days:
                self.model.Add(sum(self.shifts[(s.id, d, t.id)] for t in self.tasks) <= 1)

    def _c2_daily_requirements(self, requirements):
        """C2: 日ごとの必要人数を満たす"""
        req_map = {}
        for r in requirements:
            try:
                r_date = datetime.datetime.strptime(r.date, "%Y-%m-%d")
                if r_date.year == self.year and r_date.month == self.month:
                    req_map[(r_date.day, r.task_id)] = r.count
            except ValueError:
                continue

        for d in self.days:
            for t in self.tasks:
                if (d, t.id) in req_map:
                    count = req_map[(d, t.id)]
                    self.model.Add(sum(self.shifts[(s.id, d, t.id)] for s in self.staffs) == count)

    def _c3_absence_requests(self, absences):
        """C3: 希望休の日はシフトに入れない"""
        abs_map = []
        for a in absences:
            try:
                a_date = datetime.datetime.strptime(a.date, "%Y-%m-%d")
                if a_date.year == self.year and a_date.month == self.month:
                    abs_map.append((a.staff_id, a_date.day))
            except ValueError:
                continue

        # 特定の組み合わせを0にする
        for s_id, d in abs_map:
            for t in self.tasks:
                if (s_id, d, t.id) in self.shifts:
                    self.model.Add(self.shifts[(s_id, d, t.id)] == 0)

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

    def _c6_drivers_limit(self):
        """C6: 運転できる人数を確保"""
        # 運転可能かつ常勤のスタッフ
        drivers = [s for s in self.staffs if s.license_type >= 1 and not s.is_part_time]
        
        # スタッフが十分いる場合のみ制約発動
        if len(drivers) >= DRIVER_MIN_COUNT:
            for d in self.days:
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

    def _s1_work_limit(self):
        """S1: 勤務日数上限"""
        for s in self.staffs:
            total_work = sum(self.shifts[(s.id, d, t.id)] for d in self.days for t in self.tasks)
            self.model.Add(total_work <= s.work_limit)