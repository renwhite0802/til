# [.gitignoreの指定ファイルをGitの変更履歴に上がってこないようにする]

## 背景 (Context)

- 以下のファイルをGitの変更履歴としてあげない様にしたい
  　- `.gitignore
  　- README.md

## 躓いたポイント (Problem)

- gitignoreにファイルを指定していたが、変更ファイルに混じってコミット対象に表示されていた

## 解決策 (Solution)

- 解決したコード片や設定、参考URL

```bash
# README.md を変更検知の対象外にする
git update-index --assume-unchanged README.md

# .gitignore を変更検知の対象外にする
git update-index --assume-unchanged .gitignore
```

## 教訓 (Takeaway)

- gitignoreに指定するだけではだめ
- 対象のファイルを変更検知の対象外にしたい場合は上記を実行する.
