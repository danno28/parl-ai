import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getLesson } from "@/lib/data/lessons";
import { isSpeechConfigured } from "@/lib/speech";
import { toQuizletTsv } from "@/lib/lessons/quizlet";
import { VocabularyStage } from "./vocabulary-stage";

/** Stage 1: vocabulary (§5.1). */
export default function VocabularyPage(props: PageProps<"/lessons/[id]/vocabulary">) {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
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
  return (
    <VocabularyStage
      lessonId={lesson.id}
      title={lesson.titleTarget}
      items={lesson.vocabulary}
      quizletTsv={toQuizletTsv(lesson.vocabulary)}
      speechConfigured={isSpeechConfigured()}
      alreadyPastStage={lesson.status === "completed" || lesson.currentStage !== "vocabulary"}
    />
  );
}
