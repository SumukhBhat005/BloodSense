"""
Full processing pipeline — orchestrates extraction → analysis → explanation.
Called as a FastAPI BackgroundTask after upload.
Uses app.store for seamless local + DB persistence.
"""
import logging
import uuid
from datetime import datetime

from app.config import get_settings
from app.schemas import ExtractionResult, BiomarkerResult, QualitativeResult
from app.services.extraction.pdf_renderer import pdf_to_images, get_pdf_text
from app.services.extraction.gemini_extractor import extract_with_gemini
from app.services.extraction.tesseract_fallback import extract_with_tesseract
from app.services.analysis.severity_classifier import classify_all
from app.services.analysis.risk_engine import evaluate_risk_rules, compute_overall_status
from app.services.explanation.gemini_explainer import generate_explanation
from app import store

logger = logging.getLogger(__name__)


async def run_pipeline(
    report_id: str,
    file_bytes: bytes,
    file_type: str,  # "pdf" or "image"
    user_id: str,
    user_age: int,
    user_sex: str,
):
    """
    Full async pipeline triggered after file upload.
    Updates report status at each stage.
    """
    def update_status(status: str, error: str = None):
        payload = {"status": status}
        if error:
            payload["processing_error"] = error[:500]
        store.update_report(report_id, payload)

    try:
        update_status("processing")

        # ── Stage 1: Render to images ──────────────────────────────
        if file_type == "pdf":
            images = pdf_to_images(file_bytes)
            pdf_text = get_pdf_text(file_bytes)
        else:
            images = [file_bytes]
            pdf_text = ""

        # ── Stage 2: Extract biomarkers ────────────────────────────
        try:
            extraction: ExtractionResult = await extract_with_gemini(images, pdf_text)
        except Exception as gemini_err:
            logger.warning(f"Gemini failed, falling back to text/OCR extraction: {gemini_err}")
            extraction = extract_with_tesseract(images, pdf_text=pdf_text)

        # Store raw text, lab metadata, and report type
        report_update = {
            "raw_text": extraction.raw_text,
            "lab_name": extraction.lab_name,
            "report_date": extraction.report_date,
        }
        if extraction.report_type:
            report_update["report_type"] = extraction.report_type
        store.update_report(report_id, report_update)

        if not extraction.biomarkers and not extraction.qualitative_results:
            update_status("failed", "No biomarker values could be extracted from this report.")
            return

        # ── Stage 3: Classify biomarkers ───────────────────────────
        classified: list[BiomarkerResult] = classify_all(extraction.biomarkers, sex=user_sex, age=user_age)

        # ── Stage 3b: Store qualitative results as informational biomarkers ──
        qualitative_biomarkers: list[BiomarkerResult] = []
        for qr in extraction.qualitative_results:
            qualitative_biomarkers.append(
                BiomarkerResult(
                    canonical_name=qr.name.lower().replace(" ", "_"),
                    display_name=qr.name,
                    value=None,
                    unit="",
                    value_normalized=None,
                    unit_normalized="",
                    reference_min=None,
                    reference_max=None,
                    reference_source="report",
                    status="INFORMATIONAL",
                    severity=-1,
                    is_qualitative=True,
                    qualitative_value=qr.value,
                )
            )

        all_biomarkers = classified + qualitative_biomarkers

        if not all_biomarkers:
            update_status("failed", "Biomarkers were found but could not be matched to known tests.")
            return

        # ── Stage 4: Store biomarkers ──────────────────────────────
        biomarker_rows = []
        for b in all_biomarkers:
            row = {
                "id": str(uuid.uuid4()),
                "report_id": report_id,
                "user_id": user_id,
                "canonical_name": b.canonical_name,
                "display_name": b.display_name,
                "value": b.value,
                "unit": b.unit,
                "value_normalized": b.value_normalized,
                "unit_normalized": b.unit_normalized,
                "reference_min": b.reference_min,
                "reference_max": b.reference_max,
                "reference_source": b.reference_source,
                "status": b.status,
                "severity": b.severity,
                "is_qualitative": b.is_qualitative,
                "qualitative_value": b.qualitative_value,
            }
            biomarker_rows.append(row)

        store.save_biomarker_rows(report_id, biomarker_rows)

        # ── Stage 5: Risk evaluation ───────────────────────────────
        risk_flags = evaluate_risk_rules(classified)
        overall_status = compute_overall_status(classified, risk_flags)

        # ── Stage 6: Gemini explanation ────────────────────────────
        summary, abnormal, questions, lifestyle = await generate_explanation(
            classified, risk_flags, user_age, user_sex,
            report_type=extraction.report_type,
            qualitative_results=extraction.qualitative_results,
        )

        # ── Stage 7: Store summary ─────────────────────────────────
        import json
        summary_data = {
            "id": str(uuid.uuid4()),
            "report_id": report_id,
            "user_id": user_id,
            "overall_status": overall_status,
            "risk_flags": json.dumps([f.model_dump() for f in risk_flags]),
            "gemini_summary": summary,
            "gemini_abnormal": abnormal,
            "gemini_questions": questions,
            "gemini_lifestyle": lifestyle,
            "model_version": "gemini-2.0-flash",
        }
        store.save_summary_data(report_id, summary_data)

        update_status("completed")
        logger.info(
            f"Pipeline completed for report {report_id}: "
            f"{len(classified)} numeric + {len(qualitative_biomarkers)} qualitative biomarkers"
        )

    except Exception as e:
        logger.exception(f"Pipeline failed for report {report_id}: {e}")
        update_status("failed", str(e))
