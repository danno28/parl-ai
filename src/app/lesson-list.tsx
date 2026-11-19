"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { CefrLevel } from "@/config/cefr";
import type { Stage } from "@/lib/data/lessons";
import { t } from "@/i18n";

export type LessonListItem = {
  id: string;
  titleTarget: string;
  titleNative: string;
  level: CefrLevel;
  minutes: number;
  status: "in_progress" | "completed";
  currentStage: Stage;
};

/** Lessons in progress or completed. Unfinished lessons can be removed (P-7). */
export function LessonList({
  label,
  lessons,
  removable = false,
  className,
}: {
  label: string;
  lessons: LessonListItem[];
  removable?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const visible = lessons.filter((l) => !removed.has(l.id));
  if (!visible.length) return null;

  async function remove(id: string) {
    setRemoved((s) => new Set(s).add(id));
    setConfirming(null);
    const response = await fetch(`/api/lessons/${id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setRemoved((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
    router.refresh();
  }

  return (
    <div className={className ?? "mb-20"}>
      <span className="label-caps">{label}</span>
      <ul className="mt-4 border-t">
        {visible.map((l) => (
          <li key={l.id} className="group/row flex items-center gap-4 border-b">
            {confirming === l.id ? (
              <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4" role="alert">
                <span className="font-sans text-sm">
                  <span className="font-serif text-lg italic">{l.titleTarget}</span> · {t("home.removeConfirm")}
                </span>
                <span className="flex gap-5 font-sans text-sm font-medium">
                  <button type="button" onClick={() => void remove(l.id)} className="text-live hover:underline">
                    {t("home.removeYes")}
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className="text-muted-foreground hover:text-foreground">
                    {t("home.cancel")}
                  </button>
                </span>
              </div>
            ) : (
              <>
                <Link
                  href={`/lessons/${l.id}`}
                  className="group grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-4"
                >
                  <span className="text-[clamp(1.4rem,3vw,2rem)] leading-tight transition-transform duration-300 group-hover:translate-x-2.5">
                    {l.titleTarget}
                  </span>
                  <span className="font-sans text-xs text-muted-foreground">
                    {l.status === "completed" ? t("stages.done") : t(`stages.${l.currentStage}`)}
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    {l.titleNative} · {l.level} · {l.minutes} {t("home.minutes")}
                  </span>
                </Link>
                {removable && (
                  <button
                    type="button"
                    onClick={() => setConfirming(l.id)}
                    aria-label={`${t("home.remove")}: ${l.titleTarget}`}
                    title={t("home.remove")}
                    className="shrink-0 p-2 text-faint transition-colors hover:text-foreground focus-visible:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
