"""
Trends API — historical biomarker trend data for charts.
"""
from fastapi import APIRouter, HTTPException, Request
from app.schemas import TrendResponse, TrendPoint, AllTrendsResponse

router = APIRouter(prefix="/trends", tags=["trends"])

@router.get("", response_model=AllTrendsResponse)
async def get_all_trends():
    return AllTrendsResponse(trends={})

@router.get("/{biomarker}", response_model=TrendResponse)
async def get_biomarker_trend(biomarker: str):
    return TrendResponse(
        canonical_name=biomarker,
        points=[],
        overall_trend_score=0.0,
        trend_direction="insufficient_data",
    )
