"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

/** The single round microphone button of the conversation screens (DS-8). Red only while recording (DS-4). */
export function MicButton({
  recording,
  onToggle,
  disabled,
}: {
  recording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={recording ? t("conversation.stopRecording") : t("conversation.startRecording")}
      aria-pressed={recording}
      className={cn(
        "relative grid size-[76px] place-items-center rounded-full transition-[background-color,transform] duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:opacity-50",
        recording
          ? "bg-live text-white after:absolute after:inset-0 after:animate-ping after:rounded-full after:border after:border-live motion-reduce:after:animate-none"
          : "bg-foreground text-background",
      )}
    >
      {recording ? (
        <Square className="size-6" strokeWidth={1.7} />
      ) : (
        <Mic className="size-6" strokeWidth={1.7} />
      )}
    </button>
  );
}
