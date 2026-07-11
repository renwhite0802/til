# GitHub Actionsでの日付自動更新の不具合を修正し、tsx実行環境のTS設定を整理した

- 日付: 2026-07-11

## 背景 (Context)

- GitHub Actionsで、リポジトリ内のMarkdownファイルをスキャンし、README.mdにTILリストを自動生成する仕組みを運用していた
- 各記事の日付は、ファイルの更新日時を取得して表示する設計になっていた

## 躓いたポイント (Problem)

- 対象ファイルをコミット＆プッシュしたところ、過去にコミット済みの他のファイルの日付まで、すべて実行日（今日の日付）に書き換わってしまった
- 原因調査の過程で、`scripts/update-readme.ts` 内で `path` モジュールをimportした際に以下のエラーが発生
  - `名前 'path' が見つかりません。ノードの型定義をインストールする必要がありますか?`
- `@types/node` インストール後、今度は以下の警告が発生
  - `オプション 'moduleResolution=node10' は非推奨であり、TypeScript 7.0 で機能しなくなります`

## 解決策 (Solution)

**1. 日付自動更新の不具合**

- 原因：`fs.statSync(filePath).mtime` を使ってファイルの更新日時を取得していたため。`actions/checkout` はチェックアウト時に全ファイルを新規に書き出すので、mtimeは「実際のコミット日時」ではなく「チェックアウトを実行した時刻」になってしまう
- 対処：`fs.statSync().mtime` の代わりに、`git log` からファイルごとの最終コミット日時を取得するよう変更

```ts
import { execSync } from "child_process";

const getLastCommitDate = (relativePath: string): string | null => {
  try {
    const result = execSync(
      `git log -1 --follow --format=%cI -- "${relativePath}"`,
      { encoding: "utf-8" },
    ).trim();
    return result || null;
  } catch {
    return null;
  }
};
```

**2. `path` モジュールの型エラー**

- 原因：`@types/node` が未インストールで、Node.js標準モジュールの型定義が認識されていなかった

```bash
npm install --save-dev @types/node
```

**3. `moduleResolution` の非推奨警告**

- 原因：`tsconfig.json` の `moduleResolution: "node"`（node10）が非推奨設定だった
- 対処：`tsx` 実行環境に適した `bundler` 設定に変更（`module` もESNext系に合わせて変更が必要）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "types": ["node"],
    "strict": true,
    "skipLibCheck": true
  }
}
```

- 参考URL: http://aka.ms/ts6

## 教訓 (Takeaway)

- CI環境（GitHub Actions等）での「ファイルの日付」を扱う際は、`fs.stat().mtime`のようなファイルシステム由来の値を信用しない。`actions/checkout`はチェックアウト時に全ファイルのmtimeを上書きするため、Gitのコミット履歴（`git log --follow --format=%cI -- <path>`）から取得するのが正しい方法
- TypeScript/Node環境で標準モジュールの型エラーが出たら、まず `@types/node` の有無を疑う
- `tsconfig.json` の `moduleResolution` は将来的に `node`（node10）系が廃止される方向にあるため、`tsx`などのモダンなツールと組み合わせる場合は `bundler` を指定するのが無難
