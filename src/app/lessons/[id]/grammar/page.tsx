import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getLesson } from "@/lib/data/lessons";
import { isSpeechConfigured } from "@/lib/speech";
import { GrammarStage } from "./grammar-stage";

/** Stage 0: optional grammar lesson (§5.0). */
export default function GrammarPage(props: PageProps<"/lessons/[id]/grammar">) {
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
  if (!lesson || !lesson.grammarFocus) notFound();
  return (
    <GrammarStage
      lessonId={lesson.id}
      title={lesson.titleTarget}
      focus={lesson.grammarFocus}
      initialContent={lesson.grammarContent}
      speechConfigured={isSpeechConfigured()}
    />
  );
}
