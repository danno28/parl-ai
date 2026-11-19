import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";

/**
 * Data model (spec §10). The language pair is stored on every learning record (§9),
 * so other target and native languages can be added without migrations of meaning.
 */

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const cefrLevel = pgEnum("cefr_level", ["A1", "A2", "B1", "B2", "C1", "C2"]);
export const themePreference = pgEnum("theme_preference", ["light", "dark"]);
export const grammarPreference = pgEnum("grammar_preference", ["offer", "skip"]);
export const scenarioSource = pgEnum("scenario_source", ["suggested", "custom", "vocab_import"]);
export const register = pgEnum("register", ["formal", "informal"]);
export const grammarStatus = pgEnum("grammar_status", ["not_started", "skipped", "done"]);
export const lessonStatus = pgEnum("lesson_status", ["in_progress", "completed"]);
export const lessonStage = pgEnum("lesson_stage", [
  "grammar",
  "vocabulary",
  "reading",
  "speaking",
  "conversation",
]);
export const speaker = pgEnum("speaker", ["partner", "user"]);
export const grammarTopicSource = pgEnum("grammar_topic_source", ["reference", "custom"]);

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/**
 * Users. The first block of columns is required by Better Auth (login, U-1);
 * the rest is the learner profile (U-2 to U-9).
 */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  updatedAt: updatedAt(),
  nativeLanguage: text("native_language").notNull().default("de"),
  targetLanguage: text("target_language").notNull().default("fr"),
  cefrLevel: cefrLevel("cefr_level").notNull().default("A1"),
  feedbackLanguage: text("feedback_language").notNull().default("de"),
  grammarPreference: grammarPreference("grammar_preference").notNull().default("offer"),
  defaultLessonMinutes: integer("default_lesson_minutes").notNull().default(10),
  theme: themePreference("theme").notNull().default("light"),
  /** Last AI scenario suggestions (S-1), kept so the home page doesn't call the AI on every visit. */
  scenarioSuggestions: jsonb("scenario_suggestions"),
  /** Level the stored suggestions were made for; a level change triggers new ones. */
  suggestionsLevel: text("suggestions_level"),
  createdAt: createdAt(),
});

/** Email addresses allowed to register (invite-only, U-6). Add with `npm run invite -- <email>`. */
export const invites = pgTable("invites", {
  email: text("email").primaryKey(),
  createdAt: createdAt(),
});

/* --- Login tables used by Better Auth (magic link, U-1). Column names follow its core schema. --- */

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable("accounts", {
  id: id(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Pending magic-link tokens. */
export const verifications = pgTable("verifications", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const scenarios = pgTable("scenarios", {
  id: id(),
  titleTarget: text("title_target").notNull(),
  titleNative: text("title_native").notNull(),
  description: text("description"),
  category: text("category"),
  source: scenarioSource("source").notNull(),
  targetLanguage: text("target_language").notNull(),
  nativeLanguage: text("native_language").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const grammarTopics = pgTable(
  "grammar_topics",
  {
    id: id(),
    targetLanguage: text("target_language").notNull(),
    cefrLevel: cefrLevel("cefr_level").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    source: grammarTopicSource("source").notNull(),
  },
  (t) => [uniqueIndex("grammar_topics_unique").on(t.targetLanguage, t.cefrLevel, t.title)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id),
    targetLanguage: text("target_language").notNull(),
    nativeLanguage: text("native_language").notNull(),
    cefrLevel: cefrLevel("cefr_level").notNull(),
    lengthMinutes: integer("length_minutes").notNull(),
    userRole: text("user_role"),
    register: register("register"),
    partnerName: text("partner_name"),
    partnerRole: text("partner_role"),
    grammarTopicId: uuid("grammar_topic_id").references(() => grammarTopics.id),
    grammarOverridden: boolean("grammar_overridden").notNull().default(false),
    /** Generated only when the user opens the grammar lesson (G-7). */
    grammarContent: jsonb("grammar_content"),
    grammarStatus: grammarStatus("grammar_status").notNull().default("not_started"),
    /** Full generated LessonContent, kept for reproducibility. */
    content: jsonb("content").notNull(),
    promptVersion: text("prompt_version").notNull(),
    modelId: text("model_id").notNull(),
    status: lessonStatus("status").notNull().default("in_progress"),
    currentStage: lessonStage("current_stage").notNull().default("grammar"),
    currentTurn: integer("current_turn").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("lessons_user_idx").on(t.userId)],
);

export const vocabularyItems = pgTable(
  "vocabulary_items",
  {
    id: id(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    termTarget: text("term_target").notNull(),
    termNative: text("term_native").notNull(),
    partOfSpeech: text("part_of_speech"),
    gender: text("gender"),
    example: text("example"),
    note: text("note"),
    /** False for extra scenario words that don't appear in the dialogue (V-5). */
    inDialogue: boolean("in_dialogue").notNull().default(true),
    // Reserved for spaced repetition / in-app flashcards (later version, §9).
    srsEase: real("srs_ease"),
    srsIntervalDays: integer("srs_interval_days"),
    srsDueAt: timestamp("srs_due_at", { withTimezone: true }),
    srsReviewCount: integer("srs_review_count").notNull().default(0),
  },
  (t) => [index("vocabulary_user_idx").on(t.userId)],
);

export const dialogueTurns = pgTable("dialogue_turns", {
  id: id(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  speaker: speaker("speaker").notNull(),
  textTarget: text("text_target").notNull(),
  textNative: text("text_native").notNull(),
  cueNative: text("cue_native"),
  hints: jsonb("hints").$type<string[]>(),
});

export const attempts = pgTable(
  "attempts",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    stage: lessonStage("stage").notNull(),
    /** Dialogue turn for reading/speaking; null for grammar exercises and conversation. */
    turnId: uuid("turn_id").references(() => dialogueTurns.id, { onDelete: "cascade" }),
    exerciseIndex: integer("exercise_index"),
    transcript: text("transcript"),
    scores: jsonb("scores"),
    hintsUsed: integer("hints_used").notNull().default(0),
    feedback: jsonb("feedback"),
    createdAt: createdAt(),
  },
  (t) => [index("attempts_lesson_idx").on(t.lessonId)],
);

/** Raw, timestamped log of everything scored (P-6, L-6): basis for future rewards and time calibration. */
export const learningEvents = pgTable(
  "learning_events",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
    targetLanguage: text("target_language").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload"),
    createdAt: createdAt(),
  },
  (t) => [index("events_user_idx").on(t.userId, t.createdAt)],
);

/** AI usage log for cost guardrails and observability (A-8). Never stores audio. */
export const aiCalls = pgTable(
  "ai_calls",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    task: text("task").notNull(),
    provider: text("provider").notNull(),
    modelId: text("model_id").notNull(),
    promptVersion: text("prompt_version").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    latencyMs: integer("latency_ms"),
    ok: boolean("ok").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ai_calls_user_day_idx").on(t.userId, t.createdAt)],
);
