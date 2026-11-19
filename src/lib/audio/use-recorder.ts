"use client";

import { useEffect, useRef, useState } from "react";
import { MicrophoneDeniedError, WavRecorder } from "./wav-recorder";

const MAX_SECONDS = 30;

export type RecorderError = "mic_denied" | "too_short" | "failed";

/**
 * Microphone recording for one line at a time: start, stop (or auto-stop after 30 s),
 * and hand the WAV to `onRecorded`.
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

  async function start() {
    setError(null);
    const r = new WavRecorder();
    try {
      await r.start();
    } catch (e) {
      setError(e instanceof MicrophoneDeniedError ? "mic_denied" : "failed");
      return;
    }
    recorder.current = r;
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

  return { recording, error, setError, start, stop };
}
