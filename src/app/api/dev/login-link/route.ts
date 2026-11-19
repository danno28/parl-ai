import { isDevLoginLinkEnabled, takeLoginLink } from "@/lib/dev-login";

/** Development only: hands the just-generated magic link to the login page (see src/lib/dev-login.ts). */
export async function GET(request: Request) {
  if (!isDevLoginLinkEnabled()) return new Response(null, { status: 404 });
  const email = new URL(request.url).searchParams.get("email");
  const url = email ? takeLoginLink(email) : null;
  if (!url) return new Response(null, { status: 404 });
  return Response.json({ url });
}
