"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 overflow-x-auto">
      <ul className="flex min-w-max gap-2 pb-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[rgba(197,160,89,0.15)] text-[var(--gold-dark)]"
                    : "border border-[var(--card-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--gold)]"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
