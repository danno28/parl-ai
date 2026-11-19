CREATE TYPE "public"."cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."grammar_preference" AS ENUM('offer', 'skip');--> statement-breakpoint
CREATE TYPE "public"."grammar_status" AS ENUM('not_started', 'skipped', 'done');--> statement-breakpoint
CREATE TYPE "public"."grammar_topic_source" AS ENUM('reference', 'custom');--> statement-breakpoint
CREATE TYPE "public"."lesson_stage" AS ENUM('grammar', 'vocabulary', 'reading', 'speaking', 'conversation');--> statement-breakpoint
CREATE TYPE "public"."lesson_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."register" AS ENUM('formal', 'informal');--> statement-breakpoint
CREATE TYPE "public"."scenario_source" AS ENUM('suggested', 'custom', 'vocab_import');--> statement-breakpoint
CREATE TYPE "public"."speaker" AS ENUM('partner', 'user');--> statement-breakpoint
CREATE TYPE "public"."theme_preference" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TABLE "ai_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"lesson_id" uuid,
	"task" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"ok" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"stage" "lesson_stage" NOT NULL,
	"turn_id" uuid,
	"exercise_index" integer,
	"transcript" text,
	"scores" jsonb,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"feedback" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dialogue_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"speaker" "speaker" NOT NULL,
	"text_target" text NOT NULL,
	"text_native" text NOT NULL,
	"cue_native" text,
	"hints" jsonb
);
--> statement-breakpoint
CREATE TABLE "grammar_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_language" text NOT NULL,
	"cefr_level" "cefr_level" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" "grammar_topic_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid,
	"target_language" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" uuid NOT NULL,
	"target_language" text NOT NULL,
	"native_language" text NOT NULL,
	"cefr_level" "cefr_level" NOT NULL,
	"length_minutes" integer NOT NULL,
	"user_role" text,
	"register" "register",
	"partner_name" text,
	"partner_role" text,
	"grammar_topic_id" uuid,
	"grammar_overridden" boolean DEFAULT false NOT NULL,
	"grammar_content" jsonb,
	"grammar_status" "grammar_status" DEFAULT 'not_started' NOT NULL,
	"content" jsonb NOT NULL,
	"prompt_version" text NOT NULL,
	"model_id" text NOT NULL,
	"status" "lesson_status" DEFAULT 'in_progress' NOT NULL,
	"current_stage" "lesson_stage" DEFAULT 'grammar' NOT NULL,
	"current_turn" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_target" text NOT NULL,
	"title_native" text NOT NULL,
	"description" text,
	"category" text,
	"source" "scenario_source" NOT NULL,
	"target_language" text NOT NULL,
	"native_language" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"native_language" text DEFAULT 'de' NOT NULL,
	"target_language" text DEFAULT 'fr' NOT NULL,
	"cefr_level" "cefr_level" DEFAULT 'A1' NOT NULL,
	"feedback_language" text DEFAULT 'de' NOT NULL,
	"grammar_preference" "grammar_preference" DEFAULT 'offer' NOT NULL,
	"default_lesson_minutes" integer DEFAULT 10 NOT NULL,
	"theme" "theme_preference" DEFAULT 'light' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vocabulary_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"term_target" text NOT NULL,
	"term_native" text NOT NULL,
	"part_of_speech" text,
	"gender" text,
	"example" text,
	"note" text,
	"srs_ease" real,
	"srs_interval_days" integer,
	"srs_due_at" timestamp with time zone,
	"srs_review_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_calls" ADD CONSTRAINT "ai_calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_calls" ADD CONSTRAINT "ai_calls_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_turn_id_dialogue_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."dialogue_turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dialogue_turns" ADD CONSTRAINT "dialogue_turns_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_grammar_topic_id_grammar_topics_id_fk" FOREIGN KEY ("grammar_topic_id") REFERENCES "public"."grammar_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD CONSTRAINT "vocabulary_items_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD CONSTRAINT "vocabulary_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_calls_user_day_idx" ON "ai_calls" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "attempts_lesson_idx" ON "attempts" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_topics_unique" ON "grammar_topics" USING btree ("target_language","cefr_level","title");--> statement-breakpoint
CREATE INDEX "events_user_idx" ON "learning_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "lessons_user_idx" ON "lessons" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vocabulary_user_idx" ON "vocabulary_items" USING btree ("user_id");