import type { AnalyzeResult, ApiError } from "./types";

// When running in the browser the Next.js rewrite proxy forwards /api/* to the
// backend, so we always use a relative path.  During SSR (if ever needed) we
// fall back to the explicit env variable.
function apiBase(): string {
  if (typeof window !== "undefined") return "";          // browser → relative
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiError(message: string, code = "UNKNOWN"): ApiError {
  return { success: false, error: message, code };
}

function networkError(): ApiError {
  return apiError(
    "Could not connect to the server. Please check your connection and try again.",
    "NETWORK_ERROR"
  );
}

// ---------------------------------------------------------------------------
// Analyze
// ---------------------------------------------------------------------------

export async function analyzeUrl(url: string): Promise<AnalyzeResult> {
  try {
    const res = await fetch(`${apiBase()}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(35_000),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const detail = json?.detail;
      const msg =
        (typeof detail === "object" ? detail?.error : detail) ??
        json?.error ??
        "Something went wrong. Please try again.";
      return apiError(msg, json?.code ?? "ANALYSIS_FAILED");
    }

    return json as AnalyzeResult;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return apiError("The request timed out. Please try again.", "TIMEOUT");
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      return apiError("The request was cancelled.", "ABORTED");
    }
    return networkError();
  }
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

export interface DownloadOptions {
  url: string;
  format_id: string;
  audio_format_id?: string | null;
  audio_language?: string | null;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface PreviewFile {
  blob: Blob;
  filename: string;
  contentType: string;
  url: string; // object URL for playback — caller is responsible for revoking
}

/**
 * Fetches a format from /api/download and returns it as a Blob WITHOUT
 * triggering an automatic file save. The returned object URL can be used for
 * in-page playback.
 *
 * Returns { success: true, data: PreviewFile } on success, or an ApiError.
 */
export async function previewFormat(
  opts: DownloadOptions
): Promise<{ success: true; data: PreviewFile } | ApiError> {
  const { url, format_id, audio_format_id, audio_language, onProgress, signal } = opts;

  try {
    const res = await fetch(`${apiBase()}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format_id, audio_format_id, audio_language }),
      signal,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const detail = json?.detail;
      const msg =
        (typeof detail === "object" ? detail?.error : detail) ??
        json?.error ??
        "The video failed to load for playback. Please try again.";
      return apiError(msg, "DOWNLOAD_FAILED");
    }

    // Stream the response body and track progress
    const contentLength = res.headers.get("Content-Length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = res.body?.getReader();

    if (!reader) {
      return apiError("No response body received from server.", "NO_BODY");
    }

    const chunks: ArrayBuffer[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        // Copy into a plain ArrayBuffer so Blob accepts it regardless of
        // whether the underlying buffer is a SharedArrayBuffer.
        const buf = value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength
        ) as ArrayBuffer;
        chunks.push(buf);
        received += value.byteLength;
        if (total > 0 && onProgress) {
          onProgress(Math.min(99, Math.round((received / total) * 100)));
        } else if (onProgress) {
          onProgress(-1); // indeterminate
        }
      }
    }

    const blob = new Blob(chunks);
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/i);
    const filename = filenameMatch?.[1]?.trim() ?? "video";
    const contentType = res.headers.get("Content-Type") ?? blob.type ?? "video/mp4";

    const urlObj = URL.createObjectURL(blob);
    onProgress?.(100);

    return { success: true, data: { blob, filename, contentType, url: urlObj } };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return apiError("Playback load was cancelled.", "ABORTED");
    }
    return networkError();
  }
}

/**
 * Initiates a download by POSTing to /api/download and triggering a browser
 * file-save via a temporary object URL.
 *
 * Returns null on success, or an ApiError on failure.
 */
export async function downloadFormat(
  opts: DownloadOptions
): Promise<ApiError | null> {
  const { url, format_id, audio_format_id, audio_language, onProgress, signal } = opts;

  try {
    const res = await fetch(`${apiBase()}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format_id, audio_format_id, audio_language }),
      signal,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const detail = json?.detail;
      const msg =
        (typeof detail === "object" ? detail?.error : detail) ??
        json?.error ??
        "The download failed. Please try again.";
      return apiError(msg, "DOWNLOAD_FAILED");
    }

    // Stream the response body and track progress
    const contentLength = res.headers.get("Content-Length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = res.body?.getReader();

    if (!reader) {
      return apiError("No response body received from server.", "NO_BODY");
    }

    const chunks: ArrayBuffer[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        // Copy into a plain ArrayBuffer so Blob accepts it regardless of
        // whether the underlying buffer is a SharedArrayBuffer.
        const buf = value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength
        ) as ArrayBuffer;
        chunks.push(buf);
        received += value.byteLength;
        if (total > 0 && onProgress) {
          onProgress(Math.min(99, Math.round((received / total) * 100)));
        } else if (onProgress) {
          onProgress(-1); // indeterminate
        }
      }
    }

    // Combine chunks and trigger browser download
    const blob = new Blob(chunks);
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/i);
    const filename = filenameMatch?.[1]?.trim() ?? "download";

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    onProgress?.(100);
    return null;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return apiError("Download was cancelled.", "ABORTED");
    }
    return networkError();
  }
}
