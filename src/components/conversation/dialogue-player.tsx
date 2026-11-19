"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraphiteSpeaker, type SpeakerMode } from "./graphite-speaker";
import { MicButton } from "./mic-button";
import { speak, stopSpeaking } from "@/lib/audio/speak";
import { useRecorder } from "@/lib/audio/use-recorder";
import type { LessonTurn } from "@/lib/data/lessons";
import type { PronunciationFeedback, SpeakingFeedback } from "@/lib/schemas/lesson";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/**
 * The conversation screen for Stage 2 (reading aloud, §5.2) and Stage 3 (speaking from
 * memory, §5.3). Layout per DS-8: progress line, speaker, partner line, quiet links,
 * the learner's line or cue, one microphone button, feedback below.
 */
type Mode = "reading" | "speaking";

type ReadingResult = { kind: "reading"; feedback: PronunciationFeedback };
type SpeakingResult = {
  kind: "speaking";
  feedback: SpeakingFeedback;
  transcript: string;
  overall: number;
  hintsUsed: number;
};
type Result = ReadingResult | SpeakingResult;

const HINT_PENALTY = 10;

const normalizeWord = (w: string) =>
  w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z']/g, "");

export function DialoguePlayer({
  mode,
  lessonId,
  title,
  turns,
  partnerName,
  partnerRole,
  speechConfigured,
  startStep,
  savesProgress,
}: {
  mode: Mode;
  lessonId: string;
  title: string;
  turns: LessonTurn[];
  partnerName: string;
  partnerRole: string;
  speechConfigured: boolean;
  startStep: number;
  /** False when reviewing a stage already passed, so progress isn't moved backwards. */
  savesProgress: boolean;
}) {
  const router = useRouter();
  const userIndexes = useMemo(
    () => turns.flatMap((turn, i) => (turn.speaker === "user" ? [i] : [])),
    [turns],
  );
  const steps = userIndexes.length;

  const [step, setStep] = useState(Math.min(startStep, steps));
  const [phase, setPhase] = useState<"ready" | "evaluating" | "done">("ready");
  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [overrides, setOverrides] = useState<Record<string, { target: string; native: string }>>({});
  const [hintsShown, setHintsShown] = useState(0);
  const [typing, setTyping] = useState(!speechConfigured);
  const [typed, setTyped] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [speaker, setSpeaker] = useState<SpeakerMode>("idle");
  const [error, setError] = useState<string | null>(null);
  const interacted = useRef(false);

  const recorder = useRecorder((wav) => void submit({ audio: wav }));

  // Partner lines before the current learner line (or after the last one, on the summary).
  const partnerTurns = useMemo(() => {
    const from = step === 0 ? 0 : userIndexes[step - 1] + 1;
    const to = step < steps ? userIndexes[step] : turns.length;
    return turns.slice(from, to).filter((t) => t.speaker === "partner");
  }, [step, steps, turns, userIndexes]);
  const partnerText = (turn: LessonTurn) => overrides[turn.id]?.target ?? turn.textTarget;
  const partnerNative = (turn: LessonTurn) => overrides[turn.id]?.native ?? turn.textNative;
  const partnerLine = partnerTurns.map(partnerText).join(" ");
  const userTurn = step < steps ? turns[userIndexes[step]] : null;

  function playPartner(rate = 1) {
    if (!partnerLine) return;
    interacted.current = true;
    void speak(
      partnerLine,
      { rate, useServer: speechConfigured },
      { onStart: () => setSpeaker("speak"), onEnd: () => setSpeaker("idle") },
    );
  }

  // After the first interaction, the partner speaks automatically at each new line.
  useEffect(() => {
    if (interacted.current) playPartner();
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function saveProgress(body: object) {
    if (!savesProgress) return;
    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  }

  async function submit(input: { audio?: Blob; text?: string }) {
    if (!userTurn) return;
    interacted.current = true;
    setError(null);
    setPhase("evaluating");
    setSpeaker("idle");
    const form = new FormData();
    form.set("stage", mode);
    if (input.audio) form.set("audio", input.audio, "recording.wav");
    if (input.text !== undefined) form.set("text", input.text);
    form.set("hintsUsed", String(hintsShown));
    if (partnerTurns.length) form.set("partnerLine", partnerText(partnerTurns[partnerTurns.length - 1]));

    const response = await fetch(`/api/lessons/${lessonId}/turns/${userTurn.id}/attempt`, {
      method: "POST",
      body: form,
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (!response?.ok || !body) {
      setError(body?.error === "NO_SPEECH" ? t("lesson.noSpeech") : body?.error === "SPEECH_NOT_CONFIGURED" ? t("lesson.speechMissing") : t("lesson.failed"));
      setPhase(result ? "done" : "ready");
      return;
    }

    const next: Result =
      mode === "reading"
        ? { kind: "reading", feedback: body.feedback }
        : { kind: "speaking", feedback: body.feedback, transcript: body.transcript, overall: body.overall, hintsUsed: body.hintsUsed };
    setResult(next);
    setScores((s) => ({
      ...s,
      [step]: Math.max(s[step] ?? 0, next.kind === "reading" ? Math.round(next.feedback.score) : next.overall),
    }));

    // D-6: the partner's next line answers what the learner actually said.
    if (next.kind === "speaking" && next.feedback.nextPartnerLineTarget) {
      const nextPartner = turns[userIndexes[step] + 1];
      if (nextPartner?.speaker === "partner") {
        setOverrides((o) => ({
          ...o,
          [nextPartner.id]: { target: next.feedback.nextPartnerLineTarget, native: next.feedback.nextPartnerLineNative },
        }));
      }
    }
    setPhase("done");
  }

  function goNext() {
    const nextStep = step + 1;
    setStep(nextStep);
    setPhase("ready");
    setResult(null);
    setHintsShown(0);
    setTyped("");
    setShowTranslation(false);
    setError(null);
    if (nextStep < steps) void saveProgress({ stage: mode, turn: nextStep });
  }

  async function finish() {
    await saveProgress(
      mode === "reading"
        ? { stage: "speaking", turn: 0, completedStage: "reading" }
        : { stage: "speaking", turn: 0, completedStage: "speaking" },
    );
    router.push(mode === "reading" ? `/lessons/${lessonId}/speaking` : `/lessons/${lessonId}`);
    router.refresh();
  }

  const recorderError =
    recorder.error === "mic_denied" ? t("lesson.micDenied") : recorder.error === "too_short" ? t("lesson.noSpeech") : recorder.error ? t("lesson.failed") : null;
  const status = recorder.recording
    ? t("conversation.listening")
    : phase === "evaluating"
      ? t("conversation.evaluating")
      : phase === "done"
        ? t("conversation.tryAgain")
        : t("conversation.tapToSpeak");

  const problems = new Set(
    result?.kind === "reading" ? result.feedback.problemWords.map(normalizeWord) : [],
  );
  const scoreValues = Object.values(scores);
  const average = scoreValues.length ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null;

  return (
    <div className="mx-auto grid max-w-3xl justify-items-center text-center">
      <div className="mb-6 flex w-full justify-between">
        <Link href={`/lessons/${lessonId}`} className="font-sans text-sm text-muted-foreground hover:text-foreground">
          ← {title}
        </Link>
      </div>
      <div className="relative mb-3 h-px w-full bg-border">
        <i className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-500" style={{ width: `${(Math.min(step, steps) / Math.max(1, steps)) * 100}%` }} />
      </div>
      <div className="flex w-full justify-between">
        <span className="label-caps">{t(`stages.${mode}`)}</span>
        <span className="label-caps">
          {step < steps ? t("lesson.lineOf").replace("{n}", String(step + 1)).replace("{total}", String(steps)) : "✓"}
        </span>
      </div>

      <GraphiteSpeaker
        mode={recorder.recording ? "listen" : speaker}
        label={`${partnerName}. ${t("conversation.speakerHint")}`}
        onActivate={() => playPartner()}
        className="mt-4"
      />
      <span className="label-caps mt-1">
        {partnerName} · {partnerRole}
      </span>

      {partnerTurns.length > 0 && (
        <>
          <div className="mt-6 grid gap-3">
            {partnerTurns.map((turn, i) => (
              <p
                key={turn.id}
                className={cn(
                  "leading-[1.12]",
                  i === partnerTurns.length - 1 ? "text-[clamp(1.9rem,4.8vw,3.4rem)]" : "text-[clamp(1.3rem,3vw,2rem)] text-muted-foreground",
                )}
              >
                {partnerText(turn)}
              </p>
            ))}
          </div>
          <p className="mt-3 min-h-6 font-sans text-sm text-muted-foreground">
            {showTranslation ? partnerTurns.map(partnerNative).join(" ") : ""}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-sm font-medium text-muted-foreground">
            <button type="button" onClick={() => playPartner()} className="border-b pb-0.5 hover:border-foreground">
              {t("conversation.replay")}
            </button>
            <button type="button" onClick={() => playPartner(0.7)} className="border-b pb-0.5 hover:border-foreground">
              {t("conversation.slow")}
            </button>
            <button type="button" onClick={() => setShowTranslation((v) => !v)} className="border-b pb-0.5 hover:border-foreground">
              {showTranslation ? t("conversation.hide") : t("conversation.translate")}
            </button>
          </div>
        </>
      )}

      {userTurn ? (
        <>
          <div className="mt-14 grid w-full justify-items-center gap-3">
            {mode === "reading" ? (
              <>
                <span className="label-caps">{t("conversation.youRead")}</span>
                <p className="max-w-[30ch] text-[clamp(1.4rem,3.2vw,2rem)] leading-tight italic">
                  {userTurn.textTarget.split(/(\s+)/).map((w, i) =>
                    phase === "done" && problems.has(normalizeWord(w)) ? (
                      <span key={i} className="underline decoration-live decoration-2 underline-offset-[7px]">
                        {w}
                      </span>
                    ) : (
                      <span key={i}>{w}</span>
                    ),
                  )}
                </p>
              </>
            ) : (
              <>
                <span className="label-caps">{t("lesson.yourAnswer")}</span>
                <p className="max-w-[26ch] font-sans text-[clamp(1.3rem,3vw,1.8rem)] leading-snug tracking-tight">
                  {userTurn.cueNative}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  <button
                    type="button"
                    disabled={hintsShown >= userTurn.hints.length || phase === "done"}
                    onClick={() => setHintsShown((h) => Math.min(h + 1, userTurn.hints.length))}
                    className="border-b pb-0.5 font-sans text-sm font-medium hover:border-foreground disabled:opacity-50"
                  >
                    {hintsShown === 0 ? t("lesson.hint") : hintsShown < userTurn.hints.length ? t("lesson.moreHint") : t("lesson.allHints")}
                  </button>
                  <span className="inline-flex gap-1.5" aria-hidden>
                    {userTurn.hints.map((_, i) => (
                      <i key={i} className={cn("size-1.5 rounded-full border border-foreground", i < hintsShown && "bg-foreground")} />
                    ))}
                  </span>
                </div>
                {hintsShown > 0 && (
                  <p key={hintsShown} className="text-xl text-muted-foreground italic animate-in fade-in slide-in-from-bottom-1">
                    {userTurn.hints[hintsShown - 1]}
                  </p>
                )}
              </>
            )}
          </div>

          {phase === "done" && result && <Feedback result={result} scriptLine={userTurn.textTarget} />}

          {(error || recorderError) && (
            <p role="alert" className="mt-6 font-sans text-sm text-live">
              {error ?? recorderError}
            </p>
          )}

          <div className="mt-8 grid w-full justify-items-center gap-3">
            {typing ? (
              <form
                className="flex w-full max-w-xl items-end gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (typed.trim()) void submit({ text: typed.trim() });
                }}
              >
                <input
                  id="typed-answer"
                  type="text"
                  lang="fr"
                  autoComplete="off"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={t("lesson.typePlaceholder")}
                  className="min-w-0 flex-1 rounded-none border-0 border-b border-foreground bg-transparent py-2 text-xl italic placeholder:text-faint focus:border-b-2 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!typed.trim() || phase === "evaluating"}
                  className="shrink-0 rounded-full bg-foreground px-5 py-2.5 font-sans text-sm font-medium text-background disabled:opacity-50"
                >
                  {phase === "evaluating" ? "…" : t("lesson.send")}
                </button>
              </form>
            ) : (
              <>
                <MicButton
                  recording={recorder.recording}
                  disabled={phase === "evaluating"}
                  onToggle={() => {
                    interacted.current = true;
                    stopSpeaking();
                    void (recorder.recording ? recorder.stop() : recorder.start());
                  }}
                />
                <span className="font-sans text-sm text-muted-foreground" aria-live="polite">
                  {status}
                </span>
              </>
            )}
            {speechConfigured && (
              <button
                type="button"
                onClick={() => setTyping((v) => !v)}
                className="font-sans text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                {typing ? t("lesson.speakInstead") : t("lesson.typeInstead")}
              </button>
            )}
            {!speechConfigured && <p className="font-sans text-xs text-muted-foreground">{t("lesson.speechMissing")}</p>}
          </div>

          {phase === "done" && (
            <button
              type="button"
              onClick={goNext}
              className="mt-8 rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t("lesson.next")}
            </button>
          )}
        </>
      ) : (
        <div className="mt-14 grid w-full justify-items-center gap-6">
          <h2 className="text-[clamp(2.25rem,6vw,4rem)] leading-none italic">{t("lesson.summaryTitle")}</h2>
          <p className="font-sans text-sm text-muted-foreground">
            {mode === "reading" ? t("lesson.summaryReading") : t("lesson.summarySpeaking")}
          </p>
          {average !== null && (
            <div className="text-6xl leading-none tabular-nums">
              {average}
              <small className="ml-1 font-sans text-sm text-muted-foreground">{t("lesson.average")}</small>
            </div>
          )}
          <ol className="w-full max-w-xl border-t text-left">
            {userIndexes.map((index, i) => (
              <li key={index} className="flex items-baseline justify-between gap-4 border-b py-3">
                <span className="italic">{turns[index].textTarget}</span>
                <span className="shrink-0 font-sans text-sm tabular-nums text-muted-foreground">{scores[i] ?? "–"}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => void finish()}
            className="rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {mode === "reading" ? t("lesson.toSpeaking") : t("lesson.finish")}
          </button>
        </div>
      )}
    </div>
  );
}

function Feedback({ result, scriptLine }: { result: Result; scriptLine: string }) {
  if (result.kind === "reading") {
    return (
      <div className="mt-8 grid max-w-xl justify-items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
        <div className="text-6xl leading-none tabular-nums">
          {Math.round(result.feedback.score)}
          <small className="ml-1 font-sans text-sm text-muted-foreground">/ 100</small>
        </div>
        {result.feedback.tipsNative.map((tip) => (
          <p key={tip} className="text-lg text-muted-foreground">
            {tip}
          </p>
        ))}
      </div>
    );
  }

  const { feedback, transcript, overall, hintsUsed } = result;
  const corrected = feedback.correctedTarget.trim();
  return (
    <div className="mt-8 grid w-full max-w-xl justify-items-center gap-3 animate-in fade-in slide-in-from-bottom-1">
      <div className="text-6xl leading-none tabular-nums">
        {overall}
        <small className="ml-1 font-sans text-sm text-muted-foreground">/ 100</small>
      </div>
      <p className="text-2xl italic">„{transcript}“</p>
      <p className="text-lg text-muted-foreground">{feedback.feedbackNative}</p>
      {corrected && normalizeWord(corrected) !== normalizeWord(transcript) && (
        <p className="font-sans text-sm text-muted-foreground">
          {t("lesson.corrected")}: <em className="font-serif text-base text-foreground">{corrected}</em>
        </p>
      )}
      <p className="font-sans text-sm text-muted-foreground">
        {t("lesson.script")}: <em className="font-serif text-base">{scriptLine}</em>
      </p>
      {hintsUsed > 0 && (
        <p className="font-sans text-xs text-muted-foreground">
          {t("lesson.hintsUsed").replace("{n}", String(hintsUsed)).replace("{p}", String(hintsUsed * HINT_PENALTY))}
        </p>
      )}
    </div>
  );
}
