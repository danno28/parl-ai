ALTER TABLE "users" ADD COLUMN "scenario_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suggestions_level" text;--> statement-breakpoint
ALTER TABLE "vocabulary_items" ADD COLUMN "in_dialogue" boolean DEFAULT true NOT NULL;