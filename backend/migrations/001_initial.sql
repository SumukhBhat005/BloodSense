-- Blood Report Analyzer — Supabase SQL Migration
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY,  -- matches Supabase auth.users.id
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    age         INTEGER NOT NULL CHECK (age > 0 AND age < 130),
    sex         TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"   ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- ─── Reports ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    file_name         TEXT NOT NULL,
    file_url          TEXT NOT NULL DEFAULT '',
    file_type         TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
    status            TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    lab_name          TEXT,
    report_date       DATE,
    raw_text          TEXT,
    processing_error  TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reports" ON reports FOR ALL USING (auth.uid() = user_id);

-- ─── Biomarkers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS biomarkers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id         UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    canonical_name    TEXT NOT NULL,
    display_name      TEXT NOT NULL,
    value             NUMERIC NOT NULL,
    unit              TEXT NOT NULL,
    value_normalized  NUMERIC NOT NULL,
    unit_normalized   TEXT NOT NULL,
    reference_min     NUMERIC,
    reference_max     NUMERIC,
    reference_source  TEXT NOT NULL DEFAULT 'builtin' CHECK (reference_source IN ('report', 'builtin')),
    status            TEXT NOT NULL,
    severity          INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE biomarkers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own biomarkers" ON biomarkers FOR ALL USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_biomarkers_report_id ON biomarkers(report_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_canonical_name ON biomarkers(canonical_name);

-- ─── Summaries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS summaries (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id         UUID UNIQUE REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    overall_status    TEXT NOT NULL CHECK (overall_status IN ('normal', 'attention', 'urgent')),
    risk_flags        JSONB DEFAULT '[]',
    gemini_summary    TEXT NOT NULL DEFAULT '',
    gemini_abnormal   TEXT NOT NULL DEFAULT '',
    gemini_questions  TEXT NOT NULL DEFAULT '',
    gemini_lifestyle  TEXT NOT NULL DEFAULT '',
    model_version     TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own summaries" ON summaries FOR ALL USING (auth.uid() = user_id);

-- ─── Trend Snapshots ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trend_snapshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    canonical_name    TEXT NOT NULL,
    report_id         UUID REFERENCES reports(id) ON DELETE CASCADE,
    report_date       DATE NOT NULL,
    value_normalized  NUMERIC NOT NULL,
    unit_normalized   TEXT NOT NULL,
    status            TEXT NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trend_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trends" ON trend_snapshots FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trends_user_biomarker ON trend_snapshots(user_id, canonical_name);
CREATE INDEX IF NOT EXISTS idx_trends_report_date ON trend_snapshots(report_date);

-- ─── Supabase Storage Bucket ──────────────────────────────────
-- Run this separately or via Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);
-- CREATE POLICY "Users can upload own reports" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can read own reports" ON storage.objects FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own reports" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
