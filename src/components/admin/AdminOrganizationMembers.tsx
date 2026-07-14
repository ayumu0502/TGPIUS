"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateMembershipStatus } from "@/app/actions/admin-athletes";
import { AuthAlert } from "@/components/auth/AuthInput";
import {
  MEMBERSHIP_STATUS_LABELS,
  type AdminAthleteFormState,
  type MembershipStatus,
} from "@/types/athlete-invite";

export type OrganizationMemberRow = {
  membershipId: string;
  membershipStatus: MembershipStatus;
  joinedAt: string;
  athleteName: string;
  email: string;
  sport: string;
  linkedUserId: string | null;
  provisionalProfileId: string | null;
};

type AdminOrganizationMembersProps = {
  organizationId: string;
  organizationName: string;
  members: OrganizationMemberRow[];
};

export default function AdminOrganizationMembers({
  organizationId,
  organizationName,
  members,
}: AdminOrganizationMembersProps) {
  const [state, formAction, isPending] = useActionState<
    AdminAthleteFormState | null,
    FormData
  >(updateMembershipStatus, null);

  return (
    <div className="mt-4 border-t border-[var(--card-border)] pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)]">
        所属選手（{organizationName}）
      </p>
      {state?.error ? <AuthAlert type="error" message={state.error} /> : null}
      {state?.success ? <AuthAlert type="success" message={state.success} /> : null}

      {members.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">所属選手はいません</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li
              key={member.membershipId}
              className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)]">{member.athleteName}</p>
                <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{member.sport}</p>
                <p className="mt-1 text-xs">
                  状態: {MEMBERSHIP_STATUS_LABELS[member.membershipStatus]}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {member.linkedUserId ? (
                  <Link
                    href={`/admin/athletes/${member.linkedUserId}/edit`}
                    className="text-xs text-[var(--gold-dark)] hover:underline"
                  >
                    代理編集
                  </Link>
                ) : null}
                <form action={formAction} className="flex items-center gap-2">
                  <input type="hidden" name="membership_id" value={member.membershipId} />
                  <input type="hidden" name="organization_id" value={organizationId} />
                  <select
                    name="status"
                    defaultValue={member.membershipStatus}
                    className="rounded-lg border border-[var(--card-border)] px-2 py-1.5 text-xs"
                  >
                    {(Object.keys(MEMBERSHIP_STATUS_LABELS) as MembershipStatus[]).map(
                      (status) => (
                        <option key={status} value={status}>
                          {MEMBERSHIP_STATUS_LABELS[status]}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-full border border-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[var(--gold-dark)]"
                  >
                    更新
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
