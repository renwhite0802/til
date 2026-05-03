# [タイトル：何ができるようになったか]

- 日付: 2026-05-01

## 背景 (Context)

- 作成したリポジトリに対して、mdファイルなどのコミット＆プッシュ
- プッシュされたmdファイルをGitHub ActionsでReadmeに追加

## 躓いたポイント (Problem)

- どんなエラーが出たか、何が理解できなかったか
- masterブランチにいる状態でコミット＆プッシュをしたら、GitHub上でmainブランチに反映されなかった

## 解決策 (Solution)

- 以下gitコマンドを実行して、masterにプッシュした内容をmainにマージ

```bash
git checkout main
git merge master
git push origin main
```

- github workflowのymlに以下追加

```yaml
on:
  push:
    branches:
      - main # ここが master になっていると main へのプッシュで動きません
```

## 教訓 (Takeaway)

- 次回からどう動くか、本質的な学び
- プッシュ時にブランチがmainとなっていることを確認して、コミット＆プッシュを実行する
