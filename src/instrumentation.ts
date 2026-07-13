export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvCheck } = await import("@/lib/env/check");
    logEnvCheck();
  }
}
