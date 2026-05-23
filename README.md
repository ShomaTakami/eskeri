# Eskeri

**Think less. Start now.**

億劫なことも、5分だけ。

EskeriはTodoアプリではありません。

「始めるまでの重さ」を軽くする、行動開始アプリです。

---

## 思想

- **5分をとっかかりにする** — 最初の5分が成功の単位
- **重いことを始められた自分を可視化** — 開始前の重さ（1〜5）を記録
- **Pointは自己申告** — 「取り組めた」と押したときだけ加算（放置や「終わる」では加算しない）
- **ご褒美は任意** — 義務ではなく、ゆるい目安
- **責めない** — できたことだけを履歴に残す

---

## Features

- **5分だけ始める** — シンプルなタイマーで行動を開始
- **重さ（1〜5）記録** — 開始前・完了後の感覚を数値で記録
- **Pointシステム** — 重さに応じたポイント（「取り組めた」時のみ）
- **ご褒美設定** — 最大3つまで、必要ポイントを自分で設定
- **履歴・傾向** — 始めた記録と時間帯の傾向を表示
- **初回オンボーディング** — 2ページ構成のシンプルな導入

---

## Tech

- [Expo](https://expo.dev/) SDK 56
- React Native
- TypeScript
- AsyncStorage（ローカル保存）
- React Navigation（タブ + スタック）

---

## 画面構成

| タブ | 内容 |
|------|------|
| **Home** | 行動名入力・重さ選択・タイマー開始 |
| **History** | 記録一覧・傾向（今日/今週・時間帯） |
| **Settings** | ご褒美の設定 |

---

## 開発

### 必要環境

- Node.js（Expo 56 推奨バージョン）
- [Expo Go](https://expo.dev/go) または開発ビルド

### 起動

```bash
npm install
npx expo start
```

キャッシュをクリアして起動する場合:

```bash
npx expo start -c
```

### スクリプト

| コマンド | 説明 |
|----------|------|
| `npm start` | Expo 開発サーバー起動 |
| `npm run android` | Android |
| `npm run ios` | iOS |
| `npm run web` | Web |

### 補足

- **ローカル通知** — v1 では Expo Go 向けに `ENABLE_NOTIFICATIONS = false`（`src/features/actionStart/services/timerNotifications.ts`）
- **Debug** — `__DEV__` 時のみ Settings 下部に表示（データ初期化など）

---

## プロジェクト構成（抜粋）

```
src/
├── features/
│   ├── actionStart/   # タイマー・履歴・行動ログ
│   ├── momentum/      # ポイント・ご褒美
│   └── settings/
├── navigation/
└── shared/            # オンボーディング・共通UI
```

---

## License

Private
