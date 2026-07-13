# TGPLUS 本番公開セットアップ

## 決済モデル

- **ファンの決済**（ポイント購入・サポーター月額）は **TGPLUS運営のStripeアカウント** で受け取り、登録銀行口座へ入金されます。
- **Stripe Connect は使用しません。**
- **ギフト**はポイント消費（内部台帳）。アスリートの売上は `earnings_balance` に蓄積し、出金申請 → 管理画面承認 → **運営が銀行振込** で支払います。

## 1. Supabase SQL（必須）

既存スキーマ実行後、順に **SQL Editor** で実行:

```
supabase/production-v1-schema.sql
supabase/production-payment-v2-schema.sql
```

確認:

```bash
node scripts/verify-payment-v2-schema.mjs
```

## 2. 環境変数（本番 / Vercel）

### テスト環境（開発）

| 変数 | 説明 |
|------|------|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET_TEST` | テスト Webhook 署名 |
| `STRIPE_SUPPORTER_PRICE_ID` | テスト用 Price ID |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

### 本番環境（Live）

| 変数 | 説明 |
|------|------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET_LIVE` | 本番 Webhook 署名 |
| `STRIPE_SUPPORTER_PRICE_ID_LIVE` | 本番 Price ID（月額¥1,000） |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook 処理用 |

**重要:** `sk_test` と `pk_live` を混在させないこと。

## 3. Stripe Webhook（本番）

エンドポイント:

```
https://your-domain.com/api/stripe/webhook
```

登録イベント:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

`account.updated`（Connect用）は **不要** です。

## 4. 管理者

```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
```

## 5. ビルド確認

```bash
node scripts/verify-stripe-env.mjs
npm run build
npm run start
```

## 6. ポイント表示ルール

- UI: **1,000ポイント** 形式
- 円表示: Stripe Checkout / 請求履歴 / 特定商取引法のみ
- 内部: 1ポイント = 1円

## 7. アスリート出金フロー

1. ファンがポイント購入（Stripe → 運営口座）
2. ファンがギフト送信（ポイント → アスリート `earnings_balance`）
3. アスリートが出金申請（`/athlete/earnings`）
4. 管理者が承認（`/admin/dashboard`）→ 運営が銀行振込

Stripe Dashboard での作業手順は `docs/STRIPE_DASHBOARD_TASKS.md` を参照してください。

Vercel へのデプロイ手順は `docs/VERCEL_DEPLOYMENT.md` を参照してください。
