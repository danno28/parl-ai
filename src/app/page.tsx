import { Suspense } from "react";
import Link from "next/link";
import { isLLMConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/data/user";
import { listLessons, type LessonSummary } from "@/lib/data/lessons";
import { NewLesson } from "./new-lesson";
import { t } from "@/i18n";

/** Home: your lessons and the scenario picker (§4, P-3). */
export default function Home() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <HomeContent />
        </Suspense>
      </div>
    </section>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  const lessons = await listLessons(user.id);
  const inProgress = lessons.filter((l) => l.status === "in_progress");
  const done = lessons.filter((l) => l.status === "completed");

  return (
    <>
      {inProgress.length > 0 && <LessonList label={t("home.continueLabel")} lessons={inProgress} />}
      <NewLesson
        level={user.level}
        minutes={user.defaultLessonMinutes}
        llmConfigured={isLLMConfigured()}
        devSample={process.env.NODE_ENV === "development"}
      />
      {done.length > 0 && <LessonList label={t("home.doneLabel")} lessons={done} className="mt-24" />}
    </>
  );
}

function LessonList({
  label,
  lessons,
  className,
}: {
  label: string;
  lessons: LessonSummary[];
  className?: string;
}) {
  return (
    <div className={className ?? "mb-20"}>
      <span className="label-caps">{label}</span>
      <ul className="mt-4 border-t">
        {lessons.map((l) => (
          <li key={l.id} className="border-b">
            <Link
              href={`/lessons/${l.id}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-4"
            >
              <span className="text-[clamp(1.4rem,3vw,2rem)] leading-tight transition-transform duration-300 group-hover:translate-x-2.5">
                {l.titleTarget}
              </span>
              <span className="font-sans text-xs text-muted-foreground">
                {l.status === "completed" ? t("stages.done") : t(`stages.${l.currentStage}`)}
              </span>
              <span className="font-sans text-sm text-muted-foreground">
                {l.titleNative} · {l.level} · {l.minutes} {t("home.minutes")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
