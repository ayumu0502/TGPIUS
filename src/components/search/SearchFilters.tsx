"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  FOLLOWER_FILTER_OPTIONS,
  GENDER_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/search/constants";
import type { SearchFilterOptions } from "@/types/search";

type SearchFiltersProps = {
  filterOptions: SearchFilterOptions;
};

export default function SearchFilters({ filterOptions }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="premium-card p-4 sm:p-5">
      <p className="text-sm font-bold text-[var(--text-primary)]">フィルター</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">競技</span>
          <select
            value={searchParams.get("sport") ?? ""}
            onChange={(e) => updateParam("sport", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
          >
            <option value="">すべて</option>
            {filterOptions.sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">都道府県</span>
          <select
            value={searchParams.get("region") ?? ""}
            onChange={(e) => updateParam("region", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
          >
            <option value="">すべて</option>
            {filterOptions.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">性別</span>
          <select
            value={searchParams.get("gender") ?? ""}
            onChange={(e) => updateParam("gender", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">フォロワー数</span>
          <select
            value={searchParams.get("minFollowers") ?? ""}
            onChange={(e) => updateParam("minFollowers", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
          >
            {FOLLOWER_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">並び替え</span>
          <select
            value={searchParams.get("sort") ?? "relevance"}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-3 py-2.5 text-sm focus:border-[var(--gold)] focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
