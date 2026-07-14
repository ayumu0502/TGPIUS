import Link from "next/link";
import ContactForm from "@/components/contact/ContactForm";

export default function LandingContactSection() {
  return (
    <section id="contact" className="landing-section landing-contact-section scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="landing-badge">Sponsor &amp; Partner</span>
          <h2 className="ja-heading mt-5 text-3xl font-bold tracking-tight text-[var(--landing-text)] sm:text-4xl">
            企業・スポンサー募集
          </h2>
          <div className="ja-body mx-auto mt-6 max-w-2xl space-y-4 text-left text-base leading-relaxed text-[var(--landing-muted)] sm:text-center">
            <p>
              TGPLUSでは、アスリートと企業をつなぐパートナー企業・スポンサー様を募集しています。
            </p>
            <p>
              スポンサー契約、イベント協賛、タイアップ企画、広告掲載、福利厚生への導入など、さまざまな形でご一緒いただけます。
            </p>
            <p>
              「若いアスリートを応援したい」「スポーツを通じて企業価値を高めたい」とお考えの企業・団体様は、ぜひお気軽にお問い合わせください。
            </p>
            <p className="text-sm font-medium text-[var(--landing-gold-dark)]">
              通常2営業日以内に担当者よりご返信いたします。
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <ContactForm formId="landing-contact-form" />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-[var(--landing-muted)]">
          個人のファンの方は
          <Link href="/register" className="mx-1 font-medium text-[var(--landing-gold-dark)] hover:underline">
            新規登録
          </Link>
          よりご利用ください。
        </p>
      </div>
    </section>
  );
}
