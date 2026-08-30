"""Pydantic models for request/response validation."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, HttpUrl, field_validator


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class AnalyzeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_must_be_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL cannot be empty.")
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class DownloadRequest(BaseModel):
    url: str
    format_id: str
    audio_format_id: Optional[str] = None  # for video-only streams that need merging
    audio_language: Optional[str] = None   # preferred language code for the merged audio

    @field_validator("url")
    @classmethod
    def url_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL cannot be empty.")
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("format_id")
    @classmethod
    def format_id_must_be_safe(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("format_id cannot be empty.")
        # Only allow safe characters to prevent injection
        import re
        if not re.match(r'^[a-zA-Z0-9._+\-]+$', v):
            raise ValueError("format_id contains invalid characters.")
        return v


# ---------------------------------------------------------------------------
# Video information
# ---------------------------------------------------------------------------


class FormatInfo(BaseModel):
    format_id: str
    label: str           # Human-readable: "1080p", "720p", "Audio only", …
    quality_label: str   # "Best quality", "High quality", …
    container: str       # "MP4", "WebM", "MP3", …
    has_video: bool
    has_audio: bool
    resolution: Optional[str] = None   # "1920×1080"
    fps: Optional[int] = None
    filesize_approx: Optional[int] = None  # bytes
    filesize_human: Optional[str] = None   # "~145 MB"
    audio_format_id: Optional[str] = None  # companion audio stream id (for merging)
    audio_language: Optional[str] = None   # ISO code of the merged audio (e.g. "en", "ta")
    is_default: bool = False


class AudioLanguage(BaseModel):
    code: str                 # ISO-ish code: "en", "ta", or "" for untagged/default
    label: str                # "English", "Tamil", "Default (Original)", …
    format_id: str            # best audio stream id for this language
    is_original: bool = False # True if this matches the video's original language


class VideoInfo(BaseModel):
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None         # seconds
    duration_human: Optional[str] = None   # "12:43"
    uploader: Optional[str] = None
    platform: Optional[str] = None
    webpage_url: str
    formats: list[FormatInfo]
    audio_languages: list[AudioLanguage] = []


# ---------------------------------------------------------------------------
# API envelope
# ---------------------------------------------------------------------------


class SuccessResponse(BaseModel):
    success: bool = True
    data: dict | VideoInfo | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: Optional[str] = None
