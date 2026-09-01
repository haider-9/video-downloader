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

# --- Download limits (conservative defaults for free-tier hosting) ---
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))  # 100 MB
MAX_DURATION_SECONDS = int(os.getenv("MAX_DURATION_SECONDS", "600"))  # 10 min
DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("DOWNLOAD_TIMEOUT_SECONDS", "120"))
ANALYZE_TIMEOUT_SECONDS = int(os.getenv("ANALYZE_TIMEOUT_SECONDS", "30"))

# --- Concurrency ---
MAX_CONCURRENT_DOWNLOADS = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "1"))

# --- Cleanup ---
# Files older than this many seconds will be purged
FILE_TTL_SECONDS = int(os.getenv("FILE_TTL_SECONDS", "300"))  # 5 min

# --- yt-dlp / ffmpeg ---
FFMPEG_LOCATION = os.getenv("FFMPEG_LOCATION", "")  # empty = use PATH

# --- yt-dlp anti-bot / anti-DRM settings ---
# Custom User-Agent string (leave empty to use a built-in realistic browser UA).
YTDLP_USER_AGENT = os.getenv("YTDLP_USER_AGENT", "")

# Comma-separated list of YouTube player clients to try, e.g.
# "android,ios,web_safari" (browser-like clients often dodge bot detection).
YTDLP_PLAYER_CLIENTS = os.getenv("YTDLP_PLAYER_CLIENTS", "")

# Browser impersonation target for curl_cffi, e.g. "chrome" or "safari".
# Requires the `curl_cffi` python package. Empty = disabled.
YTDLP_IMPERSONATE = os.getenv("YTDLP_IMPERSONATE", "")

# Path to a Netscape-format cookies file exported from a browser.
# Only needed for videos that still require a login after the above measures.
COOKIES_FILE = os.getenv("COOKIES_FILE", "")

# --- Rate limiting (simple in-memory) ---
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
