import "server-only";
import { headers } from "next/headers";
import { auth, type Session } from "@/lib/auth";

/** Returns the signed-in user's session, or null. Use in route handlers and server actions. */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Like getSession, but returns a 401 response to send back when nobody is signed in. */
export async function requireSession(): Promise<
  { session: Session; unauthorized: null } | { session: null; unauthorized: Response }
> {
  const session = await getSession();
  if (session) return { session, unauthorized: null };
  return {
    session: null,
    unauthorized: Response.json({ error: "UNAUTHORIZED" }, { status: 401 }),
  };
}
