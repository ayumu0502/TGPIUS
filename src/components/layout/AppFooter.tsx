import LegalFooterLinks from "@/components/legal/LegalFooterLinks";

export default function AppFooter() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-white px-4 py-8 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LegalFooterLinks linkClassName="text-xs text-[var(--text-muted)] transition hover:text-[var(--gold-dark)]" />
        <p className="text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} TGPLUS
        </p>
      </div>
    </footer>
  );
}
