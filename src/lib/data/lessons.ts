import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { LessonContent } from "@/lib/schemas/lesson";
import type { CefrLevel } from "@/config/cefr";
import type { LessonMinutes } from "@/config/lesson-length";
import { DEFAULT_LANGUAGE_PAIR, TARGET_LANGUAGES, type LanguagePair } from "@/config/languages";

/** Stages that exist so far, in order. Grammar (Stage 0) and conversation (Stage 4) come later. */
export const STAGES = ["vocabulary", "reading", "speaking"] as const;
export type Stage = (typeof STAGES)[number];

export type LessonTurn = {
  id: string;
  position: number;
  speaker: "partner" | "user";
  textTarget: string;
  textNative: string;
  cueNative: string;
  hints: string[];
};

export type LessonVocab = {
  id: string;
  termTarget: string;
  termNative: string;
  partOfSpeech: string;
  gender: "m" | "f" | "none";
  example: string;
  note: string;
};

export type LessonDetail = {
  id: string;
  titleTarget: string;
  titleNative: string;
  level: CefrLevel;
  minutes: number;
  partnerName: string;
  partnerRole: string;
  userRole: string;
  grammarFocus: string | null;
  status: "in_progress" | "completed";
  currentStage: Stage;
  currentTurn: number;
  turns: LessonTurn[];
  vocabulary: LessonVocab[];
  /** Best score per user turn and stage, for resuming and the summary. */
  bestScores: Record<string, { reading?: number; speaking?: number }>;
};

export type LessonSummary = {
  id: string;
  titleTarget: string;
  titleNative: string;
  level: CefrLevel;
  minutes: number;
  status: "in_progress" | "completed";
  currentStage: Stage;
  updatedAt: Date;
};

const asStage = (s: string): Stage => ((STAGES as readonly string[]).includes(s) ? (s as Stage) : "vocabulary");

/** Picks a grammar topic typical for the level that the learner has not had yet (G-2, G-3). */
export async function chooseGrammarFocus(
  userId: string,
  languages: LanguagePair,
  level: CefrLevel,
): Promise<{ id: string; title: string }> {
  const reference = TARGET_LANGUAGES[languages.target].grammarReference[level];
  const used = await db
    .select({ title: schema.grammarTopics.title })
    .from(schema.lessons)
    .innerJoin(schema.grammarTopics, eq(schema.lessons.grammarTopicId, schema.grammarTopics.id))
    .where(eq(schema.lessons.userId, userId));
  const usedTitles = new Set(used.map((u) => u.title));
  const title = reference.find((t) => !usedTitles.has(t)) ?? reference[usedTitles.size % reference.length];

  const [topic] = await db
    .insert(schema.grammarTopics)
    .values({ targetLanguage: languages.target, cefrLevel: level, title, source: "reference" })
    .onConflictDoUpdate({
      target: [schema.grammarTopics.targetLanguage, schema.grammarTopics.cefrLevel, schema.grammarTopics.title],
      set: { title },
    })
    .returning({ id: schema.grammarTopics.id, title: schema.grammarTopics.title });
  return topic;
}

/** Stores a generated lesson with its vocabulary and dialogue (A-5: generated once, reused). */
export async function saveLesson(input: {
  userId: string;
  languages: LanguagePair;
  level: CefrLevel;
  minutes: LessonMinutes;
  scenarioSource: "suggested" | "custom";
  grammarTopicId: string | null;
  content: LessonContent;
  promptVersion: string;
  modelId: string;
}): Promise<string> {
  const { content } = input;
  return db.transaction(async (tx) => {
    const [scenario] = await tx
      .insert(schema.scenarios)
      .values({
        titleTarget: content.scenarioTitleTarget,
        titleNative: content.scenarioTitleNative,
        source: input.scenarioSource,
        targetLanguage: input.languages.target,
        nativeLanguage: input.languages.native,
        createdBy: input.userId,
      })
      .returning({ id: schema.scenarios.id });

    const [lesson] = await tx
      .insert(schema.lessons)
      .values({
        userId: input.userId,
        scenarioId: scenario.id,
        targetLanguage: input.languages.target,
        nativeLanguage: input.languages.native,
        cefrLevel: input.level,
        lengthMinutes: input.minutes,
        userRole: content.userRole,
        register: content.register,
        partnerName: content.partnerName,
        partnerRole: content.partnerRole,
        grammarTopicId: input.grammarTopicId,
        content,
        promptVersion: input.promptVersion,
        modelId: input.modelId,
        currentStage: "vocabulary",
      })
      .returning({ id: schema.lessons.id });

    if (content.vocabulary.length) {
      await tx.insert(schema.vocabularyItems).values(
        content.vocabulary.map((v, position) => ({
          lessonId: lesson.id,
          userId: input.userId,
          position,
          termTarget: v.termTarget,
          termNative: v.termNative,
          partOfSpeech: v.partOfSpeech,
          gender: v.gender,
          example: v.example,
          note: v.note,
        })),
      );
    }
    if (content.dialogue.length) {
      await tx.insert(schema.dialogueTurns).values(
        content.dialogue.map((d, position) => ({
          lessonId: lesson.id,
          position,
          speaker: d.speaker,
          textTarget: d.textTarget,
          textNative: d.textNative,
          cueNative: d.cueNative,
          hints: d.hints,
        })),
      );
    }
    await tx.insert(schema.learningEvents).values({
      userId: input.userId,
      lessonId: lesson.id,
      targetLanguage: input.languages.target,
      type: "lesson_created",
      payload: { minutes: input.minutes, level: input.level },
    });
    return lesson.id;
  });
}

export async function listLessons(userId: string): Promise<LessonSummary[]> {
  const rows = await db
    .select({
      id: schema.lessons.id,
      titleTarget: schema.scenarios.titleTarget,
      titleNative: schema.scenarios.titleNative,
      level: schema.lessons.cefrLevel,
      minutes: schema.lessons.lengthMinutes,
      status: schema.lessons.status,
      currentStage: schema.lessons.currentStage,
      updatedAt: schema.lessons.updatedAt,
    })
    .from(schema.lessons)
    .innerJoin(schema.scenarios, eq(schema.lessons.scenarioId, schema.scenarios.id))
    .where(eq(schema.lessons.userId, userId))
    .orderBy(desc(schema.lessons.updatedAt));
  return rows.map((r) => ({ ...r, currentStage: asStage(r.currentStage) }));
}

/** Returns the lesson only if it belongs to this user. */
export async function getLesson(lessonId: string, userId: string): Promise<LessonDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) return null;
  const [row] = await db
    .select({
      lesson: schema.lessons,
      titleTarget: schema.scenarios.titleTarget,
      titleNative: schema.scenarios.titleNative,
      grammarFocus: schema.grammarTopics.title,
    })
    .from(schema.lessons)
    .innerJoin(schema.scenarios, eq(schema.lessons.scenarioId, schema.scenarios.id))
    .leftJoin(schema.grammarTopics, eq(schema.lessons.grammarTopicId, schema.grammarTopics.id))
    .where(and(eq(schema.lessons.id, lessonId), eq(schema.lessons.userId, userId)))
    .limit(1);
  if (!row) return null;

  const [turns, vocab, attempts] = await Promise.all([
    db.select().from(schema.dialogueTurns).where(eq(schema.dialogueTurns.lessonId, lessonId)).orderBy(asc(schema.dialogueTurns.position)),
    db.select().from(schema.vocabularyItems).where(eq(schema.vocabularyItems.lessonId, lessonId)).orderBy(asc(schema.vocabularyItems.position)),
    db
      .select({ turnId: schema.attempts.turnId, stage: schema.attempts.stage, scores: schema.attempts.scores })
      .from(schema.attempts)
      .where(and(eq(schema.attempts.lessonId, lessonId), inArray(schema.attempts.stage, ["reading", "speaking"]))),
  ]);

  const bestScores: LessonDetail["bestScores"] = {};
  for (const a of attempts) {
    if (!a.turnId || (a.stage !== "reading" && a.stage !== "speaking")) continue;
    const score = (a.scores as { overall?: number } | null)?.overall ?? 0;
    const entry = (bestScores[a.turnId] ??= {});
    entry[a.stage] = Math.max(entry[a.stage] ?? 0, score);
  }

  const l = row.lesson;
  return {
    id: l.id,
    titleTarget: row.titleTarget,
    titleNative: row.titleNative,
    level: l.cefrLevel,
    minutes: l.lengthMinutes,
    partnerName: l.partnerName ?? "",
    partnerRole: l.partnerRole ?? "",
    userRole: l.userRole ?? "",
    grammarFocus: row.grammarFocus,
    status: l.status,
    currentStage: asStage(l.currentStage),
    currentTurn: l.currentTurn,
    turns: turns.map((t) => ({
      id: t.id,
      position: t.position,
      speaker: t.speaker,
      textTarget: t.textTarget,
      textNative: t.textNative,
      cueNative: t.cueNative ?? "",
      hints: t.hints ?? [],
    })),
    vocabulary: vocab.map((v) => ({
      id: v.id,
      termTarget: v.termTarget,
      termNative: v.termNative,
      partOfSpeech: v.partOfSpeech ?? "other",
      gender: (v.gender as LessonVocab["gender"]) ?? "none",
      example: v.example ?? "",
      note: v.note ?? "",
    })),
    bestScores,
  };
}

/** Saves where the learner is (P-1, P-2). Moving past the last stage completes the lesson. */
export async function saveProgress(
  lessonId: string,
  userId: string,
  progress: { stage: Stage; turn: number; completedStage?: Stage },
): Promise<void> {
  const lastStage = STAGES[STAGES.length - 1];
  const completed = progress.completedStage === lastStage;
  await db
    .update(schema.lessons)
    .set({
      currentStage: progress.stage,
      currentTurn: progress.turn,
      ...(completed ? { status: "completed" as const } : {}),
    })
    .where(and(eq(schema.lessons.id, lessonId), eq(schema.lessons.userId, userId)));

  if (progress.completedStage) {
    await logEvent(userId, lessonId, "stage_completed", { stage: progress.completedStage });
  }
}

export async function saveAttempt(input: {
  userId: string;
  lessonId: string;
  turnId: string;
  stage: "reading" | "speaking";
  transcript: string;
  scores: Record<string, unknown>;
  hintsUsed: number;
  feedback: unknown;
  input: "voice" | "text";
}): Promise<void> {
  await db.insert(schema.attempts).values({
    userId: input.userId,
    lessonId: input.lessonId,
    turnId: input.turnId,
    stage: input.stage,
    transcript: input.transcript,
    scores: input.scores,
    hintsUsed: input.hintsUsed,
    feedback: input.feedback,
  });
  await logEvent(input.userId, input.lessonId, "attempt", {
    stage: input.stage,
    turnId: input.turnId,
    overall: input.scores.overall,
    hintsUsed: input.hintsUsed,
    input: input.input,
  });
  await db
    .update(schema.lessons)
    .set({ updatedAt: new Date() })
    .where(eq(schema.lessons.id, input.lessonId));
}

export async function logEvent(
  userId: string,
  lessonId: string | null,
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await db.insert(schema.learningEvents).values({
    userId,
    lessonId,
    targetLanguage: DEFAULT_LANGUAGE_PAIR.target,
    type,
    payload,
  });
}
