import Link from "next/link";
import { LESSON_LENGTHS, DEFAULT_LESSON_MINUTES } from "@/config/lesson-length";
import { t } from "@/i18n";

/**
 * Scenario selection (§4). Static placeholder suggestions for now;
 * later these come from the AI (S-1) via the "suggestScenarios" task.
 */
const SUGGESTIONS = [
  { fr: "À la boulangerie", de: "In der Bäckerei" },
  { fr: "Chez le dentiste", de: "Beim Zahnarzt" },
  { fr: "Au guichet de la gare", de: "Am Bahnhofsschalter" },
  { fr: "La visite d'un appartement", de: "Wohnungsbesichtigung" },
];

export default function Home() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-12 flex justify-between">
          <span className="label-caps">{t("home.label")}</span>
          <span className="label-caps">A2</span>
        </div>

        <h1 className="text-[clamp(2.5rem,7.4vw,5.75rem)] leading-[1.02] italic">
          Où allons-nous aujourd&apos;hui&nbsp;?
        </h1>
        <p className="mt-3 font-sans text-sm text-muted-foreground">{t("home.questionDe")}</p>

        <ul className="mt-12 border-t">
          {SUGGESTIONS.map((s) => (
            <li key={s.fr} className="border-b">
              <Link
                href="/demo"
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-4"
              >
                <span className="text-[clamp(1.5rem,3.4vw,2.25rem)] leading-tight transition-transform duration-300 group-hover:translate-x-2.5">
                  {s.fr}
                </span>
                <span className="hidden font-sans text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
                  {t("home.start")}
                </span>
                <span className="font-sans text-sm text-muted-foreground">{s.de}</span>
              </Link>
            </li>
          ))}
        </ul>

        <input
          id="own-scenario"
          type="text"
          placeholder={t("home.ownScenario")}
          aria-label={t("home.ownScenario")}
          className="mt-8 w-full rounded-none border-0 border-b border-foreground bg-transparent py-2 text-2xl italic placeholder:text-faint focus:border-b-2 focus:outline-none"
        />

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-sm">
          <span className="text-muted-foreground">
            {t("home.length")}:{" "}
            {LESSON_LENGTHS.map((m) => (
              <span
                key={m}
                className={
                  m === DEFAULT_LESSON_MINUTES
                    ? "mx-1 font-medium text-foreground underline underline-offset-4"
                    : "mx-1"
                }
              >
                {m} {t("home.minutes")}
              </span>
            ))}
          </span>
          <span className="text-muted-foreground">
            {t("home.grammar")}: <i className="font-serif text-foreground">du, de la, des</i>
          </span>
          <span className="text-muted-foreground">{t("home.uploadVocab")}</span>
        </div>
      </div>
    </section>
  );
}
