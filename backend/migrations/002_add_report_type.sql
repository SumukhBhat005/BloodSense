-- Blood Report Analyzer — Migration 002
-- Adds report_type column and qualitative biomarker support
-- Run this in the Supabase SQL Editor

-- ── Add report_type to reports ────────────────────────────────
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type TEXT;

-- ── Add qualitative biomarker support ─────────────────────────
ALTER TABLE biomarkers ADD COLUMN IF NOT EXISTS is_qualitative BOOLEAN DEFAULT false;
ALTER TABLE biomarkers ADD COLUMN IF NOT EXISTS qualitative_value TEXT;

-- Allow NULL value for qualitative biomarkers (e.g., Blood Group: "A+")
ALTER TABLE biomarkers ALTER COLUMN value DROP NOT NULL;
ALTER TABLE biomarkers ALTER COLUMN value_normalized DROP NOT NULL;

-- ── Update reports list query to include report_type ──────────
-- No structural change needed — the column is automatically available

-- ── Index for report_type lookups ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
