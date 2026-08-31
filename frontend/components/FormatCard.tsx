"use client";

import {
  Download,
  Check,
  Video,
  Music,
  Languages,
} from "lucide-react";
import type { FormatInfo } from "@/lib/types";
import type { DownloadState } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormatCardProps {
  format: FormatInfo;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  downloadState: DownloadState;
  activeLanguage?: string;
}

export default function FormatCard({
  format,
  isSelected,
  onSelect,
  onDownload,
  downloadState,
  activeLanguage,
}: FormatCardProps) {
  const { status, progress, error } = downloadState;
  const isBusy =
    status === "pending" || status === "downloading" || status === "processing";
  const isDone = status === "done";

  return (
    <Card
      className={cn(
        "gap-0 p-4 transition-all cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "hover:border-muted-foreground/30 hover:shadow-sm"
      )}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Format info */}
        <div className="flex items-start gap-3">
          {/* Radio indicator */}
          <span
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              isSelected
                ? "border-primary bg-primary"
                : "border-muted-foreground/40"
            )}
            aria-hidden="true"
          >
            {isSelected && <span className="size-1.5 rounded-full bg-white" />}
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {format.label}
              </span>
              <Badge variant="secondary">{format.container}</Badge>
              {format.is_default && <Badge>Best</Badge>}
              {activeLanguage && (
                <Badge variant="accent" className="gap-1">
                  <Languages className="size-3" />
                  {activeLanguage}
                </Badge>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{format.quality_label}</span>
              {format.resolution && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{format.resolution}</span>
                </>
              )}
              {format.fps && format.fps > 30 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{format.fps}fps</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                {format.has_video ? <Video className="size-3.5" /> : null}
                {format.has_audio ? <Music className="size-3.5" /> : null}
                <span>
                  {format.has_video && format.has_audio
                    ? "Video + Audio"
                    : format.has_video
                      ? "Video only"
                      : "Audio only"}
                </span>
              </span>
              {format.filesize_human && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{format.filesize_human}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Download button */}
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          disabled={isBusy}
          aria-label={`Download ${format.label} ${format.container}`}
          aria-busy={isBusy}
          className={cn(
            "shrink-0",
            isDone &&
              "bg-success text-white hover:bg-success/90 cursor-default"
          )}
        >
          {isBusy ? (
            <>
              <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>{statusLabel(status)}</span>
            </>
          ) : isDone ? (
            <>
              <Check />
              <span>Downloaded</span>
            </>
          ) : (
            <>
              <Download />
              <span>Download</span>
            </>
          )}
        </Button>
      </div>

      {/* Progress bar */}
      {isSelected &&
        (status === "downloading" ||
          status === "processing" ||
          isBusy) && (
          <div className="mt-3">
            <div
              className={cn(
                "h-2 w-full overflow-hidden rounded-full bg-secondary",
                progress < 0 && "relative overflow-hidden"
              )}
              role="progressbar"
              aria-valuenow={progress >= 0 ? progress : undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Download progress"
            >
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-300"
                style={{
                  width: progress >= 0 ? `${progress}%` : "40%",
                  ...(progress < 0
                    ? {
                        animation:
                          "progress-indeterminate 1.5s ease-in-out infinite",
                      }
                    : {}),
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {statusDescription(status, progress)}
            </p>
          </div>
        )}

      {/* Error */}
      {isSelected && status === "error" && error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-destructive" />
          <span>{error}</span>
        </p>
      )}
    </Card>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Starting…";
    case "downloading":
      return "Downloading…";
    case "processing":
      return "Processing…";
    default:
      return "Working…";
  }
}

function statusDescription(status: string, progress: number): string {
  switch (status) {
    case "pending":
      return "Preparing download…";
    case "downloading":
      return progress >= 0 ? `Downloading… ${progress}%` : "Downloading…";
    case "processing":
      return "Processing and combining streams…";
    default:
      return "Working…";
  }
}
