# Stripe ダッシュボード作業（運営者向け）

コード側の準備が完了したら、以下を **Stripe Dashboard** で手動実施してください。

## 1. 本人確認（アカウント有効化）

1. [Stripe Dashboard](https://dashboard.stripe.com) にログイン
2. **設定 → ビジネス情報** で会社/事業者情報を入力
3. 代表者の **本人確認**（身分証アップロード等）を完了
4. アカウントステータスが **「支払いを受け付ける」** になるまで待つ

## 2. 銀行口座登録

1. **設定 → 銀行口座とスケジュール**
2. 入金先の **日本の銀行口座** を登録
3. 入金スケジュールを確認（通常は日次/週次で自動入金）

> ファン・サポーターからの決済はこの口座へ入金されます。アスリートへの支払いは、管理画面で出金承認後にこの口座から手動振込してください。

## 3. Live モードへ切替

Dashboard 右上のトグルで **「テストデータ」→「本番データ」** に切り替えます。

## 4. 商品・Price 作成（サポーター）

1. **商品** → **商品を追加**
2. 名前: `TGPLUSサポーター`
3. 価格: **月額 ¥1,000（税込）**、請求サイクル: 毎月
4. 作成された **Price ID**（`price_...`）を控える
5. 本番環境変数 `STRIPE_SUPPORTER_PRICE_ID_LIVE` に設定

### ポイント購入用

ポイント購入は Checkout の `price_data`（動的価格）を使用しているため、個別 Product 作成は不要です。

## 5. API キー取得（Live）

1. **開発者 → API キー**
2. **公開可能キー** `pk_live_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **シークレットキー** `sk_live_...` → `STRIPE_SECRET_KEY`

⚠️ シークレットキーはサーバー環境変数のみ。Git やフロントエンドに置かないこと。

## 6. Webhook 登録（本番）

1. **開発者 → Webhook**
2. **エンドポイントを追加**
3. URL: `https://（本番ドメイン）/api/stripe/webhook`
4. イベントを選択:

   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`

5. 作成後の **署名シークレット** `whsec_...` → `STRIPE_WEBHOOK_SECRET_LIVE`

## 7. Customer Portal（サブスク解約用）

1. **設定 → カスタマーポータル**
2. ポータルを有効化
3. **サブスクリプションのキャンセル** を許可
4. 戻り URL は本番ドメイン（例: `https://your-domain.com/supporter`）

## 8. 本番環境変数の設定（Vercel 等）

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
STRIPE_SUPPORTER_PRICE_ID_LIVE=price_...
SUPABASE_SERVICE_ROLE_KEY=（既存）
```

デプロイ後、サーバーを再起動してください。

## 9. 動作確認チェックリスト

- [ ] ポイント購入（少額でテスト → すぐ返金可）
- [ ] ポイント残高反映
- [ ] サポーター加入（¥1,000/月）
- [ ] 限定コンテンツ閲覧（`/fan/exclusive`）
- [ ] サポーター解約（Customer Portal）
- [ ] ギフト送信
- [ ] 管理画面で売上・出金申請確認

## 使わないもの

- **Stripe Connect** — 有効化不要
- **Connect Webhook**（`account.updated` 等）— 登録不要
