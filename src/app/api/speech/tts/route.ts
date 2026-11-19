import { z } from "zod";
import { synthesizeCached } from "@/lib/tts";
import { ProviderNotConfiguredError } from "@/lib/providers";
import { requireSession } from "@/lib/session";

const Body = z.object({
  text: z.string().min(1).max(500),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).default("fr-FR"),
  rate: z.number().min(0.5).max(1.5).default(1),
});

/** Text-to-speech for a dialogue line or vocabulary item (R-2). Returns MP3. */
export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });

  try {
    const audio = await synthesizeCached(parsed.data);
    return new Response(audio.data, {
      headers: { "Content-Type": audio.mimeType, "Cache-Control": "private, max-age=86400" },
    });
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      return Response.json({ error: "SPEECH_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "TTS_FAILED" }, { status: 502 });
  }
}
