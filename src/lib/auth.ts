import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { magicLinkEmail, sendEmail } from "@/lib/email";

/**
 * Login by email magic link (U-1), invite-only (U-6).
 * An email may sign in if it already has an account, is listed in INVITED_EMAILS,
 * or has a row in the invites table.
 */
const normalize = (email: string) => email.trim().toLowerCase();

function invitedByEnv(email: string): boolean {
  return (process.env.INVITED_EMAILS ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean)
    .includes(normalize(email));
}

async function isInvited(email: string): Promise<boolean> {
  if (invitedByEnv(email)) return true;
  const rows = await db
    .select({ email: schema.invites.email })
    .from(schema.invites)
    .where(eq(schema.invites.email, normalize(email)))
    .limit(1);
  return rows.length > 0;
}

async function hasAccount(email: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, normalize(email)))
    .limit(1);
  return rows.length > 0;
}

const notInvited = () =>
  new APIError("FORBIDDEN", { message: "NOT_INVITED", code: "NOT_INVITED" });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  advanced: { database: { generateId: "uuid" } },
  databaseHooks: {
    user: {
      create: {
        // Safety net: no account is ever created for an email that was not invited.
        before: async (user) => {
          if (!(await isInvited(user.email))) throw notInvited();
          return { data: user };
        },
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 15 * 60,
      sendMagicLink: async ({ email, url }) => {
        if (!(await hasAccount(email)) && !(await isInvited(email))) throw notInvited();
        await sendEmail(magicLinkEmail(email, url));
      },
    }),
    // Must stay last: lets server actions set the session cookie.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
