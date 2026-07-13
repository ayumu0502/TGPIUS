import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "processed-stripe-sessions.json");

type SessionStore = Record<string, { userId: string; pointAmount: number; at: string }>;

async function readStore(): Promise<SessionStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as SessionStore;
  } catch {
    return {};
  }
}

async function writeStore(store: SessionStore): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getProcessedStripeSession(
  sessionId: string
): Promise<{ userId: string; pointAmount: number } | null> {
  const store = await readStore();
  const entry = store[sessionId];
  if (!entry) return null;
  return { userId: entry.userId, pointAmount: entry.pointAmount };
}

export async function markStripeSessionProcessed(
  sessionId: string,
  userId: string,
  pointAmount: number
): Promise<void> {
  const store = await readStore();
  store[sessionId] = {
    userId,
    pointAmount,
    at: new Date().toISOString(),
  };
  await writeStore(store);
}
