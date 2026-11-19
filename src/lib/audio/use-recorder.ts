"use client";

import { useEffect, useRef, useState } from "react";
import { MicrophoneDeniedError, WavRecorder } from "./wav-recorder";

const MAX_SECONDS = 30;

export type RecorderError = "mic_denied" | "too_short" | "failed";

/**
 * Microphone recording for one line at a time. Recording ends when the learner taps stop,
 * pauses for 1.5 s after speaking (R-8), or hits 30 s; then the WAV goes to `onRecorded`.
 * If nothing is said for 8 s, the recording is dropped quietly.
 */
export function useRecorder(onRecorded: (wav: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<RecorderError | null>(null);
  const recorder = useRef<WavRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onRecorded);

  useEffect(() => {
    callback.current = onRecorded;
  }, [onRecorded]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      recorder.current?.cancel();
    },
    [],
  );

  function cancel() {
    clearTimeout(timer.current);
    recorder.current?.cancel();
    recorder.current = null;
    setRecording(false);
  }

  async function start() {
    if (recorder.current) return;
    setError(null);
    const r = new WavRecorder();
    recorder.current = r;
    try {
      await r.start({ onSpeechEnd: () => void stop(), onNoSpeech: cancel });
    } catch (e) {
      recorder.current = null;
      setError(e instanceof MicrophoneDeniedError ? "mic_denied" : "failed");
      return;
    }
    setRecording(true);
    timer.current = setTimeout(() => void stop(), MAX_SECONDS * 1000);
  }

  async function stop() {
    clearTimeout(timer.current);
    const r = recorder.current;
    recorder.current = null;
    setRecording(false);
    if (!r) return;
    const { wav, seconds } = await r.stop();
    if (seconds < 0.5) {
      setError("too_short");
      return;
    }
    callback.current(wav);
  }

  return { recording, error, setError, start, stop, cancel };
}
