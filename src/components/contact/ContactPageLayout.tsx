import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import ContactForm from "@/components/contact/ContactForm";
import LegalFooterLinks from "@/components/legal/LegalFooterLinks";

export default function ContactPageLayout() {
  return (
    <div className="min-h-screen bg-[var(--content-bg)]">
      <header className="border-b border-[var(--card-border)] bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <Link href="/" className="text-lg font-bold tracking-[0.15em] text-[var(--text-primary)]">
              TGPLUS
            </Link>
          </div>
          <Link
            href="/login"
            className="text-sm text-[var(--text-muted)] transition hover:text-[var(--gold-dark)]"
          >
            ログイン
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold-dark)]">
          Contact
        </p>
        <h1 className="ja-heading mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          企業・スポンサー募集
        </h1>
        <div className="ja-body mt-4 max-w-2xl space-y-4 text-base leading-relaxed text-[var(--text-muted)]">
          <p>
            TGPLUSでは、アスリートと企業をつなぐパートナー企業・スポンサー様を募集しています。
          </p>
          <p>
            スポンサー契約、イベント協賛、タイアップ企画、広告掲載、福利厚生への導入など、さまざまな形でご一緒いただけます。
          </p>
          <p>
            「若いアスリートを応援したい」「スポーツを通じて企業価値を高めたい」とお考えの企業・団体様は、ぜひお気軽にお問い合わせください。
          </p>
          <p className="text-sm font-medium text-[var(--gold-dark)]">
            通常2営業日以内に担当者よりご返信いたします。
          </p>
        </div>

        <div className="mt-10">
          <ContactForm formId="contact-page-form" />
        </div>
      </main>

      <footer className="border-t border-[var(--card-border)] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <LegalFooterLinks />
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold-dark)]">
            トップへ戻る
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-5xl text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} TGPLUS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
