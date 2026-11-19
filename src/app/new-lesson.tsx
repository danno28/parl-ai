"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GraphiteSpeaker } from "@/components/conversation/graphite-speaker";
import { CEFR_LEVELS, type CefrLevel } from "@/config/cefr";
import { LESSON_LENGTHS, type LessonMinutes } from "@/config/lesson-length";
import type { ScenarioSuggestion } from "@/lib/schemas/lesson";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/** Shown until the first AI suggestions arrive, or when no Claude key is set. */
const PRESETS: Pick<ScenarioSuggestion, "titleTarget" | "titleNative">[] = [
  { titleTarget: "À la boulangerie", titleNative: "In der Bäckerei" },
  { titleTarget: "Chez le dentiste", titleNative: "Beim Zahnarzt" },
  { titleTarget: "Au guichet de la gare", titleNative: "Am Bahnhofsschalter" },
  { titleTarget: "La visite d'un appartement", titleNative: "Wohnungsbesichtigung" },
];

type Status = { kind: "idle" } | { kind: "generating" } | { kind: "error"; message: string };

export function NewLesson({
  level: initialLevel,
  minutes: initialMinutes,
  grammarPreference: initialGrammarPreference,
  grammarFocus: initialFocus,
  grammarTopics,
  initialSuggestions,
  llmConfigured,
  devSample,
}: {
  level: CefrLevel;
  minutes: LessonMinutes;
  grammarPreference: "offer" | "skip";
  grammarFocus: string;
  grammarTopics: Record<CefrLevel, readonly string[]>;
  initialSuggestions: ScenarioSuggestion[] | null;
  llmConfigured: boolean;
  devSample: boolean;
}) {
  const router = useRouter();
  const [level, setLevel] = useState(initialLevel);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [grammarPreference, setGrammarPreference] = useState(initialGrammarPreference);
  const [proposedFocus, setProposedFocus] = useState(initialFocus);
  const [chosenFocus, setChosenFocus] = useState<string | null>(null);
  const [choosingFocus, setChoosingFocus] = useState(false);
  const [ownFocus, setOwnFocus] = useState("");
  const [own, setOwn] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsFailed, setSuggestionsFailed] = useState(false);
  const requested = useRef(false);

  const focus = chosenFocus ?? proposedFocus;
  const levelIndex = CEFR_LEVELS.indexOf(level);
  const focusLevel = CEFR_LEVELS.find((l) => grammarTopics[l].includes(focus));
  const focusAboveLevel = focusLevel !== undefined && CEFR_LEVELS.indexOf(focusLevel) > levelIndex;

  async function loadSuggestions() {
    if (!llmConfigured) return;
    setLoadingSuggestions(true);
    setSuggestionsFailed(false);
    const response = await fetch("/api/scenarios/suggestions", { method: "POST" }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { suggestions?: ScenarioSuggestion[] } | null;
    if (response?.ok && body?.suggestions) setSuggestions(body.suggestions);
    else setSuggestionsFailed(true);
    setLoadingSuggestions(false);
  }

  // First visit (or a new level): fetch AI suggestions once, showing the presets meanwhile.
  useEffect(() => {
    if (!initialSuggestions && llmConfigured && !requested.current) {
      requested.current = true;
      void loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(changes: {
    level?: CefrLevel;
    defaultLessonMinutes?: LessonMinutes;
    grammarPreference?: "offer" | "skip";
  }) {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }).catch(() => null);
    return (await response?.json().catch(() => null)) as { grammarFocus?: string } | null;
  }

  async function changeLevel(l: CefrLevel) {
    setLevel(l);
    setChosenFocus(null);
    const result = await saveProfile({ level: l });
    if (result?.grammarFocus) setProposedFocus(result.grammarFocus);
    void loadSuggestions();
  }

  async function create(scenario: string, source: "suggested" | "custom", sample = false) {
    setStatus({ kind: "generating" });
    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, source, minutes, sample, grammarFocus: focus }),
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

  const shown = suggestions ?? PRESETS;

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

      <ul className={cn("mt-12 border-t transition-opacity", loadingSuggestions && "opacity-40")} aria-busy={loadingSuggestions}>
        {shown.map((s) => (
          <li key={s.titleTarget} className="border-b">
            <button
              type="button"
              disabled={loadingSuggestions}
              onClick={() => void create(`${s.titleTarget} (${s.titleNative})`, "suggested")}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-4 text-left"
            >
              <span className="text-[clamp(1.5rem,3.4vw,2.25rem)] leading-tight transition-transform duration-300 group-hover:translate-x-2.5">
                {s.titleTarget}
              </span>
              <span className="hidden font-sans text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
                {t("home.start")}
              </span>
              <span className="font-sans text-sm text-muted-foreground">
                {s.titleNative}
                {"description" in s && s.description ? ` · ${s.description}` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {llmConfigured && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm">
          <button
            type="button"
            disabled={loadingSuggestions}
            onClick={() => void loadSuggestions()}
            className="border-b pb-0.5 font-medium text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50"
          >
            {loadingSuggestions ? t("home.suggestionsLoading") : t("home.otherSuggestions")}
          </button>
          {suggestionsFailed && <span className="text-live">{t("home.suggestionsFailed")}</span>}
        </div>
      )}

      <form
        className="mt-10 flex items-end gap-4"
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
            void saveProfile({ defaultLessonMinutes: m });
          }}
        />
        <Choice
          label={t("home.level")}
          options={CEFR_LEVELS.map((l) => ({ value: l, text: l }))}
          value={level}
          onChange={(l) => void changeLevel(l)}
        />
        <Choice
          label={t("home.grammarPref")}
          options={[
            { value: "offer" as const, text: t("home.grammarOffer") },
            { value: "skip" as const, text: t("home.grammarSkip") },
          ]}
          value={grammarPreference}
          onChange={(p) => {
            setGrammarPreference(p);
            void saveProfile({ grammarPreference: p });
          }}
        />
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span>{t("home.grammar")}:</span>
          <i className="font-serif text-base text-foreground">{focus}</i>
          {focusAboveLevel && <span className="text-xs text-live">({t("home.grammarAbove")})</span>}
          <button
            type="button"
            onClick={() => setChoosingFocus((v) => !v)}
            aria-expanded={choosingFocus}
            className="border-b pb-0.5 font-medium hover:border-foreground hover:text-foreground"
          >
            {t("home.change")}
          </button>
        </div>
        {choosingFocus && (
          <GrammarChooser
            topics={grammarTopics}
            level={level}
            current={focus}
            own={ownFocus}
            setOwn={setOwnFocus}
            onChoose={(topic) => {
              setChosenFocus(topic === proposedFocus ? null : topic);
              setChoosingFocus(false);
            }}
            canReset={chosenFocus !== null}
            onReset={() => {
              setChosenFocus(null);
              setChoosingFocus(false);
            }}
          />
        )}
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

/** G-2: pick another topic from the reference lists or type one. Applies to this lesson only (G-3). */
function GrammarChooser({
  topics,
  level,
  current,
  own,
  setOwn,
  onChoose,
  canReset,
  onReset,
}: {
  topics: Record<CefrLevel, readonly string[]>;
  level: CefrLevel;
  current: string;
  own: string;
  setOwn: (v: string) => void;
  onChoose: (topic: string) => void;
  canReset: boolean;
  onReset: () => void;
}) {
  const [shownLevel, setShownLevel] = useState(level);
  return (
    <div className="mt-2 grid gap-4 border-t border-b py-5">
      <span className="label-caps">{t("home.grammarTitle")}</span>
      <div className="flex flex-wrap gap-1" role="group" aria-label={t("home.level")}>
        {CEFR_LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={l === shownLevel}
            onClick={() => setShownLevel(l)}
            className={cn(
              "rounded-full px-2.5 py-0.5",
              l === shownLevel ? "bg-foreground font-medium text-background" : "hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <ul className="grid gap-1.5">
        {topics[shownLevel].map((topic) => (
          <li key={topic}>
            <button
              type="button"
              onClick={() => onChoose(topic)}
              className={cn(
                "text-left font-serif text-base hover:text-foreground",
                topic === current ? "text-foreground italic" : "text-muted-foreground",
              )}
            >
              {topic}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex items-end gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (own.trim().length >= 2) onChoose(own.trim());
        }}
      >
        <input
          id="own-grammar"
          type="text"
          value={own}
          onChange={(e) => setOwn(e.target.value)}
          placeholder={t("home.grammarOwn")}
          aria-label={t("home.grammarOwn")}
          className="min-w-0 flex-1 rounded-none border-0 border-b border-foreground bg-transparent py-1.5 font-serif text-lg italic text-foreground placeholder:text-faint focus:border-b-2 focus:outline-none"
        />
        <button type="submit" disabled={own.trim().length < 2} className="shrink-0 border-b pb-0.5 font-medium hover:border-foreground disabled:opacity-40">
          {t("home.grammarUse")}
        </button>
      </form>
      {canReset && (
        <button type="button" onClick={onReset} className="justify-self-start border-b pb-0.5 font-medium hover:border-foreground">
          {t("home.grammarReset")}
        </button>
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
