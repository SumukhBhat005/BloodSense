"""
Gemini explainer — generates patient-friendly explanations from structured analysis results.
Input is structured JSON only. No raw report text is sent to Gemini.
"""
import logging
import json
import google.generativeai as genai
from app.config import get_settings
from app.schemas import BiomarkerResult, RiskFlag, SummaryOut, QualitativeResult
from typing import Optional

logger = logging.getLogger(__name__)

EXPLANATION_PROMPT_TEMPLATE = """You are a health literacy assistant explaining lab results to a patient in simple, plain English.

Patient profile: {age}-year-old {sex}.
Report type: {report_type}

Lab results (pre-analyzed by a deterministic system — statuses are already computed):
{biomarker_json}

{qualitative_section}

Informational pattern flags (for context only):
{risk_flags_json}

Write a response with EXACTLY these three sections using these exact headers:

**Summary**
(2-3 sentences giving the overall picture. Be warm and reassuring where appropriate. Mention the report type, e.g. "This Complete Blood Count report shows...". EXPLICITLY MENTION WHICH ALL PARAMETERS ARE ABNORMAL in this section.)

**Abnormal Findings**
(Bullet list of values outside the normal range. Describe what each test measures in plain English. Never use the word "diagnosis". If there are qualitative findings like Blood Group or Urine findings, mention them here too.)

**Lifestyle Considerations**
(2-3 general wellness tips — not prescriptions. Focus on universally healthy habits relevant to the type of test taken.)

Strict rules — violation is not acceptable:
- Maximum 250 words total
- NEVER diagnose any condition or disease
- NEVER recommend or mention any specific medication
- NEVER tell the patient to stop or change medication
- Use simple words — no medical jargon
- If all values are normal, say so warmly and keep it brief
- End with: "Remember, only your doctor can interpret these results in the context of your full health history."
"""


def _configure_gemini():
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)


def _build_biomarker_summary(biomarkers: list[BiomarkerResult]) -> list[dict]:
    return [
        {
            "name": b.display_name,
            "value": b.value,
            "unit": b.unit,
            "status": b.status,
            "reference_range": f"{b.reference_min}–{b.reference_max}"
            if b.reference_min is not None and b.reference_max is not None
            else "see report",
        }
        for b in biomarkers
    ]


def _parse_sections(text: str) -> tuple[str, str, str, str]:
    """Extract the four sections from Gemini's response robustly."""
    import re

    def extract(keywords: list[str]) -> str:
        pattern = rf"(?:(?:\*\*|###?|#)\s*(?:{'|'.join(re.escape(k) for k in keywords)})\s*(?:\*\*|:)?)(.*?)(?=(?:(?:\*\*|###?|#)\s*(?:Summary|Abnormal|Questions|Lifestyle|Remember))|\Z)"
        m = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        return m.group(1).strip() if m else ""

    summary = extract(["Summary", "Overall Picture", "Overview"])
    abnormal = extract(["Abnormal Findings", "Abnormal Results", "Out of Range Findings", "Abnormal"])
    questions = extract(["Questions To Discuss With Your Doctor", "Questions for Your Doctor", "Doctor Questions", "Questions"])
    lifestyle = extract(["Lifestyle Considerations", "Lifestyle & Wellness Tips", "Lifestyle Tips", "Lifestyle"])

    # Fallback: if section parsing returned nothing, supply full response to summary
    if not summary and not abnormal and not questions and not lifestyle:
        summary = text.strip()

    return summary, abnormal, questions, lifestyle


def _build_deterministic_explanation(
    biomarkers: list[BiomarkerResult],
    risk_flags: list[RiskFlag],
    age: int,
    sex: str,
    report_type: Optional[str] = None,
) -> tuple[str, str, str, str]:
    # Exclude UNKNOWN-status fields (e.g. doctor names, facility info) from all counts
    classified = [b for b in biomarkers if b.status != "UNKNOWN"]
    abnormal = [b for b in classified if not b.is_qualitative and b.status not in ("NORMAL", "INFORMATIONAL")]
    rpt_name = report_type or "Blood Test"

    if not abnormal:
        summary = f"This {rpt_name} report has been analyzed for a {age}-year-old {sex}. All {len(classified)} parameters evaluated are within standard reference ranges."
        abnormal_text = "All biomarker values are within normal reference limits."
        questions = ""
        lifestyle = "• Continue maintaining a balanced, nutrient-dense diet and stay well hydrated.\n• Maintain regular physical activity and routine health checkups."
        return summary, abnormal_text, questions, lifestyle

    abnormal_names = ", ".join([b.display_name for b in abnormal])
    summary = f"This {rpt_name} report for a {age}-year-old {sex} has {len(abnormal)} parameter(s) outside standard reference ranges out of {len(classified)} total tests evaluated. The abnormal parameters are: {abnormal_names}."
    
    abnormal_lines = []
    for b in abnormal:
        val_str = f"{b.value} {b.unit}" if b.unit else str(b.value)
        abnormal_lines.append(f"• **{b.display_name}**: {val_str} (Status: {b.status.title()})")
    
    if risk_flags:
        for rf in risk_flags:
            abnormal_lines.append(f"• **{rf.label}**: {rf.description}")

    abnormal_text = "\n".join(abnormal_lines)

    questions = ""

    lifestyle = "• Focus on a balanced diet tailored to your specific biomarker needs and stay hydrated.\n• Avoid starting new supplements without consulting your doctor.\n• Schedule a follow-up consultation with your healthcare provider to review these results."

    return summary, abnormal_text, questions, lifestyle


async def generate_explanation(
    biomarkers: list[BiomarkerResult],
    risk_flags: list[RiskFlag],
    age: int,
    sex: str,
    report_type: Optional[str] = None,
    qualitative_results: Optional[list[QualitativeResult]] = None,
) -> tuple[str, str, str, str]:
    """
    Generate a patient-friendly explanation from structured biomarker data.
    Returns (summary, abnormal_findings, questions, lifestyle).
    Falls back gracefully to a deterministic explainer if Gemini is unavailable.
    """
    _configure_gemini()

    # Exclude UNKNOWN-status fields before sending to Gemini so counts match the UI
    classified_biomarkers = [b for b in biomarkers if b.status != "UNKNOWN"]
    biomarker_data = _build_biomarker_summary(classified_biomarkers)
    risk_data = [{"label": f.label, "description": f.description} for f in risk_flags]

    # Build qualitative section if present
    qualitative_section = ""
    if qualitative_results:
        qual_data = [{"name": qr.name, "value": qr.value, "category": qr.category} for qr in qualitative_results]
        qualitative_section = f"Qualitative / Non-numeric findings:\n{json.dumps(qual_data, indent=2)}"
    else:
        qualitative_section = "Qualitative / Non-numeric findings: None"

    prompt = EXPLANATION_PROMPT_TEMPLATE.format(
        age=age,
        sex=sex,
        report_type=report_type or "General Lab Report",
        biomarker_json=json.dumps(biomarker_data, indent=2),
        qualitative_section=qualitative_section,
        risk_flags_json=json.dumps(risk_data, indent=2) if risk_data else "None",
    )

    try:
        response = None
        last_err = None
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]:
            try:
                model = genai.GenerativeModel(model_name)
                res = model.generate_content(prompt)
                if res and res.text:
                    response = res
                    break
            except Exception as err:
                last_err = err
                logger.warning(f"Gemini explainer model {model_name} failed: {err}")
                continue

        if not response or not response.text:
            raise last_err or RuntimeError("All Gemini explainer models failed.")

        text = response.text
        return _parse_sections(text)
    except Exception as e:
        logger.warning(f"Gemini explanation unavailable ({e}), using smart deterministic explainer fallback.")
        return _build_deterministic_explanation(biomarkers, risk_flags, age, sex, report_type)
