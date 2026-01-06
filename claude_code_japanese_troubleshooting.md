# Claude Code - 日本語対応トラブルシューティングガイド

## エラーの原因

表示されたエラー：
```
byte index 17 is not a char boundary; it is inside '理' (bytes 15..18) of `のシフト管理</h1>`
```

これは、Claude CodeのRust実装が日本語（UTF-8マルチバイト文字）の文字境界を正しく処理できていないことが原因です。

---

## 解決方法

### ✅ 方法1: 英語で指示を出す（推奨）

**最も確実な方法**です。日本語のファイルやコメントを扱う場合でも、Claude Codeへの指示は英語で出してください。

#### 実行例

```bash
cd /path/to/miniDX
claude
```

プロンプトは英語で：

```
Please follow these steps:

1. Read spec_for_development.md to understand the project overview
2. Read the PDF meeting minutes to understand requirements
3. Analyze the current codebase and report:
   - Implemented features
   - Unimplemented features
   - Code that needs to be deleted (Static version, etc.)
   - Current directory structure

Summarize the analysis in bullet points.
```

その後の実装指示も英語で：

```
According to section 5.1 of spec_for_development.md,
implement services/shiftAlgorithm.js.
Follow the input/output data structures exactly as specified.
```

---

### ✅ 方法2: CLAUDE.mdを英語版に置き換える

プロジェクトルートの`CLAUDE.md`を英語版（`CLAUDE_EN.md`）に置き換えてください。

```bash
cd /path/to/miniDX
mv CLAUDE.md CLAUDE.md.ja  # 日本語版をバックアップ
mv CLAUDE_EN.md CLAUDE.md  # 英語版を使用
```

その後、Claude Codeを再起動：

```bash
claude
```

---

### ✅ 方法3: 環境変数を設定して詳細情報を取得

エラーの詳細を確認する場合：

```bash
RUST_BACKTRACE=1 claude
```

これによりスタックトレースが表示され、どの処理で問題が発生しているか特定できます。

---

### ✅ 方法4: 日本語ファイルを扱う際の回避策

日本語のファイル名やコンテンツを避けられない場合：

#### 4-1: ファイル名を英語に変更

```bash
# 日本語ファイル名を英語に
mv 2025_12_22_議事録.pdf 2025_12_22_meeting_minutes.pdf
```

#### 4-2: 日本語コンテンツは直接参照せず、要約を英語で提供

```
The meeting minutes (2025_12_22_議事録.pdf) contain the following key decisions:
- UI: Calendar format (Design 2) was adopted
- Algorithm: Constraint-priority type (not fully automatic)
- Priority: Shift management by Jan 14, AI features by Feb

Please implement based on these requirements.
```

---

## 実践的なワークフロー（日本語プロジェクトの場合）

### Step 1: 初期設定（1回のみ）

```bash
cd /path/to/miniDX

# 英語版のCLAUDE.mdを配置
cp /path/to/CLAUDE_EN.md ./CLAUDE.md

# 日本語ファイルは残してOK（参照しないだけ）
ls
# spec_for_development.md
# 2025_12_22_議事録.pdf
# CLAUDE.md  ← 英語版
```

### Step 2: Claude Code起動

```bash
claude
```

### Step 3: 初期分析（英語で指示）

```
Please analyze this React project:

1. Read CLAUDE.md for project guidelines
2. Check the current codebase structure
3. Identify what's implemented and what's missing
4. List any Static version files that need deletion

Report your findings.
```

### Step 4: 機能実装（英語で指示）

```
Now implement the shift generation algorithm:

File: src/services/shiftAlgorithm.js

Requirements (from spec_for_development.md section 5.1):
1. Input: staff array and constraints object
2. Process: exclude days off → place fixed assignments → auto-assign remainder
3. Constraint checks: nursing (min 1), driving (min 6), bathing (min 6)
4. Output: daily assignments and warnings

Implement with proper error handling and TypeScript types if possible.
```

### Step 5: テスト作成（英語で指示）

```
Create unit tests for shiftAlgorithm.js:

Test cases:
1. Normal case: Valid shift generated
2. Edge case: Warning when 0 nursing staff
3. Edge case: Warning when only 5 driving staff
4. Concurrent roles: Driving + training correctly handled

Use Jest and test both success and failure scenarios.
```

---

## よくある問題と対処法

### Q1: 日本語のコメントやログを出力したい

**A:** コード内の日本語コメントは問題ありません。Claude Codeへの**指示だけ英語にする**ことが重要です。

```javascript
// これは問題ない：日本語コメント
function calculateShift() {
  // シフトを計算
  console.log("シフト生成開始"); // 日本語ログもOK
  // ...
}
```

### Q2: 日本語のエラーメッセージが必要

**A:** エラーメッセージは日本語でもOKです。Claude Codeに渡す指示だけ英語にしてください。

```javascript
if (!hasNursingStaff) {
  return {
    error: true,
    message: "看護師が1名以上必要です" // 日本語OK
  };
}
```

### Q3: 仕様書が日本語の場合

**A:** Claude Codeに指示する際、**要件を英語で要約**して伝えてください。

```
The spec says (in Japanese):
- Calendar view must show staff names and roles
- Color coding: nursing=blue, driving=green
- Click to show details

Please implement CalendarView.jsx with these requirements.
```

---

## デバッグ時のヒント

### エラーが再発した場合

1. **会話履歴をクリア**

```
/clear
```

2. **英語で再開**

```
Let's continue. Please read CLAUDE.md and implement the next feature.
```

### コンテキストが混乱している場合

```
Reset context. From now on:
- All instructions must be in English
- Japanese content in files is OK
- Focus on spec_for_development.md section [X]
```

---

## チートシート

### 基本コマンド（すべて英語で）

| 日本語（使わない） | 英語（使う） |
|---|---|
| ファイルを読んで | Read the file |
| 実装して | Implement |
| テストを作成 | Create tests |
| バグを修正 | Fix the bug |
| コミットして | Create a commit |
| PRを作成 | Create a pull request |

### よく使うフレーズ

```
# 分析
Analyze the current codebase and report...

# 実装
According to section X of spec_for_development.md, implement...

# 確認
Verify that the implementation meets the requirements...

# 修正
Fix the issue where...

# テスト
Create unit tests for...

# コミット
Commit these changes with a descriptive message
```

---

## まとめ

1. ✅ **Claude Codeへの指示は常に英語で**
2. ✅ **CLAUDE.mdは英語版を使用**
3. ✅ **日本語のファイルやコメントは問題なし**
4. ✅ **エラーが出たら`/clear`して英語で再開**

この方法で、日本語プロジェクトでもClaude Codeを快適に使用できます！
