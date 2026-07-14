"use client";

import { useActionState } from "react";
import { upsertOrganization } from "@/app/actions/admin-athletes";
import { AuthAlert } from "@/components/auth/AuthInput";
import AdminOrganizationMembers, {
  type OrganizationMemberRow,
} from "@/components/admin/AdminOrganizationMembers";
import {
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_TYPE_LABELS,
  type AdminAthleteFormState,
  type Organization,
  type OrganizationStatus,
  type OrganizationType,
} from "@/types/athlete-invite";

type AdminOrganizationsPanelProps = {
  organizations: Organization[];
  membersByOrg: Record<string, OrganizationMemberRow[]>;
};

export default function AdminOrganizationsPanel({
  organizations,
  membersByOrg,
}: AdminOrganizationsPanelProps) {
  const [state, formAction, isPending] = useActionState<
    AdminAthleteFormState | null,
    FormData
  >(upsertOrganization, null);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={formAction} className="premium-card space-y-4 p-6">
        <h2 className="text-lg font-bold">組織を登録</h2>
        {state?.error ? <AuthAlert type="error" message={state.error} /> : null}
        {state?.success ? <AuthAlert type="success" message={state.success} /> : null}
        <input name="name" placeholder="組織名" required className="w-full rounded-xl border px-4 py-3 text-sm" />
        <select name="org_type" className="w-full rounded-xl border px-4 py-3 text-sm" defaultValue="team">
          {(Object.keys(ORGANIZATION_TYPE_LABELS) as OrganizationType[]).map((key) => (
            <option key={key} value={key}>
              {ORGANIZATION_TYPE_LABELS[key]}
            </option>
          ))}
        </select>
        <input name="region" placeholder="地域" className="w-full rounded-xl border px-4 py-3 text-sm" />
        <textarea name="description" placeholder="説明" rows={3} className="w-full rounded-xl border px-4 py-3 text-sm" />
        <textarea name="admin_note" placeholder="管理メモ" rows={2} className="w-full rounded-xl border px-4 py-3 text-sm" />
        <button type="submit" disabled={isPending} className="btn-gold rounded-full px-6 py-2.5 text-sm">
          登録
        </button>
      </form>

      <div className="space-y-3">
        {organizations.map((org) => (
          <article key={org.id} className="premium-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{org.name}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {ORGANIZATION_TYPE_LABELS[org.org_type]}
                  {org.region ? ` / ${org.region}` : ""}
                </p>
                <p className="mt-2 text-xs">
                  {ORGANIZATION_STATUS_LABELS[org.status as OrganizationStatus]}
                </p>
              </div>
            </div>
            <AdminOrganizationMembers
              organizationId={org.id}
              organizationName={org.name}
              members={membersByOrg[org.id] ?? []}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
