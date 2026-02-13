import os
import datetime
from openpyxl import Workbook
from openpyxl.styles import Alignment, PatternFill, Font

def create_excel_file(solver, shifts, staffs, tasks, days, year, month):
    wb = Workbook()
    ws = wb.active
    ws.title = f"{month}月シフト"

    font_header = Font(bold=True, color="FFFFFF")
    fill_header = PatternFill("solid", fgColor="007BFF")
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.cell(row=1, column=1, value="業務 / 日付")
    for i, d in enumerate(days):
        c = ws.cell(row=1, column=i+2, value=f"{d}日")
        c.font = font_header
        c.fill = fill_header
        c.alignment = center

    for row_idx, t in enumerate(tasks, start=2):
        ws.cell(row=row_idx, column=1, value=t.name).alignment = center

        for col_idx, d in enumerate(days, start=2):
            assigned = []
            for s in staffs:
                if solver.Value(shifts[(s.id, d, t.id)]) == 1:
                    assigned.append(s.name)

            val = "\n".join(assigned)
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.alignment = center

            if not val:
                cell.fill = PatternFill("solid", fgColor="EEEEEE")

    if not os.path.exists("static"):
        os.makedirs("static")

    filename = f"static/shift_{year}_{month}_{datetime.datetime.now().strftime('%H%M%S')}.xlsx"
    wb.save(filename)
    return filename

def extract_shift_data(solver, shifts, staffs, tasks, days, year, month):
    """フロントエンド表示用にJSONデータを抽出"""
    shift_data = {}
    for d in days:
        date_str = f"{year}-{month:02d}-{d:02d}"
        assignments = []
        for t in tasks:
            for s in staffs:
                if solver.Value(shifts[(s.id, d, t.id)]) == 1:
                    assignments.append({
                        "staffId": s.id,
                        "staffName": s.name,
                        "taskId": t.id,
                        "taskName": t.name,
                        "isNurse": s.is_nurse,
                    })
        if assignments:
            shift_data[date_str] = assignments
    return shift_data