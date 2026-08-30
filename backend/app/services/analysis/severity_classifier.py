"""
Severity classifier — pure deterministic logic.
No AI involved. Maps biomarker values to status levels using reference ranges.
"""
import re
import logging
from typing import Optional

from app.schemas import BiomarkerResult, BiomarkerStatus, ExtractedBiomarker
from app.services.analysis.synonym_resolver import resolve_canonical_name, get_reference_data

logger = logging.getLogger(__name__)

STATUS_SEVERITY_MAP: dict[BiomarkerStatus, int] = {
    "NORMAL": 0,
    "BORDERLINE_LOW": 1,
    "BORDERLINE_HIGH": 1,
    "LOW": 2,
    "HIGH": 2,
    "CRITICAL_LOW": 3,
    "CRITICAL_HIGH": 3,
    "UNKNOWN": -1,
    "INFORMATIONAL": -1,
}


def _parse_ref_range(ref_range_str: str) -> tuple[Optional[float], Optional[float]]:
    """
    Parse reference range strings like:
      "70-100", "< 5.7", "> 40", "4.5 - 11.0", "0-200"
    Returns (min, max) with None for unbounded sides.
    """
    if not ref_range_str:
        return None, None

    ref_range_str = ref_range_str.strip()

    # Pattern: "<= X" or "< X"
    m = re.match(r"^[<≤]\s*([\d.]+)$", ref_range_str)
    if m:
        return None, float(m.group(1))

    # Pattern: ">= X" or "> X"
    m = re.match(r"^[>≥]\s*([\d.]+)$", ref_range_str)
    if m:
        return float(m.group(1)), None

    # Pattern: "X - Y" or "X–Y"
    m = re.match(r"^([\d.]+)\s*[-–]\s*([\d.]+)$", ref_range_str)
    if m:
        return float(m.group(1)), float(m.group(2))

    return None, None


def _normalize_unit(value: float, from_unit: str, conversions: dict) -> tuple[float, str]:
    """Convert value to standard unit if a conversion factor is defined."""
    from_unit_clean = from_unit.strip().lower()
    for unit_alias, factor in conversions.items():
        if unit_alias.lower() == from_unit_clean:
            return round(value * factor, 4), list(conversions.keys())[0]
    return value, from_unit


def _adjust_ranges_for_age(canonical_name: str, ranges: dict, age: Optional[int]) -> dict:
    """Adjust reference ranges for age where clinically applicable."""
    if not age or not ranges:
        return ranges

    adjusted = dict(ranges)

    # ESR: Upper limit increases with age (Age/2 for males, (Age+10)/2 for females approx)
    if canonical_name == "ESR" and "NORMAL" in adjusted:
        if age > 50:
            normal = dict(adjusted["NORMAL"])
            normal["max"] = normal.get("max", 20) + (10 if age > 65 else 5)
            adjusted["NORMAL"] = normal

    # Fasting Sugar / HbA1c in elderly (>65)
    if canonical_name in ("Fasting Blood Sugar", "HbA1c") and age >= 65:
        if "BORDERLINE_HIGH" in adjusted:
            bl = dict(adjusted["BORDERLINE_HIGH"])
            bl["max"] = bl.get("max", 125) + 5
            adjusted["BORDERLINE_HIGH"] = bl

    return adjusted


def _classify_from_range_dict(
    value: float, ranges: dict
) -> BiomarkerStatus:
    """
    Classify value against a structured ranges dict.
    Ranges dict format: {"STATUS": {"min": X, "max": Y}, ...}
    """
    STATUS_PRIORITY = [
        "CRITICAL_LOW", "CRITICAL_HIGH",
        "LOW", "HIGH",
        "BORDERLINE_LOW", "BORDERLINE_HIGH",
        "NORMAL"
    ]

    for status in STATUS_PRIORITY:
        if status not in ranges:
            continue
        bounds = ranges[status]
        lo = bounds.get("min", float("-inf"))
        hi = bounds.get("max", float("inf"))
        if lo <= value < hi:
            return status

    # Edge case: check exact max boundary for NORMAL
    if "NORMAL" in ranges:
        bounds = ranges["NORMAL"]
        hi = bounds.get("max", float("inf"))
        if value == hi:
            return "NORMAL"

    return "UNKNOWN"


def classify_biomarker(
    extracted: ExtractedBiomarker,
    sex: str = "other",
    age: Optional[int] = None,
    allow_unclassified_passthrough: bool = True,
) -> Optional[BiomarkerResult]:
    """
    Full classification pipeline for a single extracted biomarker.
    Returns BiomarkerResult with status UNKNOWN if not in reference table,
    so no extracted test is lost.
    """
    # Skip qualitative biomarkers — they are handled separately
    if extracted.is_qualitative or extracted.value is None:
        return None

    canonical_name = resolve_canonical_name(extracted.name)
    display_name = extracted.name
    ref_data = None

    if canonical_name:
        ref_data = get_reference_data(canonical_name)
        if ref_data:
            display_name = ref_data.get("display_name", canonical_name)
    else:
        canonical_name = extracted.name.lower().strip().replace(" ", "_")

    if not ref_data and not allow_unclassified_passthrough:
        return None

    # Unit normalization
    value_norm = extracted.value
    unit_norm = extracted.unit
    if ref_data:
        conversions = ref_data.get("unit_conversions", {})
        value_norm, unit_norm = _normalize_unit(extracted.value, extracted.unit, conversions)

    # ─── Priority 1: Use reference range from the report ──────────
    ref_min, ref_max = None, None
    ref_source = "builtin"
    status: BiomarkerStatus = "UNKNOWN"

    if extracted.reference_range:
        ref_min, ref_max = _parse_ref_range(str(extracted.reference_range))
        if ref_min is not None or ref_max is not None:
            ref_source = "report"
            # Classify against extracted range
            lo = ref_min if ref_min is not None else float("-inf")
            hi = ref_max if ref_max is not None else float("inf")
            if value_norm < lo:
                status = "LOW"
            elif value_norm > hi:
                status = "HIGH"
            else:
                status = "NORMAL"

    # ─── Priority 2: Use built-in reference table ──────────────────
    if status == "UNKNOWN" and ref_data:
        ranges_data = ref_data.get("ranges", {})

        # Try sex-specific first, fall back to default
        range_key = sex if sex in ranges_data else "default"
        selected_ranges = ranges_data.get(range_key, ranges_data.get("default", {}))

        # Adjust ranges for age if applicable
        selected_ranges = _adjust_ranges_for_age(canonical_name, selected_ranges, age)

        if selected_ranges:
            status = _classify_from_range_dict(value_norm, selected_ranges)

            # Extract min/max for display from NORMAL range
            normal_range = selected_ranges.get("NORMAL", {})
            ref_min = normal_range.get("min")
            ref_max = normal_range.get("max")

    return BiomarkerResult(
        canonical_name=canonical_name,
        display_name=display_name,
        value=extracted.value,
        unit=extracted.unit,
        value_normalized=value_norm,
        unit_normalized=unit_norm if unit_norm else (ref_data.get("unit", extracted.unit) if ref_data else extracted.unit),
        reference_min=ref_min,
        reference_max=ref_max,
        reference_source=ref_source if ref_min is not None or ref_max is not None else "builtin",
        status=status,
        severity=STATUS_SEVERITY_MAP.get(status, -1),
    )


def classify_all(
    extracted_biomarkers: list[ExtractedBiomarker],
    sex: str = "other",
    age: Optional[int] = None,
) -> list[BiomarkerResult]:
    """Classify all extracted biomarkers. Includes unclassified items as UNKNOWN status."""
    results = []
    for biomarker in extracted_biomarkers:
        result = classify_biomarker(biomarker, sex=sex, age=age)
        if result:
            results.append(result)
    return results
