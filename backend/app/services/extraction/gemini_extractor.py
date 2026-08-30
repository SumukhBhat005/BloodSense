"""
Gemini Vision extractor — primary extraction engine.
Sends lab report images to Gemini 2.5 Flash for structured JSON extraction.
"""
import json
import re
import logging
from typing import Optional

import google.generativeai as genai
from PIL import Image
import io

from app.config import get_settings
from app.schemas import ExtractedBiomarker, ExtractionResult, QualitativeResult

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are a precise medical data extraction system analyzing a lab report image from an Indian diagnostic lab.

Extract ALL biomarker/test values visible in this image and return ONLY valid JSON.

This system supports these report types — identify which one(s) you see:
- CBC / CBP (Complete Blood Count / Complete Blood Picture): Hemoglobin, RBC, WBC, Platelets, Hematocrit/PCV, MCV, MCH, MCHC, RDW, MPV, PDW, P-LCR, PCT, ESR, and Differential counts (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils — both % and absolute counts)
- FBS / PPBS (Fasting / Post Prandial Blood Sugar)
- HbA1c
- RFT (Renal Function Test): Blood Urea, BUN, Creatinine, Uric Acid, eGFR, BUN/Creatinine Ratio
- LFT (Liver Function Test): Total Bilirubin, Direct Bilirubin, Indirect Bilirubin, SGOT/AST, SGPT/ALT, ALP, GGT, Total Protein, Albumin, Globulin, A/G Ratio
- LPT / Lipid Profile: Total Cholesterol, HDL, LDL, VLDL, Triglycerides, LDL/HDL Ratio, TC/HDL Ratio
- Iron Profile: Serum Iron, TIBC, UIBC, Transferrin Saturation, Ferritin
- Electrolytes: Sodium, Potassium, Chloride, Calcium, Magnesium, Phosphorus, Bicarbonate
- Vitamin B12, Vitamin D (25-Hydroxy)
- B-HCG (Beta-HCG pregnancy test)
- Blood Group (ABO + Rh typing)
- Complete Urine Analysis: pH, Specific Gravity, Protein, Glucose, RBC, WBC/Pus Cells, Epithelial Cells, Casts, Crystals, Bacteria, Color, Appearance
- Urine Culture: Organism, Colony Count, Antibiotic Sensitivity
- Peripheral Smear: RBC morphology, WBC morphology, Platelet morphology
- Digital X-Ray: Findings, Impression
- Echocardiography: LVEF, chambers, valves, findings
- USG Abdomen / Pelvis: Organ findings, impressions
- Histopathology: Gross, Microscopy, Diagnosis

Required JSON schema:
{
  "report_type": "string identifying the test panel (e.g. 'CBC', 'LFT', 'RFT', 'Lipid Profile', 'Iron Profile', 'Complete Urine Analysis', 'Blood Group', 'Digital X-Ray', etc.)",
  "lab_name": "string or null",
  "report_date": "YYYY-MM-DD string or null",
  "biomarkers": [
    {
      "name": "exact test name as written in the report",
      "value": numeric_value_as_number_or_null,
      "unit": "unit string exactly as shown",
      "reference_range": "e.g. 4.0-10.0 or <5.7 or null"
    }
  ],
  "qualitative_results": [
    {
      "name": "test name (e.g. Blood Group, Urine Color, Urine Appearance, Urine Protein, Bacteria, RBC Morphology)",
      "value": "the text result (e.g. A+, Positive, Straw Yellow, Clear, Nil, No Growth, Normocytic Normochromic)",
      "category": "category string (e.g. Blood Typing, Urine Physical, Urine Chemical, Urine Microscopy, Urine Culture, Peripheral Smear, Imaging, Histopathology)"
    }
  ]
}

Strict rules:
1. Extract ONLY values that are explicitly written — do NOT infer or hallucinate values
2. For NUMERIC values (numbers), put them in the "biomarkers" array with the numeric value
3. For NON-NUMERIC / QUALITATIVE values (e.g. "Positive", "Negative", "Reactive", "A+", "B-", "Straw Yellow", "Clear", "Nil", "No Growth", morphology descriptions), put them in the "qualitative_results" array
4. When a test shows BOTH a numeric count AND a qualitative result (e.g. Urine Protein: "Trace" or "1+"), put it in qualitative_results
5. For Indian lab reports: handle units like "lakh/cumm" (= ×10⁵/µL), "thou/cumm" (= ×10³/µL), "cells/cumm" (= cells/µL), "mill/cumm" (= ×10⁶/µL). Convert them to standard values: e.g. "1.5 lakh/cumm" = 150 with unit "×10³/µL"
6. Extract ALL sub-parameters within panels (e.g., ALL differential counts in CBC, ALL parameters in LFT/RFT)
7. Do NOT interpret or analyze values — only extract exactly what is written
8. Include the reference range ONLY if explicitly shown next to the test
9. Return empty arrays if no values are found
10. Do NOT add any explanation, markdown, or text outside the JSON
11. Ensure the output is valid parseable JSON only
12. For imaging reports (X-Ray, Echo, USG) and Histopathology: extract key findings and impressions as qualitative_results"""


def _configure_gemini():
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)


def _image_bytes_to_pil(img_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(img_bytes))


def _clean_gemini_json_response(text: str) -> str:
    """Strip markdown code fences if present."""
    text = text.strip()
    if text.startswith("```"):
        # Remove ```json or ``` fences
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _normalize_indian_units(value: float, unit: str) -> tuple[float, str]:
    """Normalize Indian lab report units to international standard."""
    unit_lower = unit.strip().lower()

    # lakh/cumm → ×10³/µL (value in lakhs × 100 = thousands)
    if unit_lower in ("lakh/cumm", "lakhs/cumm", "lakh/cu.mm", "lac/cumm"):
        return round(value * 100, 2), "×10³/µL"

    # thou/cumm → ×10³/µL
    if unit_lower in ("thou/cumm", "thousand/cumm", "thou/cu.mm", "x10^3/ul", "x10³/ul"):
        return value, "×10³/µL"

    # mill/cumm → ×10⁶/µL
    if unit_lower in ("mill/cumm", "million/cumm", "mill/cu.mm", "x10^6/ul", "x10⁶/ul"):
        return value, "×10⁶/µL"

    # cells/cumm → cells/µL
    if unit_lower in ("cells/cumm", "cells/cu.mm", "/cumm", "/cu.mm"):
        return value, "cells/µL"

    # gm/dl → g/dL
    if unit_lower in ("gm/dl", "gms/dl", "gm%"):
        return value, "g/dL"

    return value, unit


async def extract_with_gemini(
    images: list[bytes],
    pdf_text: str = "",
) -> ExtractionResult:
    """
    Send lab report images to Gemini Vision for structured extraction.
    Falls back gracefully if Gemini fails.
    """
    _configure_gemini()

    try:
        # Build content parts — include all page images
        content_parts = [EXTRACTION_PROMPT]

        pil_images = [_image_bytes_to_pil(img) for img in images]
        content_parts.extend(pil_images)

        # If we have embedded PDF text, provide it as supplemental context
        if pdf_text.strip():
            content_parts.append(
                f"\n\nAdditional context — embedded text from PDF:\n{pdf_text[:3000]}"
            )

        response = None
        last_err = None
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(content_parts)
                if response and response.text:
                    break
            except Exception as err:
                last_err = err
                logger.warning(f"Gemini model {model_name} failed: {err}")
                continue

        if not response or not response.text:
            raise last_err or RuntimeError("All Gemini models failed to generate response.")

        raw_text = response.text

        cleaned = _clean_gemini_json_response(raw_text)
        data = json.loads(cleaned)

        biomarkers = []
        for item in data.get("biomarkers", []):
            try:
                val = item.get("value")
                unit = str(item.get("unit", "")).strip()
                name = str(item.get("name", "")).strip()

                if val is None or not isinstance(val, (int, float)):
                    # If there's a non-numeric value, add to qualitative instead
                    if val is not None and isinstance(val, str) and val.strip():
                        # Will be handled via qualitative_results below
                        continue
                    continue

                # Normalize Indian lab units
                norm_val, norm_unit = _normalize_indian_units(float(val), unit)

                biomarkers.append(
                    ExtractedBiomarker(
                        name=name,
                        value=norm_val,
                        unit=norm_unit,
                        reference_range=item.get("reference_range"),
                    )
                )
            except Exception as e:
                logger.warning(f"Skipping malformed biomarker item: {item}, error: {e}")

        # Parse qualitative results
        qualitative_results = []
        for item in data.get("qualitative_results", []):
            try:
                name = str(item.get("name", "")).strip()
                value = str(item.get("value", "")).strip()
                category = item.get("category")

                if name and value:
                    qualitative_results.append(
                        QualitativeResult(
                            name=name,
                            value=value,
                            category=category,
                        )
                    )
            except Exception as e:
                logger.warning(f"Skipping malformed qualitative item: {item}, error: {e}")

        # Build raw text for storage from PDF text or a summary
        raw_text_for_storage = pdf_text or f"Extracted {len(biomarkers)} biomarkers, {len(qualitative_results)} qualitative results via Gemini Vision"

        return ExtractionResult(
            lab_name=data.get("lab_name"),
            report_date=data.get("report_date"),
            report_type=data.get("report_type"),
            biomarkers=biomarkers,
            qualitative_results=qualitative_results,
            raw_text=raw_text_for_storage[:10000],  # cap storage
            extraction_method="gemini_vision",
            confidence=0.95 if (biomarkers or qualitative_results) else 0.2,
        )

    except json.JSONDecodeError as e:
        logger.error(f"Gemini returned invalid JSON: {e}")
        raise ValueError(f"Gemini extraction returned non-JSON response: {e}")
    except Exception as e:
        logger.error(f"Gemini extraction failed: {e}")
        raise
