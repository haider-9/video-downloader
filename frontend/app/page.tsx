"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  X,
  ArrowUpRight,
  Link2,
  RefreshCw,
  User,
  Languages,
} from "lucide-react";

import type { VideoInfo, FormatInfo, DownloadState, AudioLanguage } from "@/lib/types";
import { analyzeUrl, downloadFormat } from "@/lib/api";

const PLATFORM_TAGS = [
  { id: "youtube", label: "#youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: "tiktok", label: "#tiktok", url: "https://www.tiktok.com/@sample/video/123456789" },
  { id: "instagram", label: "#instagram", url: "https://www.instagram.com/reel/C123456789/" },
  { id: "vimeo", label: "#vimeo", url: "https://vimeo.com/76979871" },
];

// Short badge label for a format (quality only, no extras).
function qualityBadge(fmt: FormatInfo): string {
  if (!fmt.has_video) {
    return (fmt.filesize_human ? fmt.quality_label : fmt.label) || "Audio";
  }
  return fmt.label || fmt.quality_label || "Video";
}

export default function HomePage() {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  const [selectedLangCode, setSelectedLangCode] = useState<string>("");
  const [analyzeError, setAnalyzeError] = useState<string>("");

  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});

  // The actual format_id of the currently selected audio language.
  const languages: AudioLanguage[] = currentVideo?.audio_languages ?? [];
  const currentLang: AudioLanguage | null =
    languages.find((l) => l.code === selectedLangCode) ?? null;

  // Kick off a real analysis of the given URL.
  const handleAnalyze = useCallback(async (urlToAnalyze?: string) => {
    const targetUrl = (urlToAnalyze ?? urlInput).trim();
    if (!targetUrl) {
      setAnalyzeError("Please enter a video URL first");
      return;
    }

    setAnalyzeError("");
    setIsLoading(true);

    try {
      const result = await analyzeUrl(targetUrl);
      if (result.success) {
        setCurrentVideo(result.data);
        const defLang = result.data.audio_languages?.find((l) => l.is_original)
          ?? result.data.audio_languages?.[0];
        setSelectedLangCode(defLang?.code ?? "");
        setDownloads({});
      } else {
        setAnalyzeError(result.error || "Could not analyze video");
      }
    } catch {
      setAnalyzeError("Could not analyze video - please check the URL and try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [urlInput]);

  const handleDownload = useCallback(
    async (format: FormatInfo) => {
      if (!currentVideo) return;
      const id = format.format_id;
      const state = downloads[id];
      if (state && (state.status === "pending" || state.status === "downloading" || state.status === "processing")) {
        return;
      }

      // Resolve the streams to download:
      // The analyzer marks every video format as has_audio and signals that a
      // video-only stream needs an audio merge via `audio_format_id`.
      const isVideoOnly = format.has_video && !!format.audio_format_id;
      const isAudioOnly = !format.has_video && format.has_audio;

      let format_id = format.format_id;
      let audio_format_id: string | null = null;

      if (isAudioOnly) {
        // Use the selected language's audio stream, else the listed one.
        format_id = currentLang?.format_id ?? format.format_id;
      } else if (isVideoOnly) {
        // Merge the selected language's audio stream into the video-only stream.
        audio_format_id = currentLang?.format_id ?? format.audio_format_id ?? null;
      }
      // Combined streams keep their baked-in audio.

      setDownloads((prev) => ({
        ...prev,
        [id]: { status: "downloading", progress: 0, error: null },
      }));

      const controller = new AbortController();
      abortControllers.current[id] = controller;

      const error = await downloadFormat({
        url: currentVideo.webpage_url,
        format_id,
        audio_format_id,
        audio_language: isVideoOnly ? (currentLang?.code || null) : null,
        signal: controller.signal,
        onProgress: (pct) => {
          setDownloads((prev) => ({
            ...prev,
            [id]: { status: pct >= 100 ? "done" : "downloading", progress: pct >= 0 ? pct : 50, error: null },
          }));
        },
      });

      if (error) {
        delete abortControllers.current[id];
        if (error.code !== "ABORTED") {
          setDownloads((prev) => ({ ...prev, [id]: { status: "error", progress: 0, error: error.error } }));
        } else {
          setDownloads((prev) => ({ ...prev, [id]: { status: "idle", progress: 0, error: null } }));
        }
      } else {
        delete abortControllers.current[id];
        setDownloads((prev) => ({ ...prev, [id]: { status: "done", progress: 100, error: null } }));
        setTimeout(() => {
          setDownloads((prev) => ({ ...prev, [id]: { status: "idle", progress: 0, error: null } }));
        }, 6000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentVideo, downloads, currentLang]
  );

  useEffect(() => {
    return () => {
      for (const ctrl of Object.values(abortControllers.current)) {
        ctrl.abort();
      }
      abortControllers.current = {};
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#e8ecf2]">
      <div className="mx-auto w-full max-w-[1360px] bg-[#faf8f4] min-h-screen relative">
        {/* Main content */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-5 lg:py-7">
          {/* Header */}
          <header className="flex items-center justify-between pb-6 border-b border-[#ece6d9]/60">
            <div className="flex items-center gap-2">
              <a href="#" className="group flex items-center gap-2.5" title="VidGet">
                <div className="relative size-9 sm:size-10 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="size-full">
                    <path d="M18 20 L82 20 L48 84 L32 84 L58 34 L18 34 Z" fill="#14171f" />
                    <polygon points="66,20 82,20 70,36" fill="#e26a45" />
                    <polygon points="36,46 52,56 36,66" fill="#e26a45" />
                  </svg>
                </div>
              </a>
              <span className="font-display font-bold text-lg text-[#14171f]">VidGet</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#14171f]">
              <a href="#" className="font-semibold hover:text-[#e26a45] transition-colors">Home</a>
              <a href="#downloads" className="hover:text-[#e26a45] transition-colors">Downloads</a>
              <a href="#how-it-works" className="hover:text-[#e26a45] transition-colors">How it works</a>
              <a href="#faq" className="hover:text-[#e26a45] transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setUrlInput(text);
                      handleAnalyze(text);
                    }
                  } catch {
                    /* clipboard unavailable */
                  }
                }}
                className="hidden sm:flex items-center gap-2 bg-[#f4eee4]/80 hover:bg-[#ece4d6] border border-[#e5dfd2] rounded-full px-3.5 sm:px-4 py-1.5 text-xs text-[#716a5f] transition-all cursor-pointer"
                title="Paste from clipboard and analyze"
              >
                <Link2 className="size-3.5 text-[#8c8477]" />
                <span>Paste URL</span>
              </button>

              <button
                type="button"
                className="p-2 rounded-full hover:bg-[#eee7da] text-[#14171f] transition-colors cursor-pointer"
                title="Settings"
              >
                <User className="size-5 stroke-[1.6]" />
              </button>
            </div>
          </header>

          {/* Hero */}
          <main className="pt-6 sm:pt-8 lg:pt-10 space-y-6 sm:space-y-8">
            <div id="downloads" className="scroll-mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left: headline + URL input */}
              <div className="lg:col-span-7 min-w-0 flex flex-col justify-between pt-2 lg:pt-4">
                <div>
                  <div className="space-y-1 sm:space-y-2 select-none">
                    <div className="flex items-baseline tracking-tight font-display font-extrabold text-5xl sm:text-7xl md:text-8xl xl:text-[5.5rem] leading-none">
                      <span className="text-[#14171f] mr-1">UN</span>
                      <span className="text-stroke-custom">LOCK</span>
                    </div>
                    <div className="flex items-baseline tracking-tight font-display font-extrabold text-5xl sm:text-7xl md:text-8xl xl:text-[5.5rem] leading-none">
                      <span className="text-stroke-custom mr-2 sm:mr-3">ANY</span>
                      <span className="relative inline-block text-[#14171f]">
                        <span className="text-stencil-cut">VIDEO</span>
                      </span>
                    </div>
                  </div>
                  <p className="mt-6 max-w-md text-base text-[#716a5f]">
                    Paste a link from YouTube, TikTok, Instagram, Twitter/X, Vimeo and 1000+ more.
                    Download in pristine 4K, 1080p, or MP3 with multi-language audio tracks.
                  </p>
                </div>

                {/* URL input */}
                <div className="mt-8 sm:mt-10">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAnalyze();
                    }}
                    className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#f2ede4] p-2 sm:p-2.5 rounded-3xl border border-[#ded7ca] shadow-sm focus-within:ring-2 focus-within:ring-[#14171f] transition-all"
                  >
                    <div className="relative flex-1 flex items-center pl-3">
                      <Link2 className="size-5 text-[#8c8477] shrink-0" />
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          if (analyzeError) setAnalyzeError("");
                        }}
                        placeholder="Paste video link — YouTube, TikTok, Instagram, Twitter, Vimeo..."
                        className="w-full bg-transparent border-0 pl-3 pr-2 py-2 text-sm sm:text-base text-[#14171f] placeholder:text-[#8c8477] focus:outline-none"
                      />
                      {urlInput && (
                        <button
                          type="button"
                          onClick={() => setUrlInput("")}
                          className="p-1 text-[#8c8477] hover:text-[#14171f] transition-colors"
                          aria-label="Clear URL"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group inline-flex items-center justify-between sm:justify-center gap-3.5 bg-[#ece4d6] hover:bg-[#e4dcce] text-[#14171f] rounded-full pl-6 pr-2 py-2 font-bold text-sm sm:text-base tracking-wider uppercase border border-[#ded6c7] cursor-pointer shadow-sm transition-all duration-200 shrink-0 disabled:opacity-70"
                    >
                      <span>{isLoading ? "ANALYZING..." : "DOWNLOAD NOW!"}</span>
                      <span className="size-9 rounded-full bg-[#e26a45] group-hover:bg-[#d65e3a] text-white flex items-center justify-center shadow-md">
                        {isLoading ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <ArrowUpRight className="size-5" />
                        )}
                      </span>
                    </button>
                  </form>

                  {analyzeError && (
                    <p className="mt-2 text-xs font-semibold text-[#c0392b]">
                      {analyzeError}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#716a5f]">
                    <span className="font-semibold text-[#14171f]">Try:</span>
                    {PLATFORM_TAGS.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setUrlInput(tag.url);
                          handleAnalyze(tag.url);
                        }}
                        className="bg-[#eee8dc] hover:bg-[#e4ddcf] px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: the div — thumbnail + quality badge list with download */}
              <div ref={resultsRef} className="lg:col-span-5 min-w-0 scroll-mt-6">
                {currentVideo ? (
                  <div className="bg-[#f4eee4] rounded-3xl p-3 sm:p-4 border border-[#e4ded2] shadow-sm overflow-hidden">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#1a1d24]">
                      <Image
                        src={currentVideo.thumbnail ?? "/images/hero_model.jpg"}
                        alt={currentVideo.title}
                        fill
                        priority
                        className="object-cover object-center opacity-90"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#14171f]/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                        <span className="size-1.5 rounded-full bg-[#27c93f]" />
                        <span>{currentVideo.duration_human ?? "Video"}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="line-clamp-2 font-display font-bold text-base text-[#14171f]">
                        {currentVideo.title}
                      </h3>

                      {languages.length > 1 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Languages className="size-3.5 text-[#e26a45]" />
                          {languages.map((lang) => (
                            <button
                              key={lang.code || "orig"}
                              type="button"
                              onClick={() => setSelectedLangCode(lang.code)}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                                selectedLangCode === lang.code
                                  ? "bg-[#14171f] text-white"
                                  : "bg-white text-[#14171f] border border-[#ded7ca] hover:bg-[#ede5d8]"
                              }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {currentVideo.formats.map((fmt) => {
                          const dlState = downloads[fmt.format_id];
                          const isBusy =
                            dlState?.status === "downloading" ||
                            dlState?.status === "pending" ||
                            dlState?.status === "processing";
                          const isDone = dlState?.status === "done";
                          return (
                            <span
                              key={fmt.format_id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#ded7ca] bg-white px-2.5 py-1"
                            >
                              <span className="text-xs font-bold text-[#14171f]">
                                {qualityBadge(fmt)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(fmt);
                                }}
                                disabled={isBusy}
                                aria-label={`Download ${qualityBadge(fmt)}`}
                                className={`flex size-6 items-center justify-center rounded-full text-white transition-colors cursor-pointer ${
                                  isBusy
                                    ? "bg-[#14171f] opacity-80"
                                    : isDone
                                    ? "bg-[#27c93f]"
                                    : "bg-[#14171f] hover:bg-[#e26a45]"
                                }`}
                              >
                                {isBusy ? (
                                  <RefreshCw className="size-3.5 animate-spin" />
                                ) : (
                                  <Download className="size-3.5" />
                                )}
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-[#d6d0c4] bg-[#f4eee4]/50 p-6 text-center text-sm text-[#716a5f]">
                    Paste a link and analyze to see the available resolutions here.
                  </div>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>

      <footer className="border-t border-[#ece6d9] bg-[#faf8f4] py-8">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#716a5f]">
          <span className="font-semibold text-[#14171f]">VidGet</span>
          <span>© {new Date().getFullYear()} VidGet. For personal use only.</span>
          <span>Only download content you have permission to download.</span>
        </div>
      </footer>
    </div>
  );
}
