import "server-only";

/**
 * Local-development convenience: while no email service is set up (EMAIL_PROVIDER=console)
 * and the app runs with `npm run dev`, the login page can show the magic link directly
 * instead of making you copy it from the server log.
 * Never active in a production build or when real emails are sent.
 */
export function isDevLoginLinkEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" && (process.env.EMAIL_PROVIDER ?? "console") === "console"
  );
}

type Outbox = Map<string, { url: string; at: number }>;
const store = globalThis as unknown as { devLoginOutbox?: Outbox };
const outbox = (store.devLoginOutbox ??= new Map());

const LIFETIME_MS = 15 * 60 * 1000;

export function rememberLoginLink(email: string, url: string): void {
  if (!isDevLoginLinkEnabled()) return;
  outbox.set(email.trim().toLowerCase(), { url, at: Date.now() });
}

/** Returns the most recent unexpired link for this email, once. */
export function takeLoginLink(email: string): string | null {
  const key = email.trim().toLowerCase();
  const entry = outbox.get(key);
  outbox.delete(key);
  if (!entry || Date.now() - entry.at > LIFETIME_MS) return null;
  return entry.url;
}
