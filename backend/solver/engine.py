import datetime
from ortools.sat.python import cp_model
from .constraints import ShiftConstraints
from .exporter import create_excel_file, extract_shift_data

def generate_shift_excel(staffs, tasks, requirements, absences, year, month, holidays=None, additional_days=None):
    model = cp_model.CpModel()

    if month == 12:
        next_month = datetime.date(year + 1, 1, 1)
    else:
        next_month = datetime.date(year, month + 1, 1)
    last_day = (next_month - datetime.timedelta(days=1)).day
    days = list(range(1, last_day + 1))

    shifts = {}
    for s in staffs:
        for d in days:
            for t in tasks:
                shifts[(s.id, d, t.id)] = model.NewBoolVar(f"shift_s{s.id}_d{d}_t{t.id}")

    constraints = ShiftConstraints(model, shifts, staffs, tasks, days, year, month)
    constraints.add_hard_constraints(requirements, absences, holidays or [], additional_days)
    penalties = constraints.add_soft_constraints(absences)

    # 希望休違反ペナルティを最小化
    if penalties:
        model.Minimize(sum(penalties))

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        excel_path = create_excel_file(solver, shifts, staffs, tasks, days, year, month)
        shift_data = extract_shift_data(solver, shifts, staffs, tasks, days, year, month)
        return excel_path, shift_data
    else:
        return None, None