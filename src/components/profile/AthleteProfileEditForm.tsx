"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateAthleteProfile } from "@/app/actions/profile";
import { AuthAlert } from "@/components/auth/AuthInput";
import { ProfileAvatar } from "@/components/social/SocialLayout";
import type { PublicProfile } from "@/types/profile";

type AthleteProfileEditFormProps = {
  profile: PublicProfile;
};

export default function AthleteProfileEditForm({
  profile,
}: AthleteProfileEditFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [state, formAction, isPending] = useActionState(
    updateAthleteProfile,
    null
  );

  useEffect(() => {
    if (state?.success) {
      router.push(`/profile/${profile.id}`);
      router.refresh();
    }
  }, [state, router, profile.id]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="premium-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">プロフィール編集</h2>
      <p className="ja-body mt-2 text-sm text-[var(--text-muted)]">
        公開プロフィールに表示される情報を編集できます
      </p>

      {state?.error ? (
        <div className="mt-4">
          <AuthAlert type="error" message={state.error} />
        </div>
      ) : null}

      {state?.success ? (
        <div className="mt-4">
          <AuthAlert type="success" message={state.success} />
        </div>
      ) : null}

      <form ref={formRef} action={formAction} className="mt-8 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative"
          >
            <ProfileAvatar
              name={profile.name}
              avatarUrl={preview}
              size="lg"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/80 text-xs font-medium text-[var(--gold-dark)] opacity-0 transition-opacity group-hover:opacity-100">
              変更
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
          {state?.fieldErrors?.avatar ? (
            <p className="text-sm text-red-400">{state.fieldErrors.avatar}</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">タップして写真を変更</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            カバー画像
          </label>
          <input
            type="file"
            name="cover"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full text-sm text-[var(--text-secondary)]"
          />
          {state?.fieldErrors?.cover ? (
            <p className="mt-2 text-sm text-red-400">{state.fieldErrors.cover}</p>
          ) : null}
        </div>

        <ProfileField
          label="名前"
          name="name"
          defaultValue={profile.name}
          error={state?.fieldErrors?.name}
          required
        />
        <ProfileField
          label="競技"
          name="sport"
          defaultValue={profile.sport}
          placeholder="例：陸上競技"
          error={state?.fieldErrors?.sport}
          required
        />
        <ProfileField
          label="所属チーム / 学校"
          name="team"
          defaultValue={profile.team}
          placeholder="例：○○大学 / ○○クラブ"
          error={state?.fieldErrors?.team}
        />
        <ProfileField
          label="地域"
          name="region"
          defaultValue={profile.region}
          placeholder="例：東京都"
          error={state?.fieldErrors?.region}
        />
        <ProfileTextarea
          label="経歴"
          name="career_history"
          defaultValue={(profile as { career_history?: string }).career_history ?? ""}
          placeholder="競技歴・所属歴など"
          error={state?.fieldErrors?.career_history}
        />
        <ProfileTextarea
          label="自己紹介"
          name="bio"
          defaultValue={profile.bio}
          placeholder="あなたのストーリーを書きましょう"
          error={state?.fieldErrors?.bio}
        />
        <ProfileTextarea
          label="実績"
          name="achievements"
          defaultValue={profile.achievements}
          placeholder="主な大会結果や受賞歴"
          error={state?.fieldErrors?.achievements}
        />
        <ProfileTextarea
          label="目標"
          name="goals"
          defaultValue={profile.goals}
          placeholder="今後の目標や挑戦"
          error={state?.fieldErrors?.goals}
        />

        <div className="border-t border-[var(--card-border)] pt-6">
          <p className="mb-4 text-sm font-medium text-[var(--text-primary)]">SNSリンク</p>
          <div className="space-y-4">
            <ProfileField
              label="Instagram"
              name="instagram_url"
              defaultValue={profile.instagram_url}
              placeholder="https://instagram.com/..."
              error={state?.fieldErrors?.instagram_url}
            />
            <ProfileField
              label="TikTok"
              name="tiktok_url"
              defaultValue={profile.tiktok_url}
              placeholder="https://tiktok.com/@..."
              error={state?.fieldErrors?.tiktok_url}
            />
            <ProfileField
              label="X（Twitter）"
              name="x_url"
              defaultValue={profile.x_url}
              placeholder="https://x.com/..."
              error={state?.fieldErrors?.x_url}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-gold w-full rounded-full py-3.5 text-sm disabled:opacity-60"
        >
          {isPending ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}

function ProfileField({
  label,
  name,
  defaultValue,
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ${
          error
            ? "border-red-400 focus:border-red-400"
            : "border-[var(--card-border)] focus:border-[var(--gold)]"
        }`}
      />
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

function ProfileTextarea({
  label,
  name,
  defaultValue,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={name === "career_history" ? 6 : 4}
        maxLength={name === "career_history" ? 2000 : 500}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`ja-body w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ${
          error
            ? "border-red-400 focus:border-red-400"
            : "border-[var(--card-border)] focus:border-[var(--gold)]"
        }`}
      />
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
