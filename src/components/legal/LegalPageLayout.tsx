import Link from "next/link";
import type { LegalPageContent } from "@/lib/legal/content";
import LegalFooterLinks from "./LegalFooterLinks";
import BackButton from "@/components/ui/BackButton";

type LegalPageLayoutProps = {
  content: LegalPageContent;
};

function ProseParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 24)}
          className="ja-body text-[15px] leading-[2.1] text-[var(--text-secondary)] sm:text-base sm:leading-[2.2]"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function SectionBlocks({ sections }: { sections: NonNullable<LegalPageContent["sections"]> }) {
  return (
    <div className="space-y-10 sm:space-y-12">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {section.heading}
          </h2>
          <p className="ja-body mt-4 text-[15px] leading-[2.1] text-[var(--text-secondary)] sm:text-base sm:leading-[2.2]">
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );
}

export default function LegalPageLayout({ content }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--content-bg)]">
      <header className="border-b border-[var(--card-border)] bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-6">
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

      <main className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold-dark)]">
          Legal
        </p>
        <h1 className="ja-heading mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          {content.title}
        </h1>
        <p className="ja-body mt-4 text-base leading-relaxed text-[var(--text-muted)]">
          {content.description}
        </p>

        <div className="mt-12">
          {content.paragraphs ? (
            <article className="premium-card p-8 sm:p-10 lg:p-12">
              <ProseParagraphs paragraphs={content.paragraphs} />
            </article>
          ) : content.singleCard && content.sections ? (
            <article className="premium-card p-8 sm:p-10 lg:p-12">
              <SectionBlocks sections={content.sections} />
            </article>
          ) : (
            <div className="space-y-10">
              {content.sections?.map((section) => (
                <section key={section.heading} className="premium-card p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{section.heading}</h2>
                  <p className="ja-body mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--card-border)] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <LegalFooterLinks />
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--gold-dark)]">
            トップへ戻る
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-4xl text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} TGPLUS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
