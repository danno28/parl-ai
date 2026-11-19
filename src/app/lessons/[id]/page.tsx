import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { CORE_STAGES, getLesson, STAGES, type Stage } from "@/lib/data/lessons";
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

  const completed = lesson.status === "completed";
  const current = STAGES.indexOf(lesson.currentStage);
  const done = (s: Stage) => completed || STAGES.indexOf(s) < current;
  const grammarLabel =
    lesson.grammarStatus === "done"
      ? t("stages.done")
      : lesson.grammarStatus === "skipped"
        ? t("stages.skipped")
        : lesson.currentStage === "grammar" && !completed
          ? t("stages.current")
          : t("stages.optional");

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

      {completed && <p className="font-sans text-sm text-muted-foreground">{t("lesson.completed")}</p>}

      <ol className="border-t">
        {lesson.grammarFocus ? (
          <li className="border-b">
            <Link href={`/lessons/${lesson.id}/grammar`} className="group flex items-baseline justify-between gap-4 py-4">
              <span
                className={cn(
                  "text-2xl transition-transform duration-300 group-hover:translate-x-2.5",
                  lesson.currentStage === "grammar" && !completed && "italic",
                )}
              >
                0 · {t("stages.grammar")}
                <span className="ml-3 font-sans text-sm text-muted-foreground not-italic">{lesson.grammarFocus}</span>
              </span>
              <span className="shrink-0 font-sans text-xs text-muted-foreground">{grammarLabel}</span>
            </Link>
          </li>
        ) : null}
        {CORE_STAGES.map((stage, i) => {
          const isCurrent = !completed && stage === lesson.currentStage;
          return (
            <li key={stage} className="border-b">
              <Link href={`/lessons/${lesson.id}/${stage}`} className="group flex items-baseline justify-between py-4">
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
        href={`/lessons/${lesson.id}/${completed ? "speaking" : lesson.currentStage}`}
        className="justify-self-start rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {completed
          ? t("lesson.review")
          : current <= 1 && lesson.currentTurn === 0 && lesson.grammarStatus === "not_started"
            ? t("lesson.start")
            : t("lesson.continue")}
      </Link>
    </div>
  );
}
