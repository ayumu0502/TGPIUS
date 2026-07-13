export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white text-sm font-black text-black">
              T+
            </span>
            <span className="text-lg font-bold">TGPLUS</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} TGPLUS. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { label: "プライバシーポリシー", href: "#" },
              { label: "利用規約", href: "#" },
              { label: "お問い合わせ", href: "#" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-500 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
