"use client";

import { useEffect, useRef, useState } from "react";
import { GraphiteSpeaker, type SpeakerMode } from "@/components/conversation/graphite-speaker";
import { MicButton } from "@/components/conversation/mic-button";
import { MicrophoneDeniedError, WavRecorder } from "@/lib/audio/wav-recorder";
import { speak, stopSpeaking } from "@/lib/audio/speak";
import type { PronunciationFeedback } from "@/lib/schemas/lesson";
import { t } from "@/i18n";

/**
 * Stage 2 screen (DS-8) with example content.
 * With Azure Speech configured: real voice, real recording, real scores and AI tips.
 * Without it: browser voice and a simulated result, so the design can still be tried.
 */
// French typography: a non-breaking space before ? and ! (as the prompts require of AI output).
const PARTNER_LINE = "Bonjour ! Qu'est-ce que je vous sers ?";
const PARTNER_TRANSLATION = "Guten Tag! Was darf es sein?";
const USER_LINE = "Bonjour ! Je voudrais une baguette et deux croissants, s'il vous plaît.";
const MAX_SECONDS = 30;

const SIMULATED: PronunciationFeedback = {
  score: 82,
  label: "good",
  problemWords: ["croissants"],
  tipsNative: ["In croissants bleibt das s am Ende stumm."],
};

type Phase = "ready" | "recording" | "evaluating" | "done";

const normalizeWord = (w: string) =>
  w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z']/g, "");

export function ReadingDemo() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [speaker, setSpeaker] = useState<SpeakerMode>("idle");
  const [phase, setPhase] = useState<Phase>("ready");
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const recorder = useRef<WavRecorder | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch("/api/speech/status")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((s: { configured: boolean }) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
    return () => {
      clearTimeout(autoStop.current);
      recorder.current?.cancel();
      stopSpeaking();
    };
  }, []);

  function playPartner(rate = 1) {
    void speak(
      PARTNER_LINE,
      { rate, useServer: configured === true },
      { onStart: () => setSpeaker("speak"), onEnd: () => setSpeaker("idle") },
    );
  }

  async function startRecording() {
    setError(null);
    stopSpeaking();
    if (configured) {
      const r = new WavRecorder();
      try {
        await r.start();
      } catch (e) {
        setError(e instanceof MicrophoneDeniedError ? t("demo.micDenied") : t("demo.failed"));
        return;
      }
      recorder.current = r;
      autoStop.current = setTimeout(() => void stopRecording(), MAX_SECONDS * 1000);
    }
    setSpeaker("listen");
    setPhase("recording");
  }

  async function stopRecording() {
    clearTimeout(autoStop.current);
    setSpeaker("idle");
    setPhase("evaluating");

    if (!configured || !recorder.current) {
      setTimeout(() => {
        setFeedback(SIMULATED);
        setPhase("done");
      }, 900);
      return;
    }

    const { wav, seconds } = await recorder.current.stop();
    recorder.current = null;
    if (seconds < 0.5) {
      setError(t("demo.tooShort"));
      setPhase("ready");
      return;
    }

    const form = new FormData();
    form.set("audio", wav, "recording.wav");
    form.set("referenceText", USER_LINE);
    form.set("level", "A2");
    const response = await fetch("/api/speech/assess", { method: "POST", body: form });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error === "NO_SPEECH" ? t("demo.tooShort") : t("demo.failed"));
      setPhase(feedback ? "done" : "ready");
      return;
    }
    const result = (await response.json()) as { feedback: PronunciationFeedback };
    setFeedback(result.feedback);
    setPhase("done");
  }

  const status =
    phase === "recording"
      ? t("conversation.listening")
      : phase === "evaluating"
        ? t("conversation.evaluating")
        : phase === "done"
          ? t("conversation.tryAgain")
          : t("conversation.tapToSpeak");

  const problems = new Set((feedback?.problemWords ?? []).map(normalizeWord));
  const words = USER_LINE.split(/(\s+)/);

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
        onActivate={() => playPartner()}
        className="mt-4"
      />
      <span className="label-caps mt-1">Camille · boulangère</span>

      <p className="mt-6 text-[clamp(1.9rem,4.8vw,3.4rem)] leading-[1.12]">{PARTNER_LINE}</p>
      <p className="mt-3 min-h-6 font-sans text-sm text-muted-foreground">
        {showTranslation ? PARTNER_TRANSLATION : ""}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-sm font-medium text-muted-foreground">
        <button type="button" onClick={() => playPartner()} className="border-b pb-0.5 hover:border-foreground">
          {t("conversation.replay")}
        </button>
        <button type="button" onClick={() => playPartner(0.7)} className="border-b pb-0.5 hover:border-foreground">
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
          {words.map((w, i) =>
            phase === "done" && problems.has(normalizeWord(w)) ? (
              <span key={i} className="underline decoration-live decoration-2 underline-offset-[7px]">
                {w}
              </span>
            ) : (
              <span key={i}>{w}</span>
            ),
          )}
        </p>
      </div>

      {phase === "done" && feedback && (
        <div className="mt-8 grid max-w-xl justify-items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
          <div className="text-6xl leading-none tabular-nums">
            {Math.round(feedback.score)}
            <small className="ml-1 font-sans text-sm text-muted-foreground">/ 100</small>
          </div>
          {feedback.tipsNative.map((tip) => (
            <p key={tip} className="text-lg text-muted-foreground">
              {tip}
            </p>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 font-sans text-sm text-live">
          {error}
        </p>
      )}

      <div className="mt-8 grid justify-items-center gap-3">
        <MicButton
          recording={phase === "recording"}
          onToggle={() => void (phase === "recording" ? stopRecording() : startRecording())}
          disabled={phase === "evaluating" || configured === null}
        />
        <span className="font-sans text-sm text-muted-foreground" aria-live="polite">
          {status}
        </span>
      </div>

      {configured !== null && (
        <p className="mt-16 font-sans text-xs text-muted-foreground">
          {configured ? t("demo.noteLive") : t("demo.noteSimulated")}
        </p>
      )}
    </div>
  );
}
