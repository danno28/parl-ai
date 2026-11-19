"use client";

import { useEffect, useRef, useState } from "react";
import { GraphiteSpeaker, type SpeakerMode } from "@/components/conversation/graphite-speaker";
import { MicButton } from "@/components/conversation/mic-button";
import { t } from "@/i18n";

/**
 * Stage 2 screen (DS-8) with example content. Audio uses the browser's French voice
 * as a stand-in until the Azure TTS provider is wired up; recording is simulated.
 */
// French typography: a non-breaking space before ? and ! (as the prompts require of AI output).
const PARTNER_LINE = "Bonjour ! Qu'est-ce que je vous sers ?";
const PARTNER_TRANSLATION = "Guten Tag! Was darf es sein?";
const USER_LINE = "Bonjour ! Je voudrais une baguette et deux croissants, s'il vous plaît.";

type Phase = "ready" | "recording" | "evaluating" | "done";

export function ReadingDemo() {
  const [speaker, setSpeaker] = useState<SpeakerMode>("idle");
  const [phase, setPhase] = useState<Phase>("ready");
  const [showTranslation, setShowTranslation] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function speak(rate = 0.95) {
    const fallback = () => {
      setSpeaker("speak");
      timer.current = setTimeout(() => setSpeaker("idle"), 1800 / rate);
    };
    if (!("speechSynthesis" in window)) return fallback();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(PARTNER_LINE);
    u.lang = "fr-FR";
    u.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("fr"));
    if (voice) u.voice = voice;
    u.onstart = () => setSpeaker("speak");
    u.onend = u.onerror = () => setSpeaker("idle");
    window.speechSynthesis.speak(u);
  }

  function toggleRecording() {
    clearTimeout(timer.current);
    if (phase === "recording") {
      setSpeaker("idle");
      setPhase("evaluating");
      timer.current = setTimeout(() => setPhase("done"), 900);
    } else {
      setSpeaker("listen");
      setPhase("recording");
    }
  }

  const status =
    phase === "recording"
      ? t("conversation.listening")
      : phase === "evaluating"
        ? t("conversation.evaluating")
        : phase === "done"
          ? t("conversation.tryAgain")
          : t("conversation.tapToSpeak");

  const [before, after] = USER_LINE.split("croissants");

  return (
    <div className="mx-auto grid max-w-3xl justify-items-center text-center">
      <div className="relative mb-3 h-px w-full bg-border">
        <i className="absolute inset-y-0 left-0 w-1/5 bg-foreground" />
      </div>
      <div className="flex w-full justify-between">
        <span className="label-caps">{t("conversation.reading")}</span>
        <span className="label-caps">2 / 10</span>
      </div>

      <GraphiteSpeaker
        mode={speaker}
        label={`Camille. ${t("conversation.speakerHint")}`}
        onActivate={() => speak()}
        className="mt-4"
      />
      <span className="label-caps mt-1">Camille · boulangère</span>

      <p className="mt-6 text-[clamp(1.9rem,4.8vw,3.4rem)] leading-[1.12]">{PARTNER_LINE}</p>
      <p className="mt-3 min-h-6 font-sans text-sm text-muted-foreground">
        {showTranslation ? PARTNER_TRANSLATION : ""}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-sm font-medium text-muted-foreground">
        <button type="button" onClick={() => speak()} className="border-b pb-0.5 hover:border-foreground">
          {t("conversation.replay")}
        </button>
        <button type="button" onClick={() => speak(0.65)} className="border-b pb-0.5 hover:border-foreground">
          {t("conversation.slow")}
        </button>
        <button
          type="button"
          onClick={() => setShowTranslation((v) => !v)}
          className="border-b pb-0.5 hover:border-foreground"
        >
          {showTranslation ? t("conversation.hide") : t("conversation.translate")}
        </button>
      </div>

      <div className="mt-14 grid justify-items-center gap-3">
        <span className="label-caps">{t("conversation.youRead")}</span>
        <p className="max-w-[30ch] text-[clamp(1.4rem,3.2vw,2rem)] leading-tight italic">
          {before}
          <span
            className={
              phase === "done"
                ? "underline decoration-live decoration-2 underline-offset-[7px]"
                : undefined
            }
          >
            croissants
          </span>
          {after}
        </p>
      </div>

      {phase === "done" && (
        <div className="mt-8 grid max-w-xl justify-items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
          <div className="text-6xl leading-none tabular-nums">
            82<small className="ml-1 font-sans text-sm text-muted-foreground">/ 100</small>
          </div>
          <p className="text-lg text-muted-foreground">
            Fast. In <i className="text-foreground">croissants</i> bleibt das{" "}
            <i className="text-foreground">s</i> am Ende stumm.
          </p>
        </div>
      )}

      <div className="mt-8 grid justify-items-center gap-3">
        <MicButton
          recording={phase === "recording"}
          onToggle={toggleRecording}
          disabled={phase === "evaluating"}
        />
        <span className="font-sans text-sm text-muted-foreground" aria-live="polite">
          {status}
        </span>
      </div>
    </div>
  );
}
