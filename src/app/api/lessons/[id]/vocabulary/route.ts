import { getLesson } from "@/lib/data/lessons";
import { toCsv, toQuizletTsv } from "@/lib/lessons/quizlet";
import { requireSession } from "@/lib/session";

/** Vocabulary download (V-6): ?format=tsv (Quizlet) or ?format=csv. */
export async function GET(request: Request, ctx: RouteContext<"/api/lessons/[id]/vocabulary">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const lesson = await getLesson(id, session.user.id);
  if (!lesson) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "tsv";
  const body = format === "csv" ? toCsv(lesson.vocabulary) : toQuizletTsv(lesson.vocabulary);
  const filename = `${lesson.titleNative.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-vokabeln.${format}`;
  return new Response(format === "csv" ? `﻿${body}` : body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
