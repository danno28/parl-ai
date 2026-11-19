"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraphiteSpeaker } from "@/components/conversation/graphite-speaker";
import { speak } from "@/lib/audio/speak";
import type { GrammarExerciseFeedback, GrammarLesson } from "@/lib/schemas/lesson";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type Check = { feedback: GrammarExerciseFeedback; answer: string };

/**
 * Stage 0 (G-1 to G-5): rule, explanation, forms, typical mistakes, examples, then exercises
 * one at a time with feedback. Skippable at any point.
 */
export function GrammarStage({
  lessonId,
  title,
  focus,
  initialContent,
  speechConfigured,
}: {
  lessonId: string;
  title: string;
  focus: string;
  initialContent: GrammarLesson | null;
  speechConfigured: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [check, setCheck] = useState<Check | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const requested = useRef(false);

  async function load() {
    setLoadError(false);
    const response = await fetch(`/api/lessons/${lessonId}/grammar`, { method: "POST" }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { grammar?: GrammarLesson } | null;
    if (response?.ok && body?.grammar) setContent(body.grammar);
    else setLoadError(true);
  }

  useEffect(() => {
    if (!initialContent && !requested.current) {
      requested.current = true;
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finish(status: "done" | "skipped") {
    await fetch(`/api/lessons/${lessonId}/grammar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => undefined);
    router.push(`/lessons/${lessonId}/vocabulary`);
    router.refresh();
  }

  async function submit() {
    if (!answer.trim()) return;
    setChecking(true);
    setCheckError(false);
    const response = await fetch(`/api/lessons/${lessonId}/grammar/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, answer: answer.trim() }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as Check | null;
    setChecking(false);
    if (!response?.ok || !body) return setCheckError(true);
    setCheck(body);
  }

  const header = (
    <div className="flex justify-between gap-4">
      <Link href={`/lessons/${lessonId}`} className="font-sans text-sm text-muted-foreground hover:text-foreground">
        ← {title}
      </Link>
      <div className="flex items-baseline gap-5">
        <span className="label-caps hidden sm:inline">{t("grammar.label")}</span>
        <button
          type="button"
          onClick={() => void finish("skipped")}
          className="border-b pb-0.5 font-sans text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          {t("grammar.skip")}
        </button>
      </div>
    </div>
  );

  if (!content) {
    return (
      <div className="grid gap-10">
        {header}
        <div className="grid min-h-[50vh] content-center justify-items-center text-center" aria-live="polite">
          {loadError ? (
            <>
              <p className="max-w-md font-sans text-sm text-live">{t("grammar.failed")}</p>
              <button type="button" onClick={() => void load()} className="mt-4 border-b pb-0.5 font-sans text-sm font-medium hover:border-foreground">
                {t("grammar.retry")}
              </button>
            </>
          ) : (
            <>
              <GraphiteSpeaker mode="speak" label={t("grammar.loading")} />
              <p className="mt-4 text-[clamp(1.6rem,3.6vw,2.4rem)] italic">{t("grammar.loading")}</p>
              <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">{t("grammar.loadingHint")}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const exercise = content.exercises[index];
  const finished = index >= content.exercises.length;
  const say = (text: string) => void speak(text, { useServer: speechConfigured, rate: 0.9 });

  return (
    <div className="grid gap-12">
      {header}

      <div>
        <p className="font-sans text-sm text-muted-foreground">{content.title || focus}</p>
        <h1 className="mt-3 text-[clamp(2.25rem,6.4vw,5rem)] leading-[1.05]">
          <button type="button" onClick={() => say(content.ruleExample)} className="text-left">
            {content.ruleExample}
          </button>
        </h1>
        <p className="mt-5 max-w-[46ch] text-lg text-muted-foreground">{content.explanationNative}</p>
      </div>

      {content.forms.length > 0 && (
        <div className="grid gap-x-6 gap-y-5 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.forms.map((f) => (
            <div key={f.form} className="grid content-start gap-1">
              <b className="text-3xl font-medium italic">{f.form}</b>
              <span className="label-caps">{f.whenNative}</span>
              <span className="text-lg">{f.example}</span>
            </div>
          ))}
        </div>
      )}

      {content.pitfallsNative.length > 0 && (
        <div className="grid gap-2">
          <span className="label-caps">{t("grammar.pitfalls")}</span>
          <ul className="grid gap-1.5 text-lg">
            {content.pitfallsNative.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {content.examples.length > 0 && (
        <div className="grid gap-2">
          <span className="label-caps">{t("grammar.examples")}</span>
          <ul className="grid gap-3">
            {content.examples.map((e) => (
              <li key={e.target}>
                <button type="button" onClick={() => say(e.target)} className="grid text-left">
                  <span className="text-xl">{e.target}</span>
                  <span className="font-sans text-sm text-muted-foreground">{e.native}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 border-t pt-8">
        {finished ? (
          <>
            <p className="text-3xl italic">{t("grammar.allDone")}</p>
            <button
              type="button"
              onClick={() => void finish("done")}
              className="justify-self-start rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t("grammar.toVocabulary")}
            </button>
          </>
        ) : (
          <>
            <span className="label-caps">
              {t("grammar.exerciseOf").replace("{n}", String(index + 1)).replace("{total}", String(content.exercises.length))}
            </span>
            <p className="font-sans text-sm text-muted-foreground">{exercise.instructionNative}</p>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!check) void submit();
              }}
            >
              <p className="text-[clamp(1.5rem,3.4vw,2.1rem)] leading-snug">{exercise.promptTarget}</p>
              <input
                id={`exercise-${index}`}
                type="text"
                lang="fr"
                autoComplete="off"
                value={answer}
                disabled={!!check}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t("grammar.answerPlaceholder")}
                className={cn(
                  "w-full max-w-xl rounded-none border-0 border-b bg-transparent py-2 text-2xl italic placeholder:text-faint focus:border-b-2 focus:outline-none",
                  check ? (check.feedback.correct ? "border-foreground" : "border-live text-live") : "border-foreground",
                )}
              />
              {!check && (
                <button
                  type="submit"
                  disabled={!answer.trim() || checking}
                  className="justify-self-start rounded-full bg-foreground px-5 py-2.5 font-sans text-sm font-medium text-background disabled:opacity-50"
                >
                  {checking ? "…" : t("grammar.check")}
                </button>
              )}
            </form>
            {checkError && <p className="font-sans text-sm text-live">{t("lesson.failed")}</p>}
            {check && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-1" aria-live="polite">
                <p className="font-sans text-sm">
                  <b className="font-semibold">{check.feedback.correct ? t("grammar.correct") : t("grammar.wrong")}</b>{" "}
                  <span className="text-muted-foreground">{check.feedback.feedbackNative}</span>
                </p>
                {!check.feedback.correct && (
                  <p className="font-sans text-sm text-muted-foreground">
                    {t("grammar.solution")}: <em className="font-serif text-base text-foreground">{check.answer}</em>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIndex((i) => i + 1);
                    setAnswer("");
                    setCheck(null);
                  }}
                  className="mt-2 justify-self-start rounded-full bg-foreground px-5 py-2.5 font-sans text-sm font-medium text-background"
                >
                  {index + 1 < content.exercises.length ? t("grammar.nextExercise") : t("lesson.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
