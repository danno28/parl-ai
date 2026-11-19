import { deleteLesson } from "@/lib/data/lessons";
import { requireSession } from "@/lib/session";

/** Removes one of the learner's lessons with all its progress (P-7). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const deleted = await deleteLesson(id, session.user.id);
  if (!deleted) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return Response.json({ ok: true });
}
