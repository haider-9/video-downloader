"""
URL analysis service: extracts metadata and available formats via yt-dlp.

No shell interpolation — yt-dlp is called via its Python API only.
"""

from __future__ import annotations

import asyncio
import logging
import math
import re
from typing import Any, Optional
from urllib.parse import urlparse

import yt_dlp

import config
from models import AudioLanguage, FormatInfo, VideoInfo

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Allowed URL schemes / blocklist for SSRF mitigation
# ---------------------------------------------------------------------------
_BLOCKED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",  # AWS metadata
    "metadata.google.internal",
}
_PRIVATE_IP_RE = re.compile(
    r"^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|0\.0\.0\.0|::1)"
)


def _validate_url_safety(url: str) -> None:
    """Raise ValueError for URLs that look like SSRF attempts."""
    try:
        parsed = urlparse(url)
    except Exception:
        raise ValueError("Invalid URL format.")

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only HTTP and HTTPS URLs are supported.")

    host = (parsed.hostname or "").lower().strip("[]")
    if not host:
        raise ValueError("URL has no host.")

    if host in _BLOCKED_HOSTS:
        raise ValueError("This URL is not supported.")

    if _PRIVATE_IP_RE.match(host):
        raise ValueError("This URL is not supported.")


# ---------------------------------------------------------------------------
# Error translation
# ---------------------------------------------------------------------------

_ERROR_MAP: list[tuple[str, str]] = [
    ("Private video", "This video is private and cannot be downloaded."),
    ("This video is private", "This video is private and cannot be downloaded."),
    ("Video unavailable", "This video is unavailable."),
    ("This video has been removed", "This video has been removed."),
    ("age.restricted", "This video is age-restricted and cannot be downloaded."),
    ("age restricted", "This video is age-restricted and cannot be downloaded."),
    ("This video is age-restricted", "This video is age-restricted and cannot be downloaded."),
    ("Sign in to confirm", "This video requires sign-in and cannot be downloaded."),
    ("login_required", "This content requires a login and cannot be downloaded."),
    ("Login required", "This content requires a login and cannot be downloaded."),
    ("DRM", "This video is DRM-protected and cannot be downloaded."),
    ("members-only", "This content is members-only and cannot be downloaded."),
    ("geo.restricted", "This video is not available in your region."),
    ("not available in your country", "This video is not available in your region."),
    ("This live event will begin", "This is an upcoming live stream, not yet available."),
    ("is live", "Live streams cannot be downloaded this way."),
    ("Postprocessing", "There was an error combining the video and audio tracks."),
    ("ffmpeg", "A media processing error occurred. Please try again."),
    ("Unable to extract", "Could not extract video information from this URL."),
    ("Unsupported URL", "This URL is not supported. Please check the URL and try again."),
    ("No video formats found", "No downloadable formats were found for this video."),
    ("HTTP Error 403", "Access was denied by the server. The video may be restricted."),
    ("HTTP Error 404", "The video could not be found. It may have been deleted."),
    ("HTTP Error 429", "Too many requests. Please wait a moment and try again."),
    ("network", "A network error occurred. Please check your connection and try again."),
    ("timed out", "The request timed out. Please try again."),
    ("exceeds maximum allowed duration", "This video is longer than the allowed limit. Please choose a shorter video."),
]


def _user_friendly_error(raw: str) -> tuple[str, str]:
    """Return (user_message, error_code) for a raw yt-dlp exception string."""
    raw_lower = raw.lower()
    for pattern, message in _ERROR_MAP:
        if pattern.lower() in raw_lower:
            return message, "VIDEO_UNAVAILABLE"
    return (
        "We couldn't retrieve information for this video. "
        "It may be unavailable, private, restricted, or unsupported.",
        "UNKNOWN",
    )


# ---------------------------------------------------------------------------
# Format helpers
# ---------------------------------------------------------------------------

_QUALITY_LABELS: list[tuple[int, str]] = [
    (2160, "4K Ultra HD"),
    (1440, "2K QHD"),
    (1080, "Full HD"),
    (720, "HD"),
    (480, "SD"),
    (360, "Low"),
    (240, "Very Low"),
    (144, "Minimum"),
]


def _quality_label(height: Optional[int]) -> str:
    if height is None:
        return "Unknown quality"
    for threshold, label in _QUALITY_LABELS:
        if height >= threshold:
            return label
    return "Minimum"


def _filesize_human(size_bytes: Optional[int]) -> Optional[str]:
    if not size_bytes or size_bytes <= 0:
        return None
    mb = size_bytes / (1024 * 1024)
    if mb < 1:
        return f"~{round(size_bytes / 1024)} KB"
    if mb < 1024:
        return f"~{math.ceil(mb)} MB"
    return f"~{mb / 1024:.1f} GB"


def _duration_human(seconds: Optional[int]) -> Optional[str]:
    if seconds is None:
        return None
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def _platform_from_url(url: str) -> str:
    try:
        host = urlparse(url).hostname or ""
        host = host.lower().replace("www.", "")
        _KNOWN = {
            "youtube.com": "YouTube",
            "youtu.be": "YouTube",
            "vimeo.com": "Vimeo",
            "dailymotion.com": "Dailymotion",
            "twitch.tv": "Twitch",
            "twitter.com": "Twitter",
            "x.com": "X (Twitter)",
            "facebook.com": "Facebook",
            "fb.watch": "Facebook",
            "instagram.com": "Instagram",
            "tiktok.com": "TikTok",
            "reddit.com": "Reddit",
            "bilibili.com": "Bilibili",
            "nicovideo.jp": "Niconico",
            "soundcloud.com": "SoundCloud",
            "bandcamp.com": "Bandcamp",
        }
        for domain, name in _KNOWN.items():
            if host == domain or host.endswith("." + domain):
                return name
        # Capitalise first part of domain
        parts = host.split(".")
        return parts[-2].capitalize() if len(parts) >= 2 else host.capitalize()
    except Exception:
        return "Unknown"


def _container_label(ext: Optional[str]) -> str:
    if not ext:
        return "Unknown"
    return ext.upper()


# Common ISO 639-1 language codes → human names (for the audio language picker).
_LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "ml": "Malayalam",
    "kn": "Kannada",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "ur": "Urdu",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "tr": "Turkish",
    "id": "Indonesian",
    "th": "Thai",
    "vi": "Vietnamese",
    "pl": "Polish",
    "nl": "Dutch",
    "sv": "Swedish",
    "no": "Norwegian",
    "da": "Danish",
    "fi": "Finnish",
    "el": "Greek",
    "he": "Hebrew",
    "cs": "Czech",
    "hu": "Hungarian",
    "ro": "Romanian",
    "uk": "Ukrainian",
}


def _language_label(code: Optional[str]) -> str:
    """Return a human-readable name for a language code (or raw code)."""
    code = (code or "").strip().lower()
    if not code:
        return "Original"
    return _LANGUAGE_NAMES.get(code, code.capitalize())


def _audio_stream_score(f: dict, orig_lang: str, lang_match_bonus: int) -> int:
    """Score an audio stream for a given language group.

    Prefers an explicitly language-matched stream, a codec we can merge cleanly,
    and higher bitrate, while penalising DRC duplicates. Returns a comparable int.
    """
    lang = (f.get("language") or "").strip().lower()
    fid = (f.get("format_id") or "").lower()
    codec = (f.get("acodec") or "").lower()
    abr = f.get("abr") or 0
    codec_pref = 0
    if "opus" in codec:
        codec_pref = 3
    elif "aac" in codec or "mp4a" in codec:
        codec_pref = 2
    elif codec != "none":
        codec_pref = 1
    lang_match = 1 if (lang == orig_lang and orig_lang) else 0
    # A language-qualified format id (e.g. "251-en") is unambiguous; a bare id
    # like "251" may resolve to a region dub on multi-language videos.
    qualified = 1 if (fid and lang) else 0
    is_drc = 1 if "drc" in fid else 0
    return (
        lang_match_bonus * lang_match
        + qualified * 10_000_000
        + codec_pref * 100_000
        + int(abr)
        - is_drc * 1_000_000
    )


def _audio_lang_score(f: dict, orig_lang: str) -> int:
    """Score an audio stream so the best one for a given language wins."""
    return _audio_stream_score(f, orig_lang, lang_match_bonus=100_000_000)


def _collect_audio_languages(
    audio_only: list[dict], orig_lang: str
) -> list[AudioLanguage]:
    """Group audio-only streams by language and list the best one for each."""
    if not audio_only:
        return []

    groups: dict[str, list[dict]] = {}
    for f in audio_only:
        code = (f.get("language") or "").strip().lower()
        groups.setdefault(code, []).append(f)

    result: list[AudioLanguage] = []
    seen_labels: set[str] = set()
    # A group is the original track if it carries the video's declared
    # language, or (when the video declares no language) if it's the untagged
    # default stream — untagged streams are almost always the original audio.
    for code, streams in groups.items():
        best = max(streams, key=lambda s: _audio_lang_score(s, orig_lang))
        label = _language_label(code)
        mark = label + (f" ({code})" if code and code not in (label.lower()) else "")
        # Avoid collisions (e.g. two untagged entries)
        if mark in seen_labels:
            continue
        seen_labels.add(mark)
        if orig_lang:
            is_original = code == orig_lang
        else:
            is_original = code == ""
        result.append(
            AudioLanguage(
                code=code,
                label=label,
                format_id=best.get("format_id", ""),
                is_original=is_original,
            )
        )

    # Sort: original first, then untagged/default, then alphabetically.
    def _sort_key(lang: AudioLanguage) -> tuple[int, ...]:
        if lang.is_original:
            return (0, 0, 0)
        if lang.code == "":
            return (1, 0, 0)
        return (2, 1, 0)

    result.sort(key=_sort_key)
    return result


def _build_formats(
    raw_formats: list[dict[str, Any]], original_language: Optional[str] = None
) -> tuple[list[FormatInfo], list[AudioLanguage]]:
    """
    Convert raw yt-dlp format dicts into clean FormatInfo objects.

    Returns a tuple of (formats, audio_languages):

    Strategy:
    1. Collect video-only streams.
    2. Pick the best audio-only stream (per codec + language preference).
    3. Build combined entries for video-only streams (video + best audio).
    4. Add any pre-muxed streams that include both video and audio.
    5. Add audio-only options.
    6. Deduplicate by resolution / type.
    """
    if not raw_formats:
        return [], []

    # Separate video, audio, and combined streams
    video_only: list[dict] = []
    audio_only: list[dict] = []
    combined: list[dict] = []

    for f in raw_formats:
        vcodec = f.get("vcodec") or "none"
        acodec = f.get("acodec") or "none"
        has_v = vcodec != "none"
        has_a = acodec != "none"

        if has_v and not has_a:
            video_only.append(f)
        elif not has_v and has_a:
            audio_only.append(f)
        elif has_v and has_a:
            combined.append(f)

    orig_lang = (original_language or "").strip().lower()

    # Effective language preference for an audio stream.
    # A stream matches the original language if it declares it explicitly, or
    # if it carries no language tag at all (native/default streams often omit it).
    def _lang_matches(f: dict) -> bool:
        lang = (f.get("language") or "").strip().lower()
        if not lang:
            # Untagged streams are almost always the original — treat as preferred
            # but secondary to an explicitly matching tag.
            return orig_lang == ""
        return lang == orig_lang

    # Best audio stream for merging. Prefer the video's *original* language
    # first (voice-over / dubbed tracks often share the same codec and bitrate
    # as the original), then opus > aac > mp4a, then bitrate — while avoiding
    # DRC duplicates and preferring a language-qualified format id.
    def _audio_score(f: dict) -> int:
        bonus = 100_000_000 if _lang_matches(f) else 0
        return _audio_stream_score(f, orig_lang, bonus)

    best_audio = max(audio_only, key=_audio_score) if audio_only else None
    best_audio_lang = (best_audio.get("language") or "").strip().lower() if best_audio else None

    seen_heights: set[int | str] = set()
    result: list[FormatInfo] = []
    is_first = True

    # --- Video streams (video-only merged with audio, and pre-muxed) ---
    # Sort by resolution descending, prefer pre-muxed MP4 over video-only
    def _video_score(f: dict) -> tuple[int, int]:
        h = f.get("height") or 0
        is_mp4 = 1 if (f.get("ext") or "") in ("mp4", "m4v") else 0
        return (h, is_mp4)

    candidate_video = sorted(combined + video_only, key=_video_score, reverse=True)

    for f in candidate_video:
        height = f.get("height")
        if height is None:
            continue

        key = height
        if key in seen_heights:
            continue
        seen_heights.add(key)

        vcodec = f.get("vcodec") or "none"
        acodec = f.get("acodec") or "none"
        has_v = vcodec != "none"
        has_a = acodec != "none"

        is_video_only = has_v and not has_a

        # For video-only streams, we'll merge with best audio
        merge_audio_id: Optional[str] = None
        if is_video_only and best_audio:
            merge_audio_id = best_audio.get("format_id")
            has_a = True  # will be merged

        ext = f.get("ext") or "mp4"
        # If merging, output will be MP4 (ffmpeg)
        if is_video_only and merge_audio_id:
            ext = "mp4"

        resolution = f"{f.get('width', '?')}×{height}" if f.get("width") else f"{height}p"
        fps = f.get("fps")

        # Filesize: prefer direct value; if merging, add audio size
        size = f.get("filesize") or f.get("filesize_approx")
        if is_video_only and merge_audio_id and best_audio:
            audio_size = best_audio.get("filesize") or best_audio.get("filesize_approx") or 0
            size = (size or 0) + audio_size

        label = f"{height}p"
        if fps and fps > 30:
            label = f"{height}p{fps}"

        result.append(
            FormatInfo(
                format_id=f["format_id"],
                label=label,
                quality_label=_quality_label(height),
                container=_container_label(ext),
                has_video=True,
                has_audio=has_a,
                resolution=resolution,
                fps=int(fps) if fps else None,
                filesize_approx=size,
                filesize_human=_filesize_human(size),
                audio_format_id=merge_audio_id,
                audio_language=best_audio_lang,
                is_default=is_first,
            )
        )
        is_first = False

    # --- Audio-only streams ---
    # Pick a handful of the best ones
    if audio_only:
        sorted_audio = sorted(audio_only, key=_audio_score, reverse=True)
        added_audio = 0
        for f in sorted_audio:
            if added_audio >= 2:
                break
            ext = f.get("ext") or "m4a"
            # Prefer mp3-like label for common containers
            if ext in ("webm", "ogg"):
                container = "WebM Audio"
            elif ext in ("m4a", "mp4"):
                container = "M4A"
            elif ext == "mp3":
                container = "MP3"
            else:
                container = _container_label(ext)

            abr = f.get("abr") or 0
            label = "Audio only"
            if abr:
                label = f"Audio {int(abr)}kbps"

            size = f.get("filesize") or f.get("filesize_approx")
            result.append(
                FormatInfo(
                    format_id=f["format_id"],
                    label=label,
                    quality_label="Audio only",
                    container=container,
                    has_video=False,
                    has_audio=True,
                    filesize_approx=size,
                    filesize_human=_filesize_human(size),
                    audio_language=(f.get("language") or "").strip().lower() or None,
                    is_default=False,
                )
            )
            added_audio += 1

    # If everything was combined (no video-only, no audio-only), handle simply
    if not result and combined:
        for f in sorted(combined, key=lambda x: x.get("height") or 0, reverse=True):
            height = f.get("height")
            label = f"{height}p" if height else "Video"
            size = f.get("filesize") or f.get("filesize_approx")
            ext = f.get("ext") or "mp4"
            result.append(
                FormatInfo(
                    format_id=f["format_id"],
                    label=label,
                    quality_label=_quality_label(height),
                    container=_container_label(ext),
                    has_video=True,
                    has_audio=True,
                    filesize_approx=size,
                    filesize_human=_filesize_human(size),
                    audio_language=(f.get("language") or "").strip().lower() or None,
                    is_default=len(result) == 0,
                )
            )

    return result, _collect_audio_languages(audio_only, orig_lang)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def analyze_url(url: str) -> VideoInfo:
    """
    Fetch video metadata and available formats for *url*.

    Raises ValueError with a user-friendly message on known errors.
    """
    _validate_url_safety(url)

    loop = asyncio.get_event_loop()
    try:
        info = await asyncio.wait_for(
            loop.run_in_executor(None, _fetch_info, url),
            timeout=config.ANALYZE_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise ValueError("Analysis timed out. Please try again.")

    return info


def _fetch_info(url: str) -> VideoInfo:
    """Synchronous yt-dlp call (run in executor)."""
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "no_color": True,
        "ignoreerrors": False,
        # Don't write anything to disk during analysis
        "writeinfojson": False,
        "writethumbnail": False,
    }

    if config.FFMPEG_LOCATION:
        ydl_opts["ffmpeg_location"] = config.FFMPEG_LOCATION

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        msg, _code = _user_friendly_error(str(exc))
        raise ValueError(msg)
    except Exception as exc:
        logger.exception("Unexpected error during analysis of %s", url)
        raise ValueError(
            "An unexpected error occurred while analyzing this URL. Please try again."
        )

    if info is None:
        raise ValueError("No video information could be retrieved for this URL.")

    # Handle playlists — take first entry
    if info.get("_type") == "playlist":
        entries = info.get("entries") or []
        if not entries:
            raise ValueError("This playlist appears to be empty.")
        info = entries[0]
        if info is None:
            raise ValueError("Could not retrieve the first video in this playlist.")

    raw_formats: list[dict] = info.get("formats") or []
    formats, audio_languages = _build_formats(
        raw_formats, original_language=info.get("language")
    )

    if not formats:
        raise ValueError(
            "No downloadable formats were found for this video. "
            "It may be restricted or DRM-protected."
        )

    duration = info.get("duration")
    if duration:
        try:
            duration = int(duration)
        except (TypeError, ValueError):
            duration = None

    if duration and duration > config.MAX_DURATION_SECONDS:
        raise ValueError(
            "This video is longer than the allowed limit. "
            "Please choose a shorter video."
        )

    thumbnail = info.get("thumbnail")
    if not thumbnail:
        # Try thumbnails list
        thumbs = info.get("thumbnails") or []
        if thumbs:
            # Pick the largest
            try:
                thumbnail = max(thumbs, key=lambda t: (t.get("width") or 0) * (t.get("height") or 0)).get("url")
            except Exception:
                thumbnail = thumbs[-1].get("url") if thumbs else None

    return VideoInfo(
        title=info.get("title") or "Untitled Video",
        thumbnail=thumbnail,
        duration=duration,
        duration_human=_duration_human(duration),
        uploader=info.get("uploader") or info.get("channel") or info.get("creator"),
        platform=_platform_from_url(url),
        webpage_url=info.get("webpage_url") or url,
        formats=formats,
        audio_languages=audio_languages,
    )
