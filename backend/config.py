"""Application configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# --- Directories ---
BASE_DIR = Path(__file__).parent
TEMP_DIR = Path(os.getenv("TEMP_DIR", str(BASE_DIR / "tmp")))
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# --- Server ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")

# --- Download limits ---
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "2048"))  # 2 GB default
MAX_DURATION_SECONDS = int(os.getenv("MAX_DURATION_SECONDS", "7200"))  # 2 h
DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("DOWNLOAD_TIMEOUT_SECONDS", "3600"))
ANALYZE_TIMEOUT_SECONDS = int(os.getenv("ANALYZE_TIMEOUT_SECONDS", "30"))

# --- Concurrency ---
MAX_CONCURRENT_DOWNLOADS = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "3"))

# --- Cleanup ---
# Files older than this many seconds will be purged
FILE_TTL_SECONDS = int(os.getenv("FILE_TTL_SECONDS", "900"))  # 15 min

# --- yt-dlp / ffmpeg ---
FFMPEG_LOCATION = os.getenv("FFMPEG_LOCATION", "")  # empty = use PATH

# --- Rate limiting (simple in-memory) ---
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
