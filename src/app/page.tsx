import { Suspense } from "react";
import { isLLMConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/data/user";
import { listLessons, proposeGrammarFocus } from "@/lib/data/lessons";
import { DEFAULT_LANGUAGE_PAIR, TARGET_LANGUAGES } from "@/config/languages";
import { NewLesson } from "./new-lesson";
import { LessonList } from "./lesson-list";
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
  const languages = DEFAULT_LANGUAGE_PAIR;
  const [lessons, grammarFocus] = await Promise.all([
    listLessons(user.id),
    proposeGrammarFocus(user.id, languages, user.level),
  ]);
  const summary = (l: (typeof lessons)[number]) => ({
    id: l.id,
    titleTarget: l.titleTarget,
    titleNative: l.titleNative,
    level: l.level,
    minutes: l.minutes,
    status: l.status,
    currentStage: l.currentStage,
  });
  const inProgress = lessons.filter((l) => l.status === "in_progress").map(summary);
  const done = lessons.filter((l) => l.status === "completed").map(summary);

  return (
    <>
      {inProgress.length > 0 && <LessonList label={t("home.continueLabel")} lessons={inProgress} removable />}
      <NewLesson
        level={user.level}
        minutes={user.defaultLessonMinutes}
        grammarPreference={user.grammarPreference}
        grammarFocus={grammarFocus}
        grammarTopics={TARGET_LANGUAGES[languages.target].grammarReference}
        initialSuggestions={user.suggestions}
        llmConfigured={isLLMConfigured()}
        devSample={process.env.NODE_ENV === "development"}
      />
      {done.length > 0 && <LessonList label={t("home.doneLabel")} lessons={done} className="mt-24" />}
    </>
  );
}
