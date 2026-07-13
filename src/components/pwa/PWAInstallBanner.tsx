"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "tgplus_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneMode()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    setIsIos(isIosDevice());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isIosDevice()) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-banner animate-fade-in-up">
      <div className="pwa-install-banner-inner">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">TGPLUSアプリをインストール</p>
          {isIos ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Safariの共有ボタン → 「ホーム画面に追加」でアプリのように使えます
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              ホーム画面に追加して、より快適にTGPLUSを利用できます
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isIos && deferredPrompt ? (
            <button type="button" onClick={handleInstall} className="btn-gold rounded-full px-4 py-2 text-xs">
              インストール
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-[var(--card-border)] px-3 py-2 text-xs text-[var(--text-muted)] transition hover:border-[var(--gold)] hover:text-[var(--gold-dark)]"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
