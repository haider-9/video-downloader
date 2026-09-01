"""
Shared yt-dlp options and helpers for both analysis and download.

Centralises anti-bot / anti-DRM measure so YouTube's bot detection (which
blocks cloud/server IPs with "Sign in to confirm you're not a bot") can be
mitigated in one place:

- A realistic browser User-Agent so the HTTP request looks like a normal
  client.
- Client rotation across multiple YouTube player clients (which often
  bypass the bot check on cloud IPs).
- Optional impersonation via curl_cffi (browser-grade TLS fingerprint) when
  the extra is installed.
- Support for a cookie file supplied by the operator for stubborn cases.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import yt_dlp

import config

logger = logging.getLogger(__name__)

# Realistic desktop Chrome UA so the request doesn't look like a script.
_DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


def resolve_ua() -> str:
    """Pick the User-Agent, preferring an operator-supplied one."""
    return config.YTDLP_USER_AGENT or _DEFAULT_UA


def build_common_opts(extra: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    """
    Build a dict of yt-dlp options shared by analysis and download.

    ``extra`` is merged on top so callers can override defaults.
    """
    opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "no_color": True,
        "user_agent": resolve_ua(),
    }

    # Browser identity spoofing via the legacy top-level "player_client" option,
    # which selects which YouTube client yt-dlp impersonates. Browser-like
    # clients (android, ios, web_safari) often bypass YouTube's bot check that
    # blocks cloud/server IPs.
    clients = config.YTDLP_PLAYER_CLIENTS
    if clients:
        opts["player_client"] = [c.strip() for c in clients.split(",") if c.strip()]

    # Impersonate a real browser TLS fingerprint via curl_cffi (if installed).
    if config.YTDLP_IMPERSONATE:
        try:
            import curl_cffi  # noqa: F401
            from yt_dlp.networking.impersonate import ImpersonateTarget
            opts["impersonate"] = ImpersonateTarget.from_str(config.YTDLP_IMPERSONATE)
        except ImportError:
            logger.warning(
                "YTDLP_IMPERSONATE is set but curl_cffi is not installed; "
                "impersonation disabled."
            )
        except Exception:
            logger.warning(
                "YTDLP_IMPERSONATE value %r is invalid; impersonation disabled.",
                config.YTDLP_IMPERSONATE,
            )

    # Optional cookie file (e.g. from a logged-in browser) for stubborn cases.
    if config.COOKIES_FILE:
        opts["cookiefile"] = config.COOKIES_FILE

    if config.FFMPEG_LOCATION:
        opts["ffmpeg_location"] = config.FFMPEG_LOCATION

    if extra:
        opts.update(extra)
    return opts
