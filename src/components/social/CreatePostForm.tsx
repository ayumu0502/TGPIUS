"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPost } from "@/app/actions/posts";
import { AuthAlert } from "@/components/auth/AuthInput";

export default function CreatePostForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"image" | "video" | null>(null);
  const [state, formAction, isPending] = useActionState(createPost, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setPreview(null);
      setMediaKind(null);
      router.push("/feed");
      router.refresh();
    }
  }, [state, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      setMediaKind(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    if (file.type.startsWith("video/")) {
      setMediaKind("video");
    } else {
      setMediaKind("image");
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-[var(--text-primary)]">新規投稿</h1>

      {state?.error ? (
        <div className="mb-4">
          <AuthAlert type="error" message={state.error} />
        </div>
      ) : null}

      <form ref={formRef} action={formAction} className="space-y-5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--surface)] transition-colors hover:border-[var(--gold)]"
        >
          {preview && mediaKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="プレビュー"
              className="h-full w-full object-cover"
            />
          ) : preview && mediaKind === "video" ? (
            <video
              src={preview}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                タップして画像・動画を選択
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                JPEG, PNG, WebP, MP4 など
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          name="media"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFileChange}
          required
        />

        <div>
          <label
            htmlFor="caption"
            className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
          >
            キャプション
          </label>
          <textarea
            id="caption"
            name="caption"
            rows={4}
            maxLength={1000}
            placeholder="キャプションを入力..."
            className="ja-body w-full resize-none rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-gold w-full rounded-full py-3.5 text-sm disabled:opacity-60"
        >
          {isPending ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
