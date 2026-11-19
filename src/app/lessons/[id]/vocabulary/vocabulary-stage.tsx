"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/audio/speak";
import type { LessonVocab } from "@/lib/data/lessons";
import { t } from "@/i18n";

/** Splits "la baguette" into a quiet article and the word, as in the design reference. */
function splitArticle(term: string): [string, string] {
  const m = term.match(/^(le |la |les |l'|un |une |des )(.*)$/i);
  return m ? [m[1], m[2]] : ["", term];
}

export function VocabularyStage({
  lessonId,
  title,
  items,
  quizletTsv,
  speechConfigured,
  alreadyPastStage,
}: {
  lessonId: string;
  title: string;
  items: LessonVocab[];
  quizletTsv: string;
  speechConfigured: boolean;
  alreadyPastStage: boolean;
}) {
  const router = useRouter();
  const [copyLabel, setCopyLabel] = useState(t("lesson.copyQuizlet"));
  const [saying, setSaying] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(quizletTsv);
      setCopyLabel(t("lesson.copied"));
    } catch {
      setCopyLabel(t("lesson.copyFailed"));
    }
    setTimeout(() => setCopyLabel(t("lesson.copyQuizlet")), 1800);
  }

  async function next() {
    if (!alreadyPastStage) {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "reading", turn: 0, completedStage: "vocabulary" }),
      });
    }
    router.push(`/lessons/${lessonId}/reading`);
  }

  return (
    <div className="grid gap-10">
      <div className="flex justify-between">
        <Link href={`/lessons/${lessonId}`} className="font-sans text-sm text-muted-foreground hover:text-foreground">
          ← {title}
        </Link>
        <span className="label-caps">
          {t("stages.vocabulary")} · {t("lesson.vocabCount").replace("{count}", String(items.length))}
        </span>
      </div>
      <p className="font-sans text-sm text-muted-foreground">
        {t("lesson.vocabHint")} {items.some((i) => !i.inDialogue) && t("lesson.extrasHint")}
      </p>

      <div className="grid gap-x-[clamp(24px,6vw,80px)] sm:grid-cols-2">
        {items.map((item) => {
          const [article, word] = splitArticle(item.termTarget);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                void speak(
                  item.termTarget,
                  { useServer: speechConfigured, rate: 0.9 },
                  { onStart: () => setSaying(item.id), onEnd: () => setSaying(null) },
                )
              }
              className="group grid gap-0.5 border-b py-4 text-left"
            >
              <span className="flex items-baseline gap-2.5 text-[clamp(1.5rem,3vw,2rem)] leading-tight">
                <span className={saying === item.id ? "italic" : undefined}>
                  {article && <span className="text-faint">{article}</span>}
                  {word}
                  {item.gender !== "none" && /^(l'|les )/i.test(item.termTarget) && (
                    <span className="ml-1 font-sans text-[11px] text-faint">{item.gender}</span>
                  )}
                </span>
                <Volume2 className="ml-auto size-5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </span>
              <span className="font-sans text-sm text-muted-foreground">
                {item.termNative}
                {!item.inDialogue && (
                  <span className="ml-2 rounded-full border px-1.5 py-px text-[10px] tracking-wide text-faint uppercase">
                    {t("lesson.extraWord")}
                  </span>
                )}
              </span>
              {item.note && <span className="font-sans text-xs text-faint">{item.note}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 font-sans text-sm font-medium">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <button type="button" onClick={() => void copy()} className="border-b pb-0.5 hover:border-foreground">
            {copyLabel}
          </button>
          <a href={`/api/lessons/${lessonId}/vocabulary?format=tsv`} className="border-b pb-0.5 text-muted-foreground hover:border-foreground">
            TSV
          </a>
          <a href={`/api/lessons/${lessonId}/vocabulary?format=csv`} className="border-b pb-0.5 text-muted-foreground hover:border-foreground">
            CSV
          </a>
        </div>
        <button
          type="button"
          onClick={() => void next()}
          className="rounded-full bg-foreground px-6 py-3 text-background transition-opacity hover:opacity-90"
        >
          {t("lesson.learnedNext")}
        </button>
      </div>
    </div>
  );
}
