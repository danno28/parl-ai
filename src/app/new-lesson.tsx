"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraphiteSpeaker } from "@/components/conversation/graphite-speaker";
import { CEFR_LEVELS, type CefrLevel } from "@/config/cefr";
import { LESSON_LENGTHS, type LessonMinutes } from "@/config/lesson-length";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/** Preset suggestions until AI suggestions arrive (S-1 comes in a later step). */
const SUGGESTIONS = [
  { fr: "À la boulangerie", de: "In der Bäckerei" },
  { fr: "Chez le dentiste", de: "Beim Zahnarzt" },
  { fr: "Au guichet de la gare", de: "Am Bahnhofsschalter" },
  { fr: "La visite d'un appartement", de: "Wohnungsbesichtigung" },
];

type Status = { kind: "idle" } | { kind: "generating" } | { kind: "error"; message: string };

export function NewLesson({
  level: initialLevel,
  minutes: initialMinutes,
  llmConfigured,
  devSample,
}: {
  level: CefrLevel;
  minutes: LessonMinutes;
  llmConfigured: boolean;
  devSample: boolean;
}) {
  const router = useRouter();
  const [level, setLevel] = useState(initialLevel);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [own, setOwn] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function saveProfile(changes: { level?: CefrLevel; defaultLessonMinutes?: LessonMinutes }) {
    void fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
  }

  async function create(scenario: string, source: "suggested" | "custom", sample = false) {
    setStatus({ kind: "generating" });
    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, source, minutes, sample }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { id?: string; error?: string } | null;
    if (response?.ok && body?.id) {
      router.push(`/lessons/${body.id}`);
      return;
    }
    setStatus({
      kind: "error",
      message:
        body?.error === "LLM_NOT_CONFIGURED"
          ? t("home.llmMissing")
          : body?.error === "REFUSED"
            ? t("home.refused")
            : t("home.generationFailed"),
    });
  }

  if (status.kind === "generating") {
    return (
      <div className="grid min-h-[60vh] content-center justify-items-center text-center" aria-live="polite">
        <GraphiteSpeaker mode="speak" label={t("home.generating")} />
        <p className="mt-4 text-[clamp(1.6rem,3.6vw,2.4rem)] italic">{t("home.generating")}</p>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">{t("home.generatingHint")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12 flex justify-between">
        <span className="label-caps">{t("home.label")}</span>
        <span className="label-caps">{level}</span>
      </div>

      <h1 className="text-[clamp(2.5rem,7.4vw,5.75rem)] leading-[1.02] italic">
        Où allons-nous aujourd&apos;hui&nbsp;?
      </h1>
      <p className="mt-3 font-sans text-sm text-muted-foreground">{t("home.questionDe")}</p>

      <ul className="mt-12 border-t">
        {SUGGESTIONS.map((s) => (
          <li key={s.fr} className="border-b">
            <button
              type="button"
              onClick={() => void create(`${s.fr} (${s.de})`, "suggested")}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-4 text-left"
            >
              <span className="text-[clamp(1.5rem,3.4vw,2.25rem)] leading-tight transition-transform duration-300 group-hover:translate-x-2.5">
                {s.fr}
              </span>
              <span className="hidden font-sans text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
                {t("home.start")}
              </span>
              <span className="font-sans text-sm text-muted-foreground">{s.de}</span>
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-8 flex items-end gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (own.trim().length >= 2) void create(own.trim(), "custom");
        }}
      >
        <input
          id="own-scenario"
          type="text"
          value={own}
          onChange={(e) => setOwn(e.target.value)}
          placeholder={t("home.ownScenario")}
          aria-label={t("home.ownScenario")}
          className="min-w-0 flex-1 rounded-none border-0 border-b border-foreground bg-transparent py-2 text-2xl italic placeholder:text-faint focus:border-b-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={own.trim().length < 2}
          className="shrink-0 border-b pb-0.5 font-sans text-sm font-medium transition-opacity hover:border-foreground disabled:opacity-40"
        >
          {t("home.ownScenarioSubmit")}
        </button>
      </form>

      <div className="mt-8 grid gap-3 font-sans text-sm text-muted-foreground">
        <Choice
          label={t("home.length")}
          options={LESSON_LENGTHS.map((m) => ({ value: m, text: `${m} ${t("home.minutes")}` }))}
          value={minutes}
          onChange={(m) => {
            setMinutes(m);
            saveProfile({ defaultLessonMinutes: m });
          }}
        />
        <Choice
          label={t("home.level")}
          options={CEFR_LEVELS.map((l) => ({ value: l, text: l }))}
          value={level}
          onChange={(l) => {
            setLevel(l);
            saveProfile({ level: l });
          }}
        />
      </div>

      {(status.kind === "error" || !llmConfigured) && (
        <div className="mt-8 grid gap-3 font-sans text-sm">
          <p role="alert" className="text-live">
            {status.kind === "error" ? status.message : t("home.llmMissing")}
          </p>
          {devSample && (
            <button
              type="button"
              onClick={() => void create("À la boulangerie", "suggested", true)}
              className="justify-self-start border-b pb-0.5 font-medium hover:border-foreground"
            >
              {t("home.sampleLesson")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; text: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2" role="group" aria-label={label}>
      <span className="mr-2">{label}:</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-2.5 py-0.5 transition-colors",
            o.value === value ? "bg-foreground font-medium text-background" : "hover:text-foreground",
          )}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}
