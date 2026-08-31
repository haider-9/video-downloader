"use client";

import { useRef, useState } from "react";
import { Link2, X, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) return "Please enter a URL to get started.";
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "Please enter a valid URL starting with http:// or https://";
    }
    try {
      new URL(trimmed);
    } catch {
      return "This doesn't look like a valid URL. Please check and try again.";
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onAnalyze(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    if (error) setError(null);
  }

  function handleClear() {
    setValue("");
    setError(null);
    inputRef.current?.focus();
  }

  const inputId = "video-url-input";
  const errorId = "url-input-error";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full"
      aria-label="Video URL input form"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-primary/5 sm:flex-row sm:items-center">
        {/* Input wrapper */}
        <div className="relative flex-1">
          <span
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground"
            aria-hidden="true"
          >
            <Link2 className="size-4" />
          </span>
          <Input
            ref={inputRef}
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={value}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Paste a video URL — YouTube, Vimeo, TikTok, and more…"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            className="h-12 rounded-xl border-0 bg-transparent pl-10 pr-10 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-12"
          />

          {/* Clear button */}
          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear URL"
              className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          size="lg"
          className="h-12 rounded-xl px-6 text-sm font-semibold sm:h-12"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              <span>Analyzing…</span>
            </>
          ) : (
            <>
              <Search className="size-4" />
              <span>Analyze</span>
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-3 flex items-center gap-1.5 text-sm text-destructive"
        >
          <span className="inline-block size-1.5 rounded-full bg-destructive" />
          {error}
        </p>
      )}

      {/* Disclaimer */}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Only download content you own or have permission to download. Supports
        publicly accessible videos only.
      </p>
    </form>
  );
}
