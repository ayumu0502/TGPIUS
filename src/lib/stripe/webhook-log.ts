import { formatStripeError } from "@/lib/stripe/checkout-errors";

const SENSITIVE_KEYS = new Set([
  "secret",
  "signature",
  "authorization",
  "email",
  "customer",
  "token",
  "password",
]);

function redactContext(
  data?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!data) return undefined;

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lower = key.toLowerCase();
    if (
      SENSITIVE_KEYS.has(lower) ||
      lower.includes("secret") ||
      lower.includes("key")
    ) {
      safe[key] = "[redacted]";
    } else if (typeof value === "string" && value.length > 64) {
      safe[key] = `${value.slice(0, 8)}...`;
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export function logWebhook(
  message: string,
  context?: Record<string, unknown>
): void {
  const safe = redactContext(context);
  if (safe) {
    console.info(`[TGPLUS:webhook] ${message}`, safe);
    return;
  }
  console.info(`[TGPLUS:webhook] ${message}`);
}

export function logWebhookError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  logWebhook(message, {
    ...formatStripeError(error),
    ...context,
  });
}
