from pydantic import BaseModel, Field
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime, date


SexType = Literal["male", "female", "other"]
ReportStatus = Literal["pending", "processing", "completed", "failed"]
BiomarkerStatus = Literal[
    "CRITICAL_LOW", "LOW", "BORDERLINE_LOW", "NORMAL",
    "BORDERLINE_HIGH", "HIGH", "CRITICAL_HIGH", "UNKNOWN",
    "INFORMATIONAL"
]
ReferenceSource = Literal["report", "builtin"]


# ─── User Schemas ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=1, le=130)
    sex: SexType


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=130)
    sex: Optional[SexType] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    age: int
    sex: SexType
    created_at: datetime


# ─── Biomarker Schemas ─────────────────────────────────────────
class ExtractedBiomarker(BaseModel):
    """Raw extraction from Gemini Vision — before analysis."""
    name: str
    value: Optional[float] = None
    unit: str
    reference_range: Optional[str] = None
    is_qualitative: bool = False
    qualitative_value: Optional[str] = None


class BiomarkerResult(BaseModel):
    """After synonym resolution, unit normalization, and classification."""
    id: Optional[UUID] = None
    canonical_name: str
    display_name: str
    value: Optional[float] = None
    unit: str
    value_normalized: Optional[float] = None
    unit_normalized: str
    reference_min: Optional[float] = None
    reference_max: Optional[float] = None
    reference_source: ReferenceSource
    status: BiomarkerStatus
    severity: int  # 0=normal, 1=borderline, 2=high/low, 3=critical, -1=informational
    is_qualitative: bool = False
    qualitative_value: Optional[str] = None


class BiomarkerUpdate(BaseModel):
    """User correction of extracted biomarker."""
    value: float
    unit: str
    reference_range: Optional[str] = None


# ─── Report Schemas ────────────────────────────────────────────
class ReportUploadResponse(BaseModel):
    report_id: UUID
    status: ReportStatus
    message: str


class RiskFlag(BaseModel):
    id: str
    label: str
    description: str
    severity: Literal["info", "warning", "critical"]


class SummaryOut(BaseModel):
    overall_status: Literal["normal", "attention", "urgent"]
    risk_flags: list[RiskFlag]
    gemini_summary: str
    gemini_abnormal: str
    gemini_questions: str
    gemini_lifestyle: str


class ReportDetail(BaseModel):
    id: UUID
    user_id: UUID
    file_name: str
    file_type: str
    status: ReportStatus
    lab_name: Optional[str] = None
    report_date: Optional[date] = None
    report_type: Optional[str] = None
    processing_error: Optional[str] = None
    created_at: datetime
    biomarkers: list[BiomarkerResult] = []
    summary: Optional[SummaryOut] = None


class ReportListItem(BaseModel):
    id: UUID
    file_name: str
    status: ReportStatus
    lab_name: Optional[str] = None
    report_date: Optional[date] = None
    report_type: Optional[str] = None
    overall_status: Optional[str] = None
    created_at: datetime


# ─── Trend Schemas ─────────────────────────────────────────────
class TrendPoint(BaseModel):
    report_id: UUID
    report_date: date
    value_normalized: float
    unit_normalized: str
    status: BiomarkerStatus
    created_at: datetime


class TrendResponse(BaseModel):
    canonical_name: str
    points: list[TrendPoint]
    trend_direction: Literal["improving", "stable", "worsening", "insufficient_data"]


class AllTrendsResponse(BaseModel):
    trends: dict[str, TrendResponse]


# ─── Pipeline Schemas ──────────────────────────────────────────
class QualitativeResult(BaseModel):
    """Non-numeric lab finding (Blood Group, Urine Culture, etc.)."""
    name: str
    value: str
    category: Optional[str] = None  # e.g., "Blood Typing", "Urine Microscopy"


class ExtractionResult(BaseModel):
    lab_name: Optional[str] = None
    report_date: Optional[str] = None
    report_type: Optional[str] = None
    biomarkers: list[ExtractedBiomarker]
    qualitative_results: list[QualitativeResult] = []
    raw_text: str
    extraction_method: Literal["gemini_vision", "tesseract_fallback"]
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
