CREATE TYPE "public"."analysis_status" AS ENUM('queued', 'collecting', 'analyzing', 'scoring', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."evidence_source" AS ENUM('github', 'leetcode', 'portfolio', 'resume');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('pending', 'synced', 'error');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('github', 'leetcode', 'portfolio');--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"target_role" text NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"status" "analysis_status" DEFAULT 'queued' NOT NULL,
	"progress" jsonb,
	"evidence_snapshot_id" uuid,
	"fingerprint" text,
	"scoring_version" text DEFAULT '1.0',
	"prompt_version" text DEFAULT '1.0',
	"ai_model" text DEFAULT 'grok-2-latest',
	"overall_score" integer,
	"confidence" real,
	"evidence_coverage" integer,
	"fit_score" integer,
	"breakdown" jsonb,
	"skills" jsonb,
	"insights" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"source" "evidence_source" NOT NULL,
	"source_url" text,
	"evidence_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"raw_data" jsonb,
	"confidence" real DEFAULT 0 NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_snapshot_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"username" text NOT NULL,
	"profile_url" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"status" "profile_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"storage_url" text,
	"parsed_text" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"skill" text NOT NULL,
	"score" integer NOT NULL,
	"evidence_ids" text[]
);
--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_evidence_snapshot_id_evidence_snapshots_id_fk" FOREIGN KEY ("evidence_snapshot_id") REFERENCES "public"."evidence_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_snapshot_items" ADD CONSTRAINT "evidence_snapshot_items_snapshot_id_evidence_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."evidence_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_snapshot_items" ADD CONSTRAINT "evidence_snapshot_items_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_snapshots" ADD CONSTRAINT "evidence_snapshots_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_profiles" ADD CONSTRAINT "external_profiles_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_analysis_run_id_analysis_runs_id_fk" FOREIGN KEY ("analysis_run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;