"""
Synonym resolver — maps raw extracted biomarker names to canonical names
using the alias dictionary in reference_ranges.json.
"""
import json
import logging
import re
from pathlib import Path
from functools import lru_cache

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent.parent / "data"

# Common prefixes/suffixes to strip for better matching
STRIP_PREFIXES = [
    "serum ", "blood ", "plasma ", "s.", "s. ", "total ", "fasting ",
]
STRIP_SUFFIXES = [
    " level", " levels", " count", " test", " value",
]

# Patterns to clean from names (e.g., units appended to names)
UNIT_IN_NAME_PATTERN = re.compile(
    r"\s*\(?\s*(?:gm?/d[lL]|mg/d[lL]|U/L|mEq/L|%|mm/hr|fL|pg|ng/mL|µg/dL|cells/[µu]L|/HPF)\s*\)?$",
    re.IGNORECASE,
)


@lru_cache()
def _load_reference_data() -> dict:
    with open(DATA_DIR / "reference_ranges.json", encoding="utf-8") as f:
        return json.load(f)


@lru_cache()
def _build_alias_map() -> dict[str, str]:
    """Build a lowercase alias → canonical_name lookup."""
    data = _load_reference_data()
    alias_map: dict[str, str] = {}

    for canonical_name, info in data.items():
        # Map the canonical name itself
        alias_map[canonical_name.lower()] = canonical_name
        # Map all aliases
        for alias in info.get("aliases", []):
            alias_map[alias.lower()] = canonical_name

    return alias_map


def _normalize_raw_name(name: str) -> str:
    """Clean up OCR artifacts, strip common prefixes/suffixes, and normalize whitespace."""
    # Remove non-alphanumeric characters (except common medical ones)
    name = re.sub(r"[^a-zA-Z0-9\s\-/\(\)\.%:]", " ", name)
    name = re.sub(r"\s+", " ", name).strip().lower()

    # Remove units appended to name (e.g., "Hemoglobin (gm/dl)")
    name = UNIT_IN_NAME_PATTERN.sub("", name).strip()

    return name


def _strip_common_affixes(name: str) -> str:
    """Strip common prefixes and suffixes for fuzzy matching."""
    stripped = name
    for prefix in STRIP_PREFIXES:
        if stripped.startswith(prefix):
            stripped = stripped[len(prefix):]
            break  # only strip one prefix

    for suffix in STRIP_SUFFIXES:
        if stripped.endswith(suffix):
            stripped = stripped[:-len(suffix)]
            break  # only strip one suffix

    return stripped.strip()


def resolve_canonical_name(raw_name: str) -> str | None:
    """
    Attempt to map a raw biomarker name to a canonical name.
    Returns None if no match found.

    Matching strategy (in order):
    1. Exact match after normalization
    2. Exact match after stripping common prefixes/suffixes
    3. Partial match — alias contained in name OR name contained in alias
       (with length guard to prevent overly broad matches)
    """
    alias_map = _build_alias_map()
    normalized = _normalize_raw_name(raw_name)

    # 1. Exact match
    if normalized in alias_map:
        return alias_map[normalized]

    # 2. Exact match after stripping affixes
    stripped = _strip_common_affixes(normalized)
    if stripped and stripped in alias_map:
        return alias_map[stripped]

    # 3. Partial match — with length guards to avoid false positives
    #    e.g., "ca" should not match "calcium" (too short)
    #    but "neutrophils %" should match "neutrophils"
    best_match = None
    best_match_len = 0

    for alias, canonical in alias_map.items():
        # Skip very short aliases to avoid false positives (e.g., "na", "k", "cl", "mg")
        # These are only valid as exact matches (handled above)
        if len(alias) < 3 and alias != normalized:
            continue

        # Check if alias is contained in the normalized name
        if alias in normalized:
            # Prefer longer matches (more specific)
            if len(alias) > best_match_len:
                best_match = canonical
                best_match_len = len(alias)
        # Check if normalized name is contained in the alias
        elif len(normalized) >= 3 and normalized in alias:
            if len(alias) > best_match_len:
                best_match = canonical
                best_match_len = len(alias)

    if best_match:
        return best_match

    # 4. Try after stripping affixes with partial matching
    if stripped and stripped != normalized and len(stripped) >= 3:
        for alias, canonical in alias_map.items():
            if len(alias) < 3:
                continue
            if alias in stripped or stripped in alias:
                return canonical

    logger.debug(f"No canonical match found for: {raw_name!r}")
    return None


def get_reference_data(canonical_name: str) -> dict | None:
    data = _load_reference_data()
    return data.get(canonical_name)
