-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'mentor', 'admin', 'company_admin', 'sponsor', 'judge');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('video', 'article', 'sandbox', 'quiz', 'project', 'challenge');

-- CreateEnum
CREATE TYPE "SandboxEngine" AS ENUM ('sql', 'python', 'r', 'excel');

-- CreateEnum
CREATE TYPE "HackathonStatus" AS ENUM ('draft', 'open', 'running', 'judging', 'closed');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "learning_style" TEXT,
    "career_goal" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "consent_marketing_at" TIMESTAMP(3),
    "consent_terms_version" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "scopes" JSONB,
    "organization_id" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_meta" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "level" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "xp_total" INTEGER NOT NULL DEFAULT 0,
    "author_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'watch',
    "codename" TEXT,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 0,
    "xp_award" INTEGER NOT NULL DEFAULT 0,
    "unlock_xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "LessonType" NOT NULL,
    "content" JSONB,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "xp_award" INTEGER NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_requires" (
    "lesson_id" UUID NOT NULL,
    "requires_lesson_id" UUID NOT NULL,

    CONSTRAINT "lesson_requires_pkey" PRIMARY KEY ("lesson_id","requires_lesson_id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "watched_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_position_seconds" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'adaptive',
    "passing_score" INTEGER NOT NULL DEFAULT 60,
    "time_limit_seconds" INTEGER,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "xp_award" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "skill_id" UUID,
    "explanation" TEXT,
    "category" TEXT,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "earned_xp" INTEGER NOT NULL DEFAULT 0,
    "adaptive_state" JSONB,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_question_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "chosen_index" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "time_ms" INTEGER NOT NULL,

    CONSTRAINT "user_question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sandbox" (
    "id" UUID NOT NULL,
    "lesson_id" UUID,
    "title" TEXT NOT NULL,
    "engine" "SandboxEngine" NOT NULL,
    "spec" JSONB NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "xp_award" INTEGER NOT NULL DEFAULT 0,
    "max_server_seconds" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "rows" INTEGER NOT NULL DEFAULT 0,
    "schema" JSONB,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "license" TEXT,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_datasets" (
    "sandbox_id" UUID NOT NULL,
    "dataset_id" UUID NOT NULL,

    CONSTRAINT "sandbox_datasets_pkey" PRIMARY KEY ("sandbox_id","dataset_id")
);

-- CreateTable
CREATE TABLE "sandbox_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sandbox_id" UUID NOT NULL,
    "engine_session_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "cells" JSONB,
    "last_active_at" TIMESTAMP(3),

    CONSTRAINT "sandbox_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "lesson_id" UUID,
    "module_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "brief_md" TEXT NOT NULL,
    "acceptance_criteria" JSONB,
    "evaluation_mode" TEXT NOT NULL DEFAULT 'auto',
    "gradingTests" JSONB,
    "rubric" JSONB,
    "xp_award" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_submissions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "artifacts" JSONB,
    "score" INTEGER,
    "earned_xp" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_grades" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "grader" TEXT NOT NULL DEFAULT 'auto',
    "grader_user_id" UUID,
    "score" INTEGER,
    "rubric_scores" JSONB,
    "feedback_md" TEXT,
    "graded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_taxonomy" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "category" TEXT NOT NULL,
    "level_max" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,

    CONSTRAINT "skill_taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_scores" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_assessed_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'quiz',

    CONSTRAINT "skill_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cv" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "parse_status" TEXT NOT NULL DEFAULT 'pending',
    "parsed" JSONB,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_reviews" (
    "id" UUID NOT NULL,
    "cv_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "overall_score" INTEGER NOT NULL DEFAULT 0,
    "summary_md" TEXT,
    "sections" JSONB,
    "ats_score" INTEGER NOT NULL DEFAULT 0,
    "strengths" JSONB,
    "improvements" JSONB,
    "model" TEXT,
    "cost_cents" INTEGER NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdi_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "objective" TEXT,
    "source" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdi_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdi_nodes" (
    "id" UUID NOT NULL,
    "pdi_plan_id" UUID NOT NULL,
    "parent_id" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skill_id" UUID,
    "recommended_content" JSONB,
    "estimated_weeks" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pdi_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "source_id" TEXT,
    "amount" INTEGER NOT NULL,
    "unique_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_xp" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "week_xp" INTEGER NOT NULL DEFAULT 0,
    "week_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_xp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" TIMESTAMP(3),
    "freezes_available" INTEGER NOT NULL DEFAULT 0,
    "freezes_used" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "criteria" JSONB,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "progress" JSONB,
    "earned_at" TIMESTAMP(3),

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" UUID NOT NULL,
    "season" INTEGER NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "week_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "cohort_size" INTEGER NOT NULL DEFAULT 0,
    "promotion_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_rankings" (
    "id" UUID NOT NULL,
    "league_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "eligible_promotion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "league_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "push_token" TEXT NOT NULL,
    "topics" JSONB,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" JSONB,
    "location" TEXT,
    "work_mode" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "seniority" TEXT,
    "skills" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closes_at" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "fit_score" INTEGER,
    "cv_snapshot" JSONB,
    "answers" JSONB,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employer_viewed_at" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" UUID NOT NULL,
    "sponsor_org_id" UUID,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "rules_md" TEXT,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "submission_deadline" TIMESTAMP(3),
    "status" "HackathonStatus" NOT NULL DEFAULT 'draft',
    "prize_pool_cents" INTEGER NOT NULL DEFAULT 0,
    "judging_criteria" JSONB,
    "max_team_size" INTEGER NOT NULL DEFAULT 4,
    "xp_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_prizes" (
    "id" UUID NOT NULL,
    "hackathon_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "hackathon_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_teams" (
    "id" UUID NOT NULL,
    "hackathon_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "leader_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_team_members" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_submissions" (
    "id" UUID NOT NULL,
    "hackathon_id" UUID NOT NULL,
    "team_id" UUID,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "repo_url" TEXT,
    "demo_url" TEXT,
    "storage_keys" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'submitted',

    CONSTRAINT "hackathon_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_scores" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "judge_id" UUID NOT NULL,
    "criteria_scores" JSONB,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "feedback_md" TEXT,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'course',
    "reference_id" TEXT,
    "title" TEXT NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "serial" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verify_url" TEXT,
    "pdf_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ebook" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "category" TEXT NOT NULL,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "storage_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ebook_id" UUID NOT NULL,
    "read_pages" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'lendo',
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_organization_id_key" ON "user_roles"("user_id", "role", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refresh_token_hash_key" ON "Session"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Course_published_at_idx" ON "Course"("published_at");

-- CreateIndex
CREATE INDEX "Module_course_id_position_idx" ON "Module"("course_id", "position");

-- CreateIndex
CREATE INDEX "Lesson_module_id_position_idx" ON "Lesson"("module_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_user_id_lesson_id_key" ON "lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_lesson_id_key" ON "Quiz"("lesson_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_user_id_idx" ON "quiz_attempts"("quiz_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_lesson_id_key" ON "Sandbox"("lesson_id");

-- CreateIndex
CREATE INDEX "Sandbox_engine_idx" ON "Sandbox"("engine");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_name_key" ON "Dataset"("name");

-- CreateIndex
CREATE INDEX "sandbox_sessions_user_id_sandbox_id_idx" ON "sandbox_sessions"("user_id", "sandbox_id");

-- CreateIndex
CREATE INDEX "sandbox_events_session_id_created_at_idx" ON "sandbox_events"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Project_lesson_id_key" ON "Project"("lesson_id");

-- CreateIndex
CREATE INDEX "Project_module_id_idx" ON "Project"("module_id");

-- CreateIndex
CREATE INDEX "project_submissions_project_id_user_id_idx" ON "project_submissions"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_taxonomy_slug_key" ON "skill_taxonomy"("slug");

-- CreateIndex
CREATE INDEX "skill_taxonomy_category_idx" ON "skill_taxonomy"("category");

-- CreateIndex
CREATE UNIQUE INDEX "skill_scores_user_id_skill_id_key" ON "skill_scores"("user_id", "skill_id");

-- CreateIndex
CREATE INDEX "Cv_user_id_is_current_idx" ON "Cv"("user_id", "is_current");

-- CreateIndex
CREATE UNIQUE INDEX "cv_reviews_cv_id_key" ON "cv_reviews"("cv_id");

-- CreateIndex
CREATE INDEX "pdi_plans_user_id_status_idx" ON "pdi_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "pdi_nodes_pdi_plan_id_order_index_idx" ON "pdi_nodes"("pdi_plan_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "xp_events_unique_key_key" ON "xp_events"("unique_key");

-- CreateIndex
CREATE INDEX "xp_events_user_id_created_at_idx" ON "xp_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "xp_events_created_at_idx" ON "xp_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_xp_user_id_key" ON "user_xp"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_user_id_key" ON "Streak"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "League_status_idx" ON "League"("status");

-- CreateIndex
CREATE UNIQUE INDEX "League_season_week_start_key" ON "League"("season", "week_start");

-- CreateIndex
CREATE INDEX "league_rankings_league_id_rank_idx" ON "league_rankings"("league_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "league_rankings_league_id_user_id_key" ON "league_rankings"("league_id", "user_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_sent_at_idx" ON "Notification"("user_id", "sent_at");

-- CreateIndex
CREATE INDEX "Device_user_id_idx" ON "Device"("user_id");

-- CreateIndex
CREATE INDEX "Job_status_posted_at_idx" ON "Job"("status", "posted_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_id_user_id_key" ON "job_applications"("job_id", "user_id");

-- CreateIndex
CREATE INDEX "Hackathon_status_idx" ON "Hackathon"("status");

-- CreateIndex
CREATE INDEX "hackathon_prizes_hackathon_id_position_idx" ON "hackathon_prizes"("hackathon_id", "position");

-- CreateIndex
CREATE INDEX "hackathon_teams_hackathon_id_idx" ON "hackathon_teams"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_team_members_team_id_user_id_key" ON "hackathon_team_members"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "hackathon_submissions_hackathon_id_idx" ON "hackathon_submissions"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_scores_submission_id_judge_id_key" ON "hackathon_scores"("submission_id", "judge_id");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_serial_key" ON "Certificate"("serial");

-- CreateIndex
CREATE INDEX "Certificate_user_id_issued_at_idx" ON "Certificate"("user_id", "issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "Ebook_slug_key" ON "Ebook"("slug");

-- CreateIndex
CREATE INDEX "Ebook_category_idx" ON "Ebook"("category");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_user_id_ebook_id_key" ON "reading_progress"("user_id", "ebook_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_requires" ADD CONSTRAINT "lesson_requires_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_requires" ADD CONSTRAINT "lesson_requires_requires_lesson_id_fkey" FOREIGN KEY ("requires_lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_taxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_datasets" ADD CONSTRAINT "sandbox_datasets_sandbox_id_fkey" FOREIGN KEY ("sandbox_id") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_datasets" ADD CONSTRAINT "sandbox_datasets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_sessions" ADD CONSTRAINT "sandbox_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_sessions" ADD CONSTRAINT "sandbox_sessions_sandbox_id_fkey" FOREIGN KEY ("sandbox_id") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_events" ADD CONSTRAINT "sandbox_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sandbox_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_grades" ADD CONSTRAINT "project_grades_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "project_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_taxonomy" ADD CONSTRAINT "skill_taxonomy_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "skill_taxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_taxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_reviews" ADD CONSTRAINT "cv_reviews_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdi_plans" ADD CONSTRAINT "pdi_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdi_nodes" ADD CONSTRAINT "pdi_nodes_pdi_plan_id_fkey" FOREIGN KEY ("pdi_plan_id") REFERENCES "pdi_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdi_nodes" ADD CONSTRAINT "pdi_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pdi_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_xp" ADD CONSTRAINT "user_xp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_rankings" ADD CONSTRAINT "league_rankings_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_rankings" ADD CONSTRAINT "league_rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_prizes" ADD CONSTRAINT "hackathon_prizes_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_teams" ADD CONSTRAINT "hackathon_teams_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "hackathon_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "hackathon_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_scores" ADD CONSTRAINT "hackathon_scores_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "hackathon_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_ebook_id_fkey" FOREIGN KEY ("ebook_id") REFERENCES "Ebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
