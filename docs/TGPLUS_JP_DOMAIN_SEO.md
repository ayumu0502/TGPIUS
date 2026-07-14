# tgplus.jp 独自ドメイン・SEO セットアップ

コード側の準備は完了しています。ドメイン購入と DNS 設定はあなたが手動で行ってください。

## コードで実装済み

- `vercel.json`: `www.tgplus.jp` → `tgplus.jp` へ 301 リダイレクト
- `tgpius.vercel.app` → `tgplus.jp` のリダイレクトは **tgplus.jp の DNS 設定完了後** に Vercel ダッシュボードで有効化してください（`/_next/static` など静的アセットまでリダイレクトすると CSS/JS が読み込めず表示が崩れます）
- `NEXT_PUBLIC_APP_URL` を `https://tgplus.jp` に向けるデプロイスクリプト
- `sitemap.xml` / `robots.txt`（Next.js 動的生成）
- 全ページ SEO（title / description / canonical / OGP / Xカード）
- ログイン・管理画面など `noindex`
- Google Search Console 用 `GOOGLE_SITE_VERIFICATION` 環境変数対応

## 正規URL・SEO基本情報

| 項目 | 値 |
|------|-----|
| サービス名 | TGPLUS |
| 正規URL | https://tgplus.jp |
| タイトル | TGPLUS｜アスリートとファンをつなぐ応援プラットフォーム |
| 説明文 | TGPLUSは、アスリート・ファン・スポンサーをつなぐスポーツ応援プラットフォームです。選手の活動を知り、ポイントやギフトを通じて応援できます。 |

## Supabase で変更する項目

**Authentication → URL Configuration**

| 設定 | 値 |
|------|-----|
| Site URL | `https://tgplus.jp` |
| Redirect URLs | `https://tgplus.jp/**` |

追加で登録推奨:

```
https://tgplus.jp/login
https://tgplus.jp/register
https://tgplus.jp/points/purchase/success
https://tgplus.jp/supporter/success
```

## Stripe で変更する項目

`NEXT_PUBLIC_APP_URL=https://tgplus.jp` 設定後、Checkout URL は自動で新ドメインになります。

**Stripe Dashboard → Developers → Webhooks** で本番エンドポイントを確認・更新:

| 項目 | URL |
|------|-----|
| Webhook URL | `https://tgplus.jp/api/stripe/webhook` |
| success_url（ポイント） | `https://tgplus.jp/points/purchase/success?session_id={CHECKOUT_SESSION_ID}` |
| cancel_url（ポイント） | `https://tgplus.jp/points/purchase/cancel` |
| success_url（サポーター） | `https://tgplus.jp/supporter/success?session_id={CHECKOUT_SESSION_ID}` |
| cancel_url（サポーター） | `https://tgplus.jp/supporter` |

## Google Search Console

1. https://search.google.com/search-console にアクセス
2. プロパティ追加: `https://tgplus.jp`
3. 所有権確認: HTML タグ方式
4. Vercel 環境変数に `GOOGLE_SITE_VERIFICATION=（表示されたコード）` を追加
5. 再デプロイ後、確認完了
6. サイトマップ送信: `https://tgplus.jp/sitemap.xml`
