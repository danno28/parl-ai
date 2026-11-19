/**
 * Plays a line in the target language. Uses the server's Azure voice when available,
 * otherwise the browser's built-in voice (quality varies by device).
 */
export type SpeakHandlers = { onStart?: () => void; onEnd?: () => void };

let current: HTMLAudioElement | null = null;

export async function speak(
  text: string,
  { rate = 1, locale = "fr-FR", useServer }: { rate?: number; locale?: string; useServer: boolean },
  handlers: SpeakHandlers = {},
): Promise<void> {
  stopSpeaking();
  if (useServer) {
    const response = await fetch("/api/speech/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rate, locale }),
    });
    if (response.ok) {
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      current = audio;
      audio.onplay = () => handlers.onStart?.();
      audio.onended = audio.onerror = () => {
        URL.revokeObjectURL(url);
        handlers.onEnd?.();
      };
      await audio.play();
      return;
    }
  }
  browserSpeak(text, rate, locale, handlers);
}

export function stopSpeaking() {
  current?.pause();
  current = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function browserSpeak(text: string, rate: number, locale: string, h: SpeakHandlers) {
  if (!("speechSynthesis" in window)) {
    h.onStart?.();
    setTimeout(() => h.onEnd?.(), 1800 / rate);
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;
  u.rate = rate;
  const lang = locale.split("-")[0];
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang));
  if (voice) u.voice = voice;
  u.onstart = () => h.onStart?.();
  u.onend = u.onerror = () => h.onEnd?.();
  window.speechSynthesis.speak(u);
}
