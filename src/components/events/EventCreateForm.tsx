"use client";

import { useActionState } from "react";
import { createEventAction } from "@/app/actions/events";
import type { EventActionState } from "@/types/events";

const initialState: EventActionState = { ok: false, message: "" };

export default function EventCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createEventAction,
    initialState
  );

  return (
    <form action={formAction} className="premium-card space-y-5 p-5 sm:p-6">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          イベント名 <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          required
          maxLength={120}
          className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          placeholder="例: ファンミーティング"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          詳細
        </label>
        <textarea
          name="description"
          rows={5}
          maxLength={2000}
          className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          placeholder="イベントの内容、持ち物、注意事項など"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            開始日時 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="starts_at"
            required
            className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            終了日時
          </label>
          <input
            type="datetime-local"
            name="ends_at"
            className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          開催形式
        </label>
        <select
          name="location_type"
          defaultValue="offline"
          className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
        >
          <option value="offline">対面</option>
          <option value="online">オンライン</option>
          <option value="hybrid">ハイブリッド</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            会場名
          </label>
          <input
            name="venue_name"
            className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
            placeholder="例: 東京体育館"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            住所
          </label>
          <input
            name="venue_address"
            className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
            placeholder="例: 東京都渋谷区..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          オンラインURL
        </label>
        <input
          name="online_url"
          type="url"
          className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            定員 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="capacity"
            min={1}
            max={10000}
            defaultValue={50}
            required
            className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            参加費（pt）
          </label>
          <input
            type="number"
            name="fee_points"
            min={0}
            step={100}
            defaultValue={0}
            className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--gold)] focus:outline-none"
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" name="is_free" defaultChecked className="rounded" />
            無料イベントにする
          </label>
        </div>
      </div>

      {state.message && !state.ok ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-gold w-full rounded-full py-3 text-sm font-medium disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isPending ? "作成中..." : "イベントを公開する"}
      </button>
    </form>
  );
}
