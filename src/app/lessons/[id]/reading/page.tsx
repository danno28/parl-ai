import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getLesson } from "@/lib/data/lessons";
import { isSpeechConfigured } from "@/lib/speech";
import { DialoguePlayer } from "@/components/conversation/dialogue-player";

/** Stage 2: reading the dialogue aloud (§5.2). */
export default function ReadingPage(props: PageProps<"/lessons/[id]/reading">) {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <Content params={props.params} />
        </Suspense>
      </div>
    </section>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const lesson = await getLesson(id, user.id);
  if (!lesson) notFound();
  const here = lesson.status !== "completed" && lesson.currentStage === "reading";
  return (
    <DialoguePlayer
      mode="reading"
      lessonId={lesson.id}
      title={lesson.titleTarget}
      turns={lesson.turns}
      partnerName={lesson.partnerName}
      partnerRole={lesson.partnerRole}
      speechConfigured={isSpeechConfigured()}
      startStep={here ? lesson.currentTurn : 0}
      savesProgress={here || lesson.currentStage === "vocabulary"}
    />
  );
}
