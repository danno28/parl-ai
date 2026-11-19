import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getLesson, STAGES, type Stage } from "@/lib/data/lessons";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/** Lesson overview: the stages and where you left off (§3, P-2). */
export default function LessonPage(props: PageProps<"/lessons/[id]">) {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Overview params={props.params} />
        </Suspense>
      </div>
    </section>
  );
}

async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const lesson = await getLesson(id, user.id);
  if (!lesson) notFound();

  const current = STAGES.indexOf(lesson.currentStage);
  const done = (s: Stage) => lesson.status === "completed" || STAGES.indexOf(s) < current;

  return (
    <div className="grid gap-12">
      <div className="flex justify-between">
        <Link href="/" className="font-sans text-sm text-muted-foreground hover:text-foreground">
          {t("lesson.back")}
        </Link>
        <span className="label-caps">
          {lesson.level} · {lesson.minutes} {t("home.minutes")}
        </span>
      </div>

      <div>
        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.02] italic">{lesson.titleTarget}</h1>
        <p className="mt-3 font-sans text-sm text-muted-foreground">
          {lesson.titleNative} · {t("lesson.with")} {lesson.partnerName}, {lesson.partnerRole}
        </p>
      </div>

      {lesson.status === "completed" && (
        <p className="font-sans text-sm text-muted-foreground">{t("lesson.completed")}</p>
      )}

      <ol className="border-t">
        <li className="flex items-baseline justify-between border-b py-4 text-faint">
          <span className="text-2xl">
            0 · {t("stages.grammar")}
            {lesson.grammarFocus && <span className="ml-3 font-sans text-sm">{lesson.grammarFocus}</span>}
          </span>
          <span className="font-sans text-xs">{t("stages.soon")}</span>
        </li>
        {STAGES.map((stage, i) => {
          const isCurrent = lesson.status !== "completed" && stage === lesson.currentStage;
          return (
            <li key={stage} className="border-b">
              <Link
                href={`/lessons/${lesson.id}/${stage}`}
                className="group flex items-baseline justify-between py-4"
              >
                <span
                  className={cn(
                    "text-2xl transition-transform duration-300 group-hover:translate-x-2.5",
                    isCurrent && "italic",
                  )}
                >
                  {i + 1} · {t(`stages.${stage}`)}
                </span>
                <span className="font-sans text-xs text-muted-foreground">
                  {done(stage) ? t("stages.done") : isCurrent ? t("stages.current") : ""}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex items-baseline justify-between border-b py-4 text-faint">
          <span className="text-2xl">4 · {t("stages.conversation")}</span>
          <span className="font-sans text-xs">{t("stages.soon")}</span>
        </li>
      </ol>

      <Link
        href={`/lessons/${lesson.id}/${lesson.status === "completed" ? "speaking" : lesson.currentStage}`}
        className="justify-self-start rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {lesson.status === "completed"
          ? t("lesson.review")
          : current === 0 && lesson.currentTurn === 0
            ? t("lesson.start")
            : t("lesson.continue")}
      </Link>
    </div>
  );
}
