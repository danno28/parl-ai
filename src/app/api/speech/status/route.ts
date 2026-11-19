import { isSpeechConfigured } from "@/lib/speech";
import { requireSession } from "@/lib/session";

/** Lets the client know whether real voice and scoring are available, or it should simulate. */
export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  return Response.json({ configured: isSpeechConfigured() });
}
