"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getSearchSuggestions } from "@/app/actions/search";
import { IconSearch } from "@/components/layout/premium/PremiumIcons";
import type { SearchSuggestion } from "@/types/search";

type SearchBarProps = {
  initialQuery?: string;
};

export default function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      return;
    }

    startTransition(async () => {
      const results = await getSearchSuggestions(trimmed);
      setSuggestions(results);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 280);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const submitSearch = (value: string) => {
    const trimmed = value.trim();
    setOpen(false);
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(query);
        }}
        className="relative"
      >
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder="選手名・競技・地域・チーム・ユーザー名"
          className="w-full rounded-2xl border border-[var(--card-border)] bg-white py-3.5 pl-12 pr-24 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
        />
        <button
          type="submit"
          className="btn-gold absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 text-xs"
        >
          検索
        </button>
      </form>

      {open && (suggestions.length > 0 || isPending) ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--card-border)] bg-white shadow-lg">
          {isPending && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">
              検索中...
            </p>
          ) : (
            <ul>
              {suggestions.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {item.label}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {item.sublabel}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--gold-dark)]">
                      {item.kind === "athlete" ? "選手" : "ユーザー"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
