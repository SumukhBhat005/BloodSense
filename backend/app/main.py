"""
FastAPI application entry point.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api import reports, trends, users
from app.config import get_settings

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

# Disable interactive docs in production
_docs_url = "/docs" if settings.environment != "production" else None
_redoc_url = "/redoc" if settings.environment != "production" else None

app = FastAPI(
    title="BloodSense API",
    description="AI-powered blood test report analysis — educational use only.",
    version="1.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ──────────────────────────────────────────────────────
# Build the list of allowed origins from config + sensible defaults
_dev_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

_prod_origins: list[str] = []
if settings.allowed_origins:
    _prod_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]

_all_origins = _dev_origins if settings.environment == "development" else _prod_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Routers
app.include_router(reports.router, prefix="/api/v1")
app.include_router(trends.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/", tags=["health"])
async def root():
    return {
        "status": "ok",
        "service": "BloodSense API",
        "disclaimer": "This API is for educational purposes only and does not provide medical advice.",
    }


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
