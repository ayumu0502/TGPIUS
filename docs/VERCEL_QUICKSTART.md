# Vercel クイックスタート（TGPIUS / テストモード）

リポジトリ: https://github.com/ayumu0502/TGPIUS

独自ドメインなし・Stripe **テストモード** のまま `〇〇.vercel.app` で公開する手順です。

---

## あなたが行う操作（Vercel）

### 1. Vercel にログイン

1. https://vercel.com を開く
2. **Continue with GitHub** でログイン

### 2. リポジトリをインポート

1. **Add New… → Project**
2. **TGPIUS** の **Import** をクリック
3. **Project Name**: `tgpius`（そのままでOK）
4. Framework: **Next.js**（自動）

### 3. 環境変数を登録（Deploy の前）

**Environment Variables** に、`.env.local` の値を**手入力**で登録します。  
（ファイルはアップロードしない）

| Key | 値の出所 | 備考 |
|-----|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | 秘密 |
| `STRIPE_SECRET_KEY` | `.env.local` | `sk_test_` のみ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `.env.local` | `pk_test_` のみ |
| `STRIPE_SUPPORTER_PRICE_ID` | `.env.local` | テスト用 Price |
| `STRIPE_PLATFORM_FEE_RATE` | `0.1` | 固定 |
| `STRIPE_ALLOW_TEST_IN_PRODUCTION` | `true` | **Vercelでテストキー利用に必須** |
| `NEXT_PUBLIC_APP_URL` | デプロイ後に更新 | 初回は `https://tgpius.vercel.app` など仮設定可 |

**登録しない:** `sk_live_` / `pk_live_` / Live 用 Webhook

`STRIPE_WEBHOOK_SECRET_TEST` はデプロイ後・Webhook 作成後に追加。

### 4. Deploy

1. **Deploy** をクリック
2. 完了後 **Visit** で URL を確認（例: `https://tgpius-xxxxx.vercel.app`）

### 5. URL を確定して再デプロイ

1. **Settings → Environment Variables**
2. `NEXT_PUBLIC_APP_URL` を実際の Vercel URL に変更
3. **Deployments → ⋮ → Redeploy**

### 6. Supabase の URL 設定

Supabase Dashboard → **Authentication → URL Configuration**

- **Site URL**: `https://（Vercel URL）`
- **Redirect URLs**: `https://（Vercel URL）/**`

### 7. Stripe Webhook（テストモード）

Stripe Dashboard（**テストモード**）→ **開発者 → Webhook**

```
https://（Vercel URL）/api/stripe/webhook
```

署名シークレット → Vercel の `STRIPE_WEBHOOK_SECRET_TEST` → **Redeploy**

---

## 動作確認

- [ ] トップページが開く
- [ ] ログイン / 登録
- [ ] ポイント購入（カード `4242 4242 4242 4242`）
- [ ] Webhook が 200（Stripe Dashboard）

---

## セキュリティ

- `.env.local` は GitHub に含めない（`.gitignore` 済み）
- 秘密鍵をチャット・スクショに貼らない
