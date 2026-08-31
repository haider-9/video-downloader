"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Download,
  ArrowUpRight,
  Link2,
  RefreshCw,
  User,
  Languages,
  Menu,
  Layers,
  Film,
  Music,
  Zap,
  Globe,
  ShieldCheck,
  ClipboardPaste,
  ListChecks,
  ChevronDown,
  Play,
} from "lucide-react";

import type { VideoInfo, FormatInfo, DownloadState, AudioLanguage } from "@/lib/types";
import { analyzeUrl, downloadFormat, previewFormat } from "@/lib/api";
import { FAQ_ITEMS } from "@/lib/seo";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { RippleButton, RippleButtonRipples } from "@/components/animate-ui/primitives/buttons/ripple";
import { Play as AnimatedPlay } from "@/components/animate-ui/icons/play";
import { Download as AnimatedDownload } from "@/components/animate-ui/icons/download";

const PLATFORM_TAGS = [
  { id: "youtube", label: "#youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: "tiktok", label: "#tiktok", url: "https://www.tiktok.com/@sample/video/123456789" },
  { id: "instagram", label: "#instagram", url: "https://www.instagram.com/reel/C123456789/" },
  { id: "vimeo", label: "#vimeo", url: "https://vimeo.com/76979871" },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Multiple qualities",
    description: "4K, 1080p, 720p, 480p, and more. Download the exact resolution you need.",
  },
  {
    icon: Film,
    title: "Video + Audio",
    description: "When a stream is video-only, we automatically merge the best audio track so you always get a complete file.",
  },
  {
    icon: Music,
    title: "Audio-only downloads",
    description: "Extract the audio track for music, podcasts, or lectures without the video.",
  },
  {
    icon: Zap,
    title: "Fast processing",
    description: "We stream the file directly from the source — no re-encoding unless merging tracks — so downloads start quickly.",
  },
  {
    icon: Globe,
    title: "Hundreds of sources",
    description: "Powered by yt-dlp — supports YouTube, Vimeo, TikTok, Twitter/X, Dailymotion, Reddit, and thousands of other sites.",
  },
  {
    icon: ShieldCheck,
    title: "No account required",
    description: "Paste a URL, pick your quality, and download. No sign-up, no tracking, no subscriptions.",
  },
];

const STEPS = [
  {
    icon: ClipboardPaste,
    step: "01",
    title: "Paste your URL",
    description:
      "Copy the link from any supported video platform and paste it into the input. Works with YouTube, Vimeo, TikTok, Twitter, and hundreds more.",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "Choose quality",
    description:
      "We analyse the video and show all available qualities and formats — from 4K to 360p, video with audio or audio-only.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download",
    description:
      "Hit Download and the file is processed and saved directly to your device. No accounts, no waiting rooms, no popups.",
  },
];

const NAV_LINKS = [
  { href: "#downloads", label: "Downloads" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<string | null>(null);

  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  // In-page playback of a fetched (blob) video.
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);
  const [playerFilename, setPlayerFilename] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState<number>(-1);

  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});
  const playerRef = useRef<HTMLVideoElement>(null);

  // Revoke the current playback object URL.
  const revokePlayer = useCallback(() => {
    setPlayerSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setPlayerFilename("");
    setPreviewError(null);
    setPreviewProgress(-1);
  }, []);

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
        revokePlayer();
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
  }, [urlInput, revokePlayer]);

  const handlePreview = useCallback(
    async (format: FormatInfo) => {
      if (!currentVideo) return;
      if (currentVideo.platform === "YouTube") {
        setPreviewError(
          "YouTube streams are DRM-protected and can't be played directly in the browser. Use Download instead."
        );
        return;
      }
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewProgress(-1);

      // Resolve the streams to fetch (same logic as download).
      const isVideoOnly = format.has_video && !!format.audio_format_id;
      const isAudioOnly = !format.has_video && format.has_audio;

      let format_id = format.format_id;
      let audio_format_id: string | null = null;

      if (isAudioOnly) {
        format_id = currentLang?.format_id ?? format.format_id;
      } else if (isVideoOnly) {
        audio_format_id = currentLang?.format_id ?? format.audio_format_id ?? null;
      }

      const abortKey = `preview-${format.format_id}`;
      const controller = new AbortController();
      abortControllers.current[abortKey] = controller;

      const result = await previewFormat({
        url: currentVideo.webpage_url,
        format_id,
        audio_format_id,
        audio_language: isVideoOnly ? (currentLang?.code || null) : null,
        signal: controller.signal,
        onProgress: (pct) => setPreviewProgress(pct),
      });

      delete abortControllers.current[abortKey];
      setPreviewProgress(-1);

      if (!result.success) {
        setPreviewLoading(false);
        setPreviewError(result.error || "Could not load the video for playback.");
        return;
      }

      // Swap in the new playback URL, revoking any previous object URL.
      setPlayerSrc((old) => {
        if (old) URL.revokeObjectURL(old);
        return result.data.url;
      });
      setPlayerFilename(result.data.filename);
      setPreviewLoading(false);

      requestAnimationFrame(() => {
        playerRef.current?.play().catch(() => {});
      });
    },
    [currentVideo, currentLang]
  );

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
    [currentVideo, downloads, currentLang]
  );

  useEffect(() => {
    const videoEl = playerRef.current;
    return () => {
      for (const ctrl of Object.values(abortControllers.current)) {
        ctrl.abort();
      }
      abortControllers.current = {};
      if (videoEl) videoEl.src = "";
      setPlayerSrc((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, []);

  // Lock body scroll when the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#e8ecf2]">
      <div className="mx-auto w-full max-w-[1360px] bg-[#faf8f4] min-h-screen relative">
        {/* Main content */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-7">
          {/* Header — Responsive with mobile drawer */}
          <header className="flex items-center justify-between pb-6 border-b border-[#ece6d9]/60">
            <div className="flex items-center gap-2">
              <a href="#" className="group flex items-center gap-2.5" title="VidGet" aria-label="VidGet home">
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

            {/* Desktop nav */}
            <nav aria-label="Main" className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#14171f]">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-[#e26a45] transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3.5">
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
                className="hidden md:flex p-2 rounded-full hover:bg-[#eee7da] text-[#14171f] transition-colors cursor-pointer"
                title="Settings"
              >
                <User className="size-5 stroke-[1.6]" />
              </button>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="md:hidden p-2 rounded-full hover:bg-[#eee7da] text-[#14171f] transition-colors cursor-pointer"
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </header>

          {/* Mobile drawer */}
          {menuOpen && (
            <div
              className="md:hidden fixed inset-0 z-50 md:hidden"
              onClick={() => setMenuOpen(false)}
            >
              <div className="absolute inset-0 bg-[#14171f]/40" aria-hidden="true" />
              <nav
                id="mobile-menu"
                aria-label="Mobile"
                className="absolute right-0 top-0 h-full w-[78%] max-w-xs bg-[#faf8f4] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-5 border-b border-[#ece6d9]">
                  <span className="font-display font-bold text-lg text-[#14171f]">VidGet</span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 rounded-full hover:bg-[#eee7da] text-[#14171f] cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <ul className="flex flex-col gap-1 mt-4">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-4 py-3 text-sm font-medium text-[#14171f] hover:bg-[#eee7da] transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-[#ece6d9]">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#14171f] text-white rounded-full px-5 py-3 text-sm font-bold cursor-pointer"
                  >
                    <AnimatedDownload size={16} animateOnHover />
                    New download
                  </button>
                </div>
              </nav>
            </div>
          )}

          {/* Hero */}
          <main id="main-content">
            <div className="pt-6 sm:pt-8 lg:pt-10 space-y-6 sm:space-y-8">
              <div id="downloads" className="scroll-mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                {/* Left: headline + URL input */}
                <div className="lg:col-span-7 min-w-0 flex flex-col justify-between pt-2 lg:pt-4">
                  <Slide inView delay={0} direction="up" offset={40}>
                    <div>
                      <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-[#e2d9c8] bg-white/70 px-3 py-1 shadow-sm">
                        <span className="size-1.5 rounded-full bg-[#27c93f]" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#716a5f]">
                          Free · No sign-up · 1000+ sites
                        </span>
                      </div>

                      <div className="space-y-1 sm:space-y-2 select-none w-full min-w-0">
                        <div className="flex items-baseline flex-wrap tracking-tight font-display font-extrabold hero-headline leading-none">
                          <span className="text-[#14171f] mr-1">UN</span>
                          <span className="text-stroke-custom">LOCK</span>
                        </div>
                        <div className="flex items-baseline flex-wrap tracking-tight font-display font-extrabold hero-headline leading-none">
                          <span className="text-stroke-custom mr-2 sm:mr-3">ANY</span>
                          <span className="relative inline-block text-[#14171f]">
                            <span className="text-stencil-cut">VIDEO</span>
                          </span>
                        </div>
                      </div>
                      <p className="mt-5 text-base sm:text-lg text-[#716a5f] max-w-md leading-relaxed">
                        Paste a link from YouTube, TikTok, Instagram, Twitter/X, Vimeo and
                        1000+ more. Download in pristine <strong className="font-semibold text-[#14171f]">4K</strong>,{" "}
                        <strong className="font-semibold text-[#14171f]">1080p</strong>, or{" "}
                        <strong className="font-semibold text-[#14171f]">MP3</strong> with
                        multi-language audio tracks.
                      </p>
                    </div>
                  </Slide>

                  {/* URL input — stacked on mobile, inline on desktop */}
                  <Slide inView delay={140} direction="up" offset={40}>
                  <div className="mt-8 sm:mt-10">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAnalyze();
                      }}
                      className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#f2ede4] p-2 sm:p-2.5 rounded-3xl border border-[#ded7ca] shadow-sm focus-within:ring-2 focus-within:ring-[#14171f] transition-all mx-0"
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
                          className="w-full bg-transparent border-0 pl-3 pr-8 py-2 sm:py-3 text-sm sm:text-base text-[#14171f] placeholder:text-[#8c8477] focus:outline-none"
                          aria-label="Video URL"
                        />
                        {urlInput && (
                          <button
                            type="button"
                            onClick={() => setUrlInput("")}
                            className="absolute right-2 p-1 text-[#8c8477] hover:text-[#14171f] transition-colors"
                            aria-label="Clear URL"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>

                      <RippleButton
                        type="submit"
                        disabled={isLoading}
                        className="group inline-flex items-center justify-between sm:justify-center gap-3.5 bg-[#ece4d6] hover:bg-[#e4dcce] text-[#14171f] rounded-full pl-6 pr-2 py-2 font-bold text-sm sm:text-base tracking-wider uppercase border border-[#ded6c7] cursor-pointer shadow-sm transition-colors duration-200 shrink-0 disabled:opacity-70"
                      >
                        <RippleButtonRipples
                          className="bg-[#14171f]/10"
                          scale={8}
                        />
                        <span>{isLoading ? "ANALYZING..." : "DOWNLOAD NOW!"}</span>
                        <span className="size-9 rounded-full bg-[#e26a45] group-hover:bg-[#d65e3a] text-white flex items-center justify-center shadow-md">
                          {isLoading ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            <ArrowUpRight className="size-5" />
                          )}
                        </span>
                      </RippleButton>
                    </form>

                    {analyzeError && (
                      <p className="mt-2 text-xs font-semibold text-[#c0392b]" role="alert">
                        {analyzeError}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#716a5f]">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8c8477]">Try:</span>
                      {PLATFORM_TAGS.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setUrlInput(tag.url);
                            handleAnalyze(tag.url);
                          }}
                          className="bg-[#f6f1e7] hover:bg-[#e4ddcf] hover:text-[#14171f] px-2.5 py-1 rounded-full text-[11px] font-medium text-[#716a5f] transition-all duration-150 cursor-pointer border border-transparent hover:border-[#ded7ca]"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  </Slide>
                </div>

                {/* Right: thumbnail + quality badge list with download */}
                <div ref={resultsRef} className="lg:col-span-5 min-w-0 scroll-mt-6">
                  {currentVideo ? (
                    <div className="group/player bg-[#f4eee4] rounded-3xl p-3 sm:p-4 border border-[#e4ded2] shadow-lg overflow-hidden">
                      {/* Player — real <video> when loaded, poster + play otherwise */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#14171f] shadow-xl ring-1 ring-black/10">
                        {playerSrc ? (
                          <video
                            ref={playerRef}
                            src={playerSrc}
                            controls
                            controlsList="nodownload"
                            playsInline
                            autoPlay
                            className="absolute inset-0 h-full w-full bg-black object-contain"
                            poster={currentVideo.thumbnail ?? undefined}
                          />
                        ) : (
                          <>
                            <Image
                              src={currentVideo.thumbnail ?? "/images/hero_model.jpg"}
                              alt={currentVideo.title}
                              fill
                              priority
                              sizes="(max-width: 1024px) 100vw, 50vw"
                              className="object-cover object-center"
                            />

                            {/* Cinematic gradient overlay */}
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/40"
                              aria-hidden="true"
                            />

                            {/* Top-left: duration / live badge */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                              <span className="size-1.5 rounded-full bg-[#27c93f] animate-pulse" />
                              <span>{currentVideo.duration_human ?? "Video"}</span>
                            </div>

                            {/* Top-right: resolution chip */}
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                              <span className="size-1 rounded-full bg-[#e26a45]" />
                              <span>{currentVideo.formats && currentVideo.formats[0] ? currentVideo.formats[0].quality_label : "HD"}</span>
                            </div>

                            {/* Center: pulsing play button (hidden for DRM platforms like YouTube) */}
                            {currentVideo.platform !== "YouTube" ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative flex items-center justify-center">
                                  <span
                                    className="absolute inset-0 rounded-full bg-white/25 animate-ping opacity-70 group-hover/player:opacity-100 transition-opacity"
                                    aria-hidden="true"
                                  />
                                  <button
                                    type="button"
                                    aria-label="Play video preview"
                                    onClick={() =>
                                      handlePreview(
                                        currentVideo.formats.find((f) => f.is_default) ??
                                          currentVideo.formats.find((f) => f.has_video) ??
                                          currentVideo.formats[0]
                                      )
                                    }
                                    className="relative flex size-12 sm:size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/40 text-white shadow-xl transition-all duration-200 hover:bg-[#e26a45] hover:scale-105 cursor-pointer"
                                  >
                                    <AnimatedPlay size={22} className="ml-0.5" animateOnHover completeOnStop />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-md border border-white/10 px-4 py-2">
                                  <AnimatedDownload size={16} className="text-[#e26a45]" animateOnHover />
                                  <span className="text-[11px] font-bold text-white">
                                    Streaming unavailable — Download instead
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Hint */}
                            {currentVideo.platform !== "YouTube" && (
                              <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3">
                                <p className="text-center text-[10px] font-medium text-white/70">
                                  Play downloads the file first, then plays it in-browser
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Loading overlay */}
                        {previewLoading && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="flex w-[80%] max-w-xs flex-col items-center gap-3 text-white">
                              <RefreshCw className="size-7 animate-spin text-[#e26a45]" />
                              <div className="text-center">
                                <p className="text-xs font-semibold">Downloading video…</p>
                                <p className="mt-1 text-[10px] text-white/70">
                                  It plays automatically once the file finishes downloading.
                                </p>
                              </div>
                              {previewProgress >= 0 && (
                                <div className="w-full">
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                                    <div
                                      className="h-full rounded-full bg-[#e26a45] transition-all duration-300"
                                      style={{ width: `${previewProgress}%` }}
                                    />
                                  </div>
                                  <p className="mt-1 text-right text-[10px] font-semibold text-white/80">
                                    {previewProgress}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Error overlay */}
                        {previewError && (
                          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-[#c0392b]/95 px-4 py-2.5 text-white">
                            <span className="text-[11px] font-semibold leading-snug">{previewError}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewError(null)}
                              aria-label="Dismiss error"
                              className="shrink-0 p-1 rounded-full hover:bg-white/20 cursor-pointer"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Video info */}
                      <div className="mt-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 font-display font-bold text-base text-[#14171f]">
                            {currentVideo.title}
                          </h3>
                          <span className="mt-0.5 shrink-0 rounded-full bg-[#14171f] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            {playerSrc ? "Playing" : "Ready"}
                          </span>
                        </div>

                        {/* Save button when a preview is loaded */}
                        {playerSrc && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!playerSrc || !playerFilename) return;
                              const a = document.createElement("a");
                              a.href = playerSrc;
                              a.download = playerFilename;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#e26a45] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#d65e3a] cursor-pointer"
                          >
                            <AnimatedDownload size={14} animateOnHover />
                            Save this file
                          </button>
                        )}

                        {languages.length > 1 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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

                        <div className="mt-3.5 flex flex-wrap gap-2">
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
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#ded7ca] bg-white px-2.5 py-1 shadow-sm"
                              >
                                {currentVideo.platform !== "YouTube" ? (
                                  <button
                                    type="button"
                                    onClick={() => handlePreview(fmt)}
                                    disabled={previewLoading}
                                    aria-label={`Play ${qualityBadge(fmt)}`}
                                    title={`Play ${qualityBadge(fmt)} in-browser`}
                                    className="flex items-center gap-1 text-xs font-bold text-[#14171f] transition-colors hover:text-[#e26a45] disabled:opacity-60 cursor-pointer"
                                  >
                                    <Play className="size-3 fill-current" />
                                    {qualityBadge(fmt)}
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs font-bold text-[#14171f]">
                                    {qualityBadge(fmt)}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(fmt);
                                  }}
                                  disabled={isBusy || previewLoading}
                                  aria-label={`Download ${qualityBadge(fmt)}`}
                                  title={`Save ${qualityBadge(fmt)} to device`}
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
                                    <AnimatedDownload size={14} animateOnHover />
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

              {/* How it works */}
              <section id="how-it-works" className="scroll-mt-6 py-8 sm:py-12 lg:py-14 border-t border-[#ece6d9]/60">
                <Slide inView direction="up" offset={30}>
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14171f] tracking-tight">
                    How it works
                  </h2>
                  <p className="mt-3 text-[#716a5f] text-base max-w-md mx-auto">
                    Three steps. That&apos;s it.
                  </p>
                </div>
                </Slide>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {STEPS.map((step) => (
                    <Slide key={step.step} inView direction="up" offset={40}>
                    <article
                      className="bg-[#f4eee4] rounded-3xl p-6 border border-[#e4ded2] shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#14171f] text-[#e26a45]">
                          <step.icon className="size-5" />
                        </span>
                        <span className="font-mono text-sm font-semibold text-[#8c8477]">{step.step}</span>
                      </div>
                      <h3 className="mt-4 font-display font-bold text-lg text-[#14171f]">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#716a5f]">{step.description}</p>
                    </article>
                    </Slide>
                  ))}
                </div>
              </section>

              {/* Features */}
              <section id="features" className="scroll-mt-6 py-8 sm:py-12 lg:py-14 border-t border-[#ece6d9]/60 bg-[#f4f1ea]/60 -mx-4 sm:-mx-8 lg:-mx-12 px-4 sm:px-8 lg:px-12">
                <Slide inView direction="up" offset={30}>
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14171f] tracking-tight">
                    Everything you need
                  </h2>
                  <p className="mt-3 text-[#716a5f] text-base max-w-md mx-auto">
                    A focused tool built to do one thing well.
                  </p>
                </div>
                </Slide>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {FEATURES.map((feat) => (
                    <Slide key={feat.title} inView direction="up" offset={40}>
                    <article
                      className="bg-[#faf8f4] rounded-3xl p-6 border border-[#e4ded2] shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    >
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#e26a45]/15 text-[#e26a45]">
                        <feat.icon className="size-5" />
                      </span>
                      <h3 className="mt-4 font-display font-bold text-lg text-[#14171f]">{feat.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#716a5f]">{feat.description}</p>
                    </article>
                    </Slide>
                  ))}
                </div>
              </section>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-6 py-8 sm:py-12 lg:py-14 border-t border-[#ece6d9]/60">
                <Slide inView direction="up" offset={30}>
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14171f] tracking-tight">
                    Frequently asked questions
                  </h2>
                </div>
                </Slide>
                <div className="mt-10 max-w-3xl mx-auto flex flex-col gap-3">
                  {FAQ_ITEMS.map((item) => {
                    const open = faqOpen === item.q;
                    return (
                      <Slide key={item.q} inView direction="up" offset={30}>
                      <div
                        className="rounded-2xl border border-[#ded7ca] bg-[#f4eee4] overflow-hidden"
                      >
                        <h3>
                          <button
                            type="button"
                            onClick={() => setFaqOpen(open ? null : item.q)}
                            aria-expanded={open}
                            aria-controls={`faq-panel-${item.q.replace(/\s+/g, "-")}`}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#14171f] hover:bg-[#eee7da] transition-colors cursor-pointer"
                          >
                            <span>{item.q}</span>
                            <ChevronDown
                              className={`size-4 shrink-0 text-[#8c8477] transition-transform ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                        </h3>
                        {open && (
                          <div
                            id={`faq-panel-${item.q.replace(/\s+/g, "-")}`}
                            className="px-5 pb-4 pt-0 text-sm leading-relaxed text-[#716a5f]"
                          >
                            {item.a}
                          </div>
                        )}
                      </div>
                      </Slide>
                    );
                  })}
                </div>
              </section>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#ece6d9] py-8 mt-4">
            <div className="mx-auto max-w-[1360px] flex flex-col items-center justify-between gap-4 text-xs text-[#716a5f] sm:flex-row">
              <span className="font-semibold text-[#14171f]">VidGet</span>
              <nav
                aria-label="Footer links"
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
              >
                <Link href="/privacy" className="hover:text-[#e26a45] transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-[#e26a45] transition-colors">Terms</Link>
                <Link href="/dmca" className="hover:text-[#e26a45] transition-colors">DMCA</Link>
                <Link href="/contact" className="hover:text-[#e26a45] transition-colors">Contact</Link>
              </nav>
              <span className="text-center">
                © {new Date().getFullYear()} VidGet. For personal use only.
              </span>
            </div>
            <p className="mt-4 text-center text-[11px] text-[#8c8477]">
              Only download content you have permission to download.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
