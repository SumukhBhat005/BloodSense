"""
Risk engine — evaluates rule combinations against classified biomarkers.
Purely informational — never diagnoses.
"""
import json
import logging
from pathlib import Path

from app.schemas import BiomarkerResult, RiskFlag

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def _load_rules() -> list[dict]:
    with open(DATA_DIR / "risk_rules.json", encoding="utf-8") as f:
        return json.load(f)


def evaluate_risk_rules(biomarkers: list[BiomarkerResult]) -> list[RiskFlag]:
    """
    Check which risk rules fire given the classified biomarker statuses.
    Returns a list of informational RiskFlag objects.
    """
    rules = _load_rules()
    status_by_name: dict[str, str] = {b.canonical_name: b.status for b in biomarkers}

    triggered: list[RiskFlag] = []

    for rule in rules:
        conditions = rule.get("conditions", [])
        match_mode = rule.get("match", "any")

        matches = []
        for cond in conditions:
            biomarker_name = cond["biomarker"]
            allowed_statuses = cond["statuses"]
            current_status = status_by_name.get(biomarker_name)
            matches.append(current_status in allowed_statuses)

        fires = any(matches) if match_mode == "any" else all(matches)

        if fires and any(matches):  # at least one condition must match
            triggered.append(
                RiskFlag(
                    id=rule["id"],
                    label=rule["label"],
                    description=rule["description"],
                    severity=rule.get("severity", "info"),
                )
            )

    return triggered


def compute_overall_status(
    biomarkers: list[BiomarkerResult],
    risk_flags: list[RiskFlag],
) -> str:
    """
    Compute a single overall health status for the report.
    Returns: 'normal' | 'attention' | 'urgent'
    """
    if not biomarkers:
        return "normal"

    max_severity = max((b.severity for b in biomarkers), default=0)
    has_critical = any(
        b.status in ("CRITICAL_LOW", "CRITICAL_HIGH") for b in biomarkers
    )
    has_high = any(b.status in ("LOW", "HIGH") for b in biomarkers)
    has_warning_flags = any(f.severity == "warning" for f in risk_flags)

    if has_critical or (has_high and has_warning_flags):
        return "urgent"
    elif has_high or has_warning_flags or max_severity >= 1:
        return "attention"
    return "normal"
