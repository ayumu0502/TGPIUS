export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("user already registered")) {
    return "このメールアドレスは既に登録されています";
  }

  if (normalized.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません";
  }

  if (normalized.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。確認メールをご確認ください";
  }

  if (normalized.includes("password should be at least")) {
    return "パスワードは8文字以上で入力してください";
  }

  if (normalized.includes("unable to validate email address")) {
    return "有効なメールアドレスを入力してください";
  }

  if (normalized.includes("signup is disabled")) {
    return "現在、新規登録を受け付けていません";
  }

  if (normalized.includes("rate limit")) {
    return "リクエストが多すぎます。しばらくしてから再度お試しください";
  }

  if (
    normalized.includes("auth session missing") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid refresh token") ||
    normalized.includes("otp_expired") ||
    normalized.includes("email link is invalid") ||
    normalized.includes("token has expired")
  ) {
    return "リンクが無効または期限切れです。もう一度パスワード再設定をお試しください";
  }

  if (normalized.includes("same password")) {
    return "現在と異なるパスワードを設定してください";
  }

  if (normalized.includes("network")) {
    return "ネットワークエラーが発生しました。接続を確認してください";
  }

  return "エラーが発生しました。もう一度お試しください";
}
