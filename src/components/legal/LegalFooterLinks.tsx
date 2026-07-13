import Link from "next/link";
import { LEGAL_FOOTER_LINKS } from "@/lib/legal/content";

type LegalFooterLinksProps = {
  className?: string;
  linkClassName?: string;
};

export default function LegalFooterLinks({
  className = "",
  linkClassName = "text-sm text-[var(--text-muted)] transition hover:text-[var(--gold-dark)]",
}: LegalFooterLinksProps) {
  return (
    <nav className={`flex flex-wrap gap-x-6 gap-y-2 ${className}`}>
      {LEGAL_FOOTER_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={linkClassName}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
