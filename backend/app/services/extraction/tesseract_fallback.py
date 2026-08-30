"""
Tesseract OCR fallback — used when Gemini Vision is unavailable.
"""
import re
import logging

from app.config import get_settings
from app.schemas import ExtractedBiomarker, ExtractionResult

logger = logging.getLogger(__name__)

# Pattern to match lines like: "Test Name   145   mg/dL   100-200"
# Enhanced to handle Indian lab formats: commas in numbers, varied units
BIOMARKER_PATTERN = re.compile(
    r"([A-Za-z][A-Za-z0-9\s\(\)\-/\.\,%]+?)\s+"    # test name
    r"([\d,]+\.?\d*)\s+"                              # numeric value (with possible commas)
    r"([a-zA-Z/%µ×⁶³¹⁰\.\-/]+(?:/[a-zA-Z\.\s]+)?)"  # unit (expanded for cumm, HPF, etc.)
    r"(?:\s+([\d\.\-<>]+(?:\s*[-–]\s*[\d\.]+)?))?"     # optional ref range
)

# Pattern for Indian lab units like "cells/cumm", "lakh/cumm"
INDIAN_UNIT_PATTERN = re.compile(
    r"([A-Za-z][A-Za-z0-9\s\(\)\-/\.\,%]+?)\s+"    # test name
    r"([\d,]+\.?\d*)\s+"                              # numeric value
    r"((?:lakh|thou|mill|cells|x10\^?\d)/(?:cumm|cu\.?\s*mm|[uµ]L))" # Indian-style unit
    r"(?:\s+([\d\.\-<>]+(?:\s*[-–]\s*[\d\.]+)?))?"     # optional ref range
)


def _try_import_tesseract() -> bool:
    try:
        import pytesseract
        settings = get_settings()
        if settings.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
        return True
    except ImportError:
        return False


def _normalize_indian_value(value_str: str, unit: str) -> tuple[float, str]:
    """Clean commas from numbers and normalize Indian lab units."""
    # Remove commas from numbers (e.g., "10,000" → "10000")
    clean_val = value_str.replace(",", "")
    value = float(clean_val)

    unit_lower = unit.strip().lower()

    # lakh/cumm → ×10³/µL
    if "lakh" in unit_lower:
        return round(value * 100, 2), "×10³/µL"

    # thou/cumm → ×10³/µL
    if "thou" in unit_lower:
        return value, "×10³/µL"

    # mill/cumm → ×10⁶/µL
    if "mill" in unit_lower:
        return value, "×10⁶/µL"

    # cells/cumm → cells/µL
    if "cumm" in unit_lower or "cu.mm" in unit_lower or "cu mm" in unit_lower:
        return value, "cells/µL"

    return value, unit


def extract_with_tesseract(images: list[bytes], pdf_text: str = "") -> ExtractionResult:
    """
    Fallback OCR using regex text parsing / Tesseract.
    """
    full_text = pdf_text or ""
    if not full_text and _try_import_tesseract():
        try:
            import pytesseract
            from PIL import Image
            import io

            all_text_parts = []
            for img_bytes in images:
                pil_img = Image.open(io.BytesIO(img_bytes))
                text = pytesseract.image_to_string(pil_img, config="--psm 6")
                all_text_parts.append(text)
            full_text = "\n".join(all_text_parts)
        except Exception as e:
            logger.warning(f"Tesseract OCR failed: {e}")

    biomarkers = _parse_text_for_biomarkers(full_text)

    return ExtractionResult(
        biomarkers=biomarkers,
        raw_text=full_text[:10000],
        extraction_method="tesseract_fallback",
        confidence=0.6 if biomarkers else 0.1,
    )


def _parse_text_for_biomarkers(text: str) -> list[ExtractedBiomarker]:
    """Basic regex extraction from OCR text — enhanced for Indian lab formats."""
    found = []
    seen_names = set()

    # Try Indian unit pattern first, then standard pattern
    for pattern in [INDIAN_UNIT_PATTERN, BIOMARKER_PATTERN]:
        for match in pattern.finditer(text):
            name = match.group(1).strip()
            raw_value = match.group(2)
            raw_unit = match.group(3).strip()
            ref_range = match.group(4)

            try:
                value, unit = _normalize_indian_value(raw_value, raw_unit)
            except ValueError:
                continue

            # Deduplicate
            name_key = name.lower().strip()
            if name_key in seen_names or len(name_key) < 2:
                continue
            seen_names.add(name_key)

            found.append(
                ExtractedBiomarker(
                    name=name,
                    value=value,
                    unit=unit,
                    reference_range=ref_range,
                )
            )

    return found
