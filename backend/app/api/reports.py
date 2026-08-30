"""
Reports API — upload, retrieve, list, and delete reports.
Supports guest/anonymous uploads per-session (no mandatory sign-in required).
Uses in-memory fallback store to ensure zero 500 Network Errors.
"""
import uuid
import json
import bleach
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Request

from app.config import get_settings
from app.schemas import (
    ReportUploadResponse, ReportDetail, ReportListItem,
    BiomarkerResult, SummaryOut, RiskFlag, BiomarkerUpdate,
    ExtractedBiomarker,
)
from app.services.pipeline import run_pipeline
from app.services.analysis.severity_classifier import classify_biomarker
from app import store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])

MAGIC_BYTES = {
    b"%PDF": "pdf",
    b"\xff\xd8\xff": "image",
    b"\x89PNG": "image",
}

GUEST_USER_ID = "00000000-0000-0000-0000-000000000000"


def _validate_file(file_bytes: bytes, filename: str) -> str:
    """Validate file by magic bytes. Returns 'pdf' or 'image'."""
    settings = get_settings()

    if len(file_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_file_size_mb} MB limit.",
        )

    for magic, ftype in MAGIC_BYTES.items():
        if file_bytes.startswith(magic):
            return ftype

    raise HTTPException(
        status_code=415,
        detail="Unsupported file type. Only PDF, JPG, and PNG are accepted.",
    )


@router.post("/upload", response_model=ReportUploadResponse)
async def upload_report(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    age: int = Form(30),
    sex: str = Form("other"),
    weight: Optional[float] = Form(None),
    height: Optional[float] = Form(None),
):
    """
    Upload a report for analysis.
    Accepts patient demographics (age, sex, weight, height) directly per session.
    No mandatory sign-in required.
    """
    file_bytes = await file.read()
    file_type = _validate_file(file_bytes, file.filename or "upload")

    report_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    report_data = {
        "id": report_id,
        "user_id": GUEST_USER_ID,
        "file_name": bleach.clean(file.filename or "upload"),
        "file_url": "",
        "file_type": file_type,
        "status": "pending",
        "created_at": now_iso,
    }

    # Save to store (Supabase + local fallback)
    store.save_report(report_data)

    # Kick off background processing with per-session demographics
    background_tasks.add_task(
        run_pipeline,
        report_id=report_id,
        file_bytes=file_bytes,
        file_type=file_type,
        user_id=GUEST_USER_ID,
        user_age=age,
        user_sex=sex,
    )

    return ReportUploadResponse(
        report_id=uuid.UUID(report_id),
        status="pending",
        message="Report uploaded successfully. Processing has started.",
    )


@router.get("", response_model=list[ReportListItem])
async def list_reports(request: Request):
    reports_data = store.list_all_reports()

    items = []
    for r in reports_data:
        summary_data = store.get_summary_data(r["id"])
        items.append(
            ReportListItem(
                id=r["id"],
                file_name=r["file_name"],
                status=r["status"],
                lab_name=r.get("lab_name"),
                report_date=r.get("report_date"),
                report_type=r.get("report_type"),
                overall_status=summary_data.get("overall_status") if summary_data else None,
                created_at=r["created_at"],
            )
        )
    return items


@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(report_id: str, request: Request):
    report_data = store.get_report_by_id(report_id)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")

    biomarker_rows = store.get_biomarker_rows(report_id)
    summary_data = store.get_summary_data(report_id)

    biomarkers = [BiomarkerResult(**b) for b in biomarker_rows]
    summary = None
    if summary_data:
        s = summary_data
        raw_flags = s.get("risk_flags", "[]")
        flags = json.loads(raw_flags) if isinstance(raw_flags, str) else raw_flags
        summary = SummaryOut(
            overall_status=s["overall_status"],
            risk_flags=[RiskFlag(**f) for f in flags],
            gemini_summary=s["gemini_summary"],
            gemini_abnormal=s["gemini_abnormal"],
            gemini_questions=s["gemini_questions"],
            gemini_lifestyle=s["gemini_lifestyle"],
        )

    return ReportDetail(**report_data, biomarkers=biomarkers, summary=summary)


@router.delete("/{report_id}", status_code=204)
async def delete_report(report_id: str, request: Request):
    store.delete_report_by_id(report_id)
    return None


@router.patch("/{report_id}/biomarkers/{biomarker_id}", response_model=BiomarkerResult)
async def update_biomarker(
    report_id: str,
    biomarker_id: str,
    update: BiomarkerUpdate,
    request: Request,
):
    """Allow users to correct extracted biomarker values before final analysis."""
    report_data = store.get_report_by_id(report_id)
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")
    if report_data["status"] == "processing":
        raise HTTPException(status_code=409, detail="Cannot edit while report is processing")

    rows = store.get_biomarker_rows(report_id)
    target = next((b for b in rows if b["id"] == biomarker_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Biomarker not found")

    extracted = ExtractedBiomarker(
        name=target["canonical_name"],
        value=update.value,
        unit=update.unit,
        reference_range=update.reference_range,
    )

    reclassified = classify_biomarker(extracted, sex="other", age=30)
    if not reclassified:
        raise HTTPException(status_code=422, detail="Could not reclassify biomarker with given values")

    target.update({
        "value": reclassified.value,
        "unit": reclassified.unit,
        "value_normalized": reclassified.value_normalized,
        "unit_normalized": reclassified.unit_normalized,
        "reference_min": reclassified.reference_min,
        "reference_max": reclassified.reference_max,
        "reference_source": reclassified.reference_source,
        "status": reclassified.status,
        "severity": reclassified.severity,
    })

    store.save_biomarker_rows(report_id, rows)
    return BiomarkerResult(**target)
