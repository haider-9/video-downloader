"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { User, Clock, ChevronLeft, Languages } from "lucide-react";
import type {
  VideoInfo,
  FormatInfo,
  DownloadState,
  AudioLanguage,
} from "@/lib/types";
import { downloadFormat } from "@/lib/api";
import FormatCard from "./FormatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPanelProps {
  video: VideoInfo;
  onReset: () => void;
}

type DownloadMap = Record<string, DownloadState>;

export default function VideoPanel({ video, onReset }: VideoPanelProps) {
  const defaultFormat =
    video.formats.find((f) => f.is_default) ?? video.formats[0];
  const [selectedId, setSelectedId] = useState<string>(
    defaultFormat?.format_id ?? ""
  );
  const [downloads, setDownloads] = useState<DownloadMap>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  const languages: AudioLanguage[] = video.audio_languages ?? [];

  const [selectedLangCode, setSelectedLangCode] = useState<string>(() => {
    if (!languages.length) return "";
    const original = languages.find((l) => l.is_original);
    return (original ?? languages[0]).code;
  });

  const selectedLang = languages.find((l) => l.code === selectedLangCode) ?? null;

  function getState(id: string): DownloadState {
    return downloads[id] ?? { status: "idle", progress: 0, error: null };
  }

  function setState(id: string, patch: Partial<DownloadState>) {
    setDownloads((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { status: "idle", progress: 0, error: null }), ...patch },
    }));
  }

  // Resolve which primary/audio stream ids to request for a given format,
  // honoring the user's selected audio language.
  function resolveDownload(format: FormatInfo): {
    format_id: string;
    audio_format_id: string | null;
  } {
    const langId = selectedLang?.format_id;
    const isVideoOnly = format.has_video && !format.has_audio;
    const isAudioOnly = !format.has_video && format.has_audio;

    if (isAudioOnly) {
      // Download the chosen language's audio stream directly.
      return langId ? { format_id: langId, audio_format_id: null } : { format_id: format.format_id, audio_format_id: null };
    }
    if (isVideoOnly) {
      // Merge the chosen language's audio into the video-only stream.
      return { format_id: format.format_id, audio_format_id: langId ?? format.audio_format_id ?? null };
    }
    // Combined stream (video+audio already muxed) — language is baked in.
    return { format_id: format.format_id, audio_format_id: null };
  }

  const handleDownload = useCallback(
    async (format: FormatInfo) => {
      const id = format.format_id;
      const state = getState(id);

      if (
        state.status === "pending" ||
        state.status === "downloading" ||
        state.status === "processing"
      ) {
        return;
      }

      const { format_id, audio_format_id } = resolveDownload(format);

      const controller = new AbortController();
      abortControllers.current[id] = controller;
      setState(id, { status: "pending", progress: 0, error: null });

      const error = await downloadFormat({
        url: video.webpage_url,
        format_id,
        audio_format_id,
        signal: controller.signal,
        onProgress: (pct) => {
          if (pct < 0) {
            setState(id, { status: "downloading", progress: -1 });
          } else if (pct === 100) {
            setState(id, { status: "processing", progress: 100 });
          } else {
            setState(id, { status: "downloading", progress: pct });
          }
        },
      });

      if (error) {
        if (error.code === "ABORTED") {
          setState(id, { status: "idle", progress: 0, error: null });
        } else {
          setState(id, { status: "error", progress: 0, error: error.error });
          toast.error("Download failed", { description: error.error });
        }
      } else {
        setState(id, { status: "done", progress: 100, error: null });
        toast.success("Download complete", {
          description: `${video.title} saved to your device.`,
        });
        setTimeout(() => {
          setState(id, { status: "idle", progress: 0, error: null });
        }, 6000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [video, downloads, selectedLangCode]
  );

  const hasActiveDl = Object.values(downloads).some(
    (d) =>
      d.status === "pending" ||
      d.status === "downloading" ||
      d.status === "processing"
  );

  useEffect(() => {
    return () => {
      for (const controller of Object.values(abortControllers.current)) {
        controller.abort();
      }
      abortControllers.current = {};
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card
        className="gap-0 p-0"
        aria-label="Video information and download options"
      >
        {/* Header row */}
        <CardHeader className="flex-row items-center justify-between border-b">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Video found
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={hasActiveDl}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Search for a different video"
          >
            <ChevronLeft />
            New search
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Video metadata */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {video.thumbnail && (
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-48">
                <Image
                  src={video.thumbnail}
                  alt={`Thumbnail for ${video.title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 192px"
                  unoptimized
                />
              </div>
            )}

            <div className="flex min-w-0 flex-col justify-center gap-1.5">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                {video.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {video.uploader && (
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" />
                    {video.uploader}
                  </span>
                )}
                {video.platform && (
                  <>
                    {video.uploader && <span aria-hidden="true">·</span>}
                    <span>{video.platform}</span>
                  </>
                )}
                {video.duration_human && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {video.duration_human}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Audio language selector */}
          {languages.length > 1 && (
            <div className="mt-6 border-t pt-5">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Languages className="size-4 text-primary" />
                Audio language
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose which audio track to merge into your download.
              </p>
              <div
                role="listbox"
                aria-label="Select audio language"
                className="flex flex-wrap gap-2"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code || "orig"}
                    type="button"
                    role="option"
                    aria-selected={selectedLangCode === lang.code}
                    onClick={() => setSelectedLangCode(lang.code)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      selectedLangCode === lang.code
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-surface-muted text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formats */}
          <div className="mt-6 border-t pt-5">
            <p className="mb-3 text-sm font-medium text-foreground">
              Available downloads
            </p>
            <div
              role="radiogroup"
              aria-label="Select download quality and format"
              className="flex flex-col gap-2"
            >
              {video.formats.map((fmt) => (
                <FormatCard
                  key={fmt.format_id}
                  format={fmt}
                  isSelected={selectedId === fmt.format_id}
                  onSelect={() => setSelectedId(fmt.format_id)}
                  onDownload={() => {
                    setSelectedId(fmt.format_id);
                    handleDownload(fmt);
                  }}
                  downloadState={getState(fmt.format_id)}
                  activeLanguage={
                    fmt.has_video && !fmt.has_audio ? selectedLang?.label : undefined
                  }
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
