"""
All Video Downloader — FastAPI backend.

Routes:
  POST /api/analyze   — fetch video metadata and available formats
  POST /api/download  — download and stream a specific format
  GET  /api/health    — liveness check
"""

from __future__ import annotations

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
from models import AnalyzeRequest, DownloadRequest, ErrorResponse, VideoInfo
from services.analyzer import analyze_url
from services.cleanup import cleanup_loop
from services.downloader import download_video

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

_cleanup_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _cleanup_task
    logger.info("Starting up — temp dir: %s", config.TEMP_DIR)
    _cleanup_task = asyncio.create_task(cleanup_loop())
    yield
    if _cleanup_task:
        _cleanup_task.cancel()
        try:
            await _cleanup_task
        except asyncio.CancelledError:
            pass
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="All Video Downloader API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "An internal server error occurred.", "code": "INTERNAL"},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(body: AnalyzeRequest) -> dict[str, Any]:
    """
    Fetch metadata and available formats for the supplied URL.

    Returns a JSON envelope: { success: true, data: VideoInfo }
    """
    try:
        video = await analyze_url(body.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc), "code": "ANALYSIS_FAILED"})

    return {"success": True, "data": video.model_dump()}


@app.post("/api/download")
async def download(body: DownloadRequest, request: Request):
    """
    Download a specific format and stream it back to the client.

    The response is a binary file stream with appropriate Content-Disposition.
    """
    try:
        response = await download_video(
            url=body.url,
            format_id=body.format_id,
            audio_format_id=body.audio_format_id,
            audio_language=body.audio_language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc), "code": "DOWNLOAD_FAILED"})

    return response


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
        log_level="info",
    )
