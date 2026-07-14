import Link from "next/link";
import { getAthleteInviteByToken } from "@/app/actions/athlete-invite";
import InviteRegisterForm from "@/components/auth/InviteRegisterForm";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function RegisterInvitePage({ searchParams }: PageProps) {
  const { token = "" } = await searchParams;
  const invite = token ? await getAthleteInviteByToken(token) : null;

  if (!invite || !invite.is_valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--content-bg)] px-6">
        <div className="premium-card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold">招待リンクが無効です</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            期限切れ、取消、または既に登録済みの可能性があります。管理者にお問い合わせください。
          </p>
          <Link href="/" className="btn-gold mt-6 inline-block rounded-full px-6 py-3 text-sm">
            トップへ
          </Link>
        </div>
      </div>
    );
  }

  return <InviteRegisterForm invite={invite} token={token} />;
}
