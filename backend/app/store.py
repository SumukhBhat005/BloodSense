"""
In-memory & Supabase hybrid store module.
Ensures zero network-error crashes by falling back to fast in-memory storage
when Supabase connectivity fails or is unavailable.
"""
import logging
import uuid
from typing import Optional
from app.database import get_db

logger = logging.getLogger(__name__)

# Local in-memory fallback cache
LOCAL_REPORTS: dict[str, dict] = {}
LOCAL_BIOMARKERS: dict[str, list[dict]] = {}
LOCAL_SUMMARIES: dict[str, dict] = {}


def save_report(report: dict) -> None:
    report_id = report["id"]
    LOCAL_REPORTS[report_id] = report
    try:
        db = get_db()
        db.table("reports").insert(report).execute()
    except Exception as e:
        logger.warning(f"Supabase save_report failed (using local store fallback): {e}")


def update_report(report_id: str, updates: dict) -> None:
    if report_id in LOCAL_REPORTS:
        LOCAL_REPORTS[report_id].update(updates)
    try:
        db = get_db()
        db.table("reports").update(updates).eq("id", report_id).execute()
    except Exception as e:
        logger.warning(f"Supabase update_report failed (using local store fallback): {e}")


def get_report_by_id(report_id: str) -> Optional[dict]:
    try:
        db = get_db()
        res = db.table("reports").select("*").eq("id", report_id).maybe_single().execute()
        if res and res.data:
            LOCAL_REPORTS[report_id] = res.data
            return res.data
    except Exception as e:
        logger.warning(f"Supabase get_report_by_id failed (using local store fallback): {e}")

    return LOCAL_REPORTS.get(report_id)


def list_all_reports() -> list[dict]:
    try:
        db = get_db()
        res = db.table("reports").select("id, file_name, status, lab_name, report_date, report_type, created_at").order("created_at", desc=True).execute()
        if res and res.data:
            return res.data
    except Exception as e:
        logger.warning(f"Supabase list_all_reports failed (using local store fallback): {e}")

    return sorted(list(LOCAL_REPORTS.values()), key=lambda r: r.get("created_at", ""), reverse=True)


def delete_report_by_id(report_id: str) -> None:
    LOCAL_REPORTS.pop(report_id, None)
    LOCAL_BIOMARKERS.pop(report_id, None)
    LOCAL_SUMMARIES.pop(report_id, None)
    try:
        db = get_db()
        db.table("reports").delete().eq("id", report_id).execute()
    except Exception as e:
        logger.warning(f"Supabase delete_report_by_id failed (using local store fallback): {e}")


def save_biomarker_rows(report_id: str, rows: list[dict]) -> None:
    LOCAL_BIOMARKERS[report_id] = rows
    try:
        db = get_db()
        db.table("biomarkers").insert(rows).execute()
    except Exception as e:
        logger.warning(f"Supabase save_biomarker_rows failed (using local store fallback): {e}")


def get_biomarker_rows(report_id: str) -> list[dict]:
    try:
        db = get_db()
        res = db.table("biomarkers").select("*").eq("report_id", report_id).order("severity", desc=True).execute()
        if res and res.data and len(res.data) > 0:
            LOCAL_BIOMARKERS[report_id] = res.data
            return res.data
    except Exception as e:
        logger.warning(f"Supabase get_biomarker_rows failed (using local store fallback): {e}")

    return LOCAL_BIOMARKERS.get(report_id, [])


def save_summary_data(report_id: str, summary: dict) -> None:
    LOCAL_SUMMARIES[report_id] = summary
    try:
        db = get_db()
        db.table("summaries").insert(summary).execute()
    except Exception as e:
        logger.warning(f"Supabase save_summary_data failed (using local store fallback): {e}")


def get_summary_data(report_id: str) -> Optional[dict]:
    try:
        db = get_db()
        res = db.table("summaries").select("*").eq("report_id", report_id).maybe_single().execute()
        if res and res.data:
            LOCAL_SUMMARIES[report_id] = res.data
            return res.data
    except Exception as e:
        logger.warning(f"Supabase get_summary_data failed (using local store fallback): {e}")

    return LOCAL_SUMMARIES.get(report_id)
