import json
from ortools.sat.python import cp_model
from openpyxl import Workbook
from openpyxl.styles import Alignment

def main():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("エラー: data.json が見つかりません。")
        return

    staff_list = data['staff_list']
    tasks = data['tasks']
    days = list(range(1, data['calendar']['days'] + 1))

    model = cp_model.CpModel()
    shifts = {}

    # 変数定義
    for s in staff_list:
        for d in days:
            for t in tasks:
                shifts[(s['id'], d, t['id'])] = model.NewBoolVar(f"shift_{s['id']}_{d}_{t['id']}")

    #制約条件
    # C1: 1日1人1業務まで
    for s in staff_list:
        for d in days:
            model.Add(sum(shifts[(s['id'], d, t['id'])] for t in tasks) <= 1)

    # C2: 日次要件 (必須人数)
    for d in days:
        for req in data['daily_requirements']:
            t_id = req['task_id']
            count = req['count']
            model.Add(sum(shifts[(s['id'], d, t_id)] for s in staff_list) == count)

    # C3: スキル制約
    for s in staff_list:
        for t in tasks:
            if t['required_role'] not in s['roles']:
                for d in days:
                    model.Add(shifts[(s['id'], d, t['id'])] == 0)

    # C4: 希望休制約
    for req in data['absence_requests']:
        if req['date'] in days:
            s_id = req['staff_id']
            model.Add(sum(shifts[(s_id, req['date'], t['id'])] for t in tasks) == 0)

    #努力目標
    # S1: 勤務日数の平準化
    
    # 全期間で必要な総シフト数 (コマ数)
    total_needed = sum(req['count'] for req in data['daily_requirements']) * len(days)
    # 1人あたりの目標勤務日数 (切り捨て)
    target = total_needed // len(staff_list)
    
    # 各スタッフの勤務日数の「ズレ」を格納するリスト
    all_diffs = []

    for s in staff_list:
        work_days = sum(shifts[(s['id'], d, t['id'])] for d in days for t in tasks)
        # ズレ (diff) を計算
        diff = model.NewIntVar(0, len(days), f"diff_{s['id']}")
        model.Add(work_days - target <= diff)
        model.Add(target - work_days <= diff)
        all_diffs.append(diff)

    model.Minimize(sum(all_diffs))

    #ソルバーの実行
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    #結果出力
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print("【シフト作成成功】")
        print(f"ステータス: {solver.StatusName(status)}")
        # ペナルティ値は「全員のズレの合計」なので、0に近いほど全員が平等
        print(f"不平等スコア: {solver.ObjectiveValue()} (小さいほど平等)\n")

        # Excel出力
        wb = Workbook()
        ws = wb.active
        ws.title = "シフト表"
        
        headers = ["業務名"] + [f"{d}日" for d in days]
        ws.append(headers)

        for t in tasks:
            row = [t['name']]
            for d in days:
                names = []
                for s in staff_list:
                    if solver.Value(shifts[(s['id'], d, t['id'])]) == 1:
                        names.append(s['name'])
                row.append("\n".join(names))
            ws.append(row)

        # 見た目調整
        for row in ws.iter_rows():
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')

        wb.save("shift_result_v6.xlsx")
        print("Excelファイルを出力しました: shift_result.xlsx\n")
        
        # コンソール確認用
        print("--- 勤務日数の内訳 ---")
        for s in staff_list:
            c = 0
            for d in days:
                for t in tasks:
                    if solver.Value(shifts[(s['id'], d, t['id'])]) == 1:
                        c += 1
            print(f"{s['name']}: {c}日")

    else:
        print("【解なし】 制約が厳しすぎます。")

if __name__ == "__main__":
    main()