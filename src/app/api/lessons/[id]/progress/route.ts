import { z } from "zod";
import { STAGES, getLesson, saveProgress } from "@/lib/data/lessons";
import { requireSession } from "@/lib/session";

const Body = z.object({
  stage: z.enum(STAGES),
  turn: z.number().int().min(0),
  completedStage: z.enum(STAGES).optional(),
});

/** Saves where the learner is in a lesson (P-1, P-2). */
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/progress">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  if (!(await getLesson(id, session.user.id))) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  await saveProgress(id, session.user.id, parsed.data);
  return Response.json({ ok: true });
}
