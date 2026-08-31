import { AlertTriangle, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-2xl border border-destructive/25 bg-destructive/5 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-destructive" aria-hidden="true">
          <AlertTriangle className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-destructive">
            Something went wrong
          </p>
          <p className="mt-0.5 text-sm text-destructive/80">{message}</p>

          {(onRetry || onDismiss) && (
            <div className="mt-3 flex items-center gap-2">
              {onRetry && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onRetry}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  <RotateCcw className="size-3.5" />
                  Try again
                </Button>
              )}
              {onDismiss && onRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>

        {onDismiss && !onRetry && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="shrink-0 text-destructive/60 transition-opacity hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
