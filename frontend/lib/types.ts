export interface FormatInfo {
  format_id: string;
  label: string;
  quality_label: string;
  container: string;
  has_video: boolean;
  has_audio: boolean;
  resolution: string | null;
  fps: number | null;
  filesize_approx: number | null;
  filesize_human: string | null;
  audio_format_id: string | null;
  audio_language?: string | null;
  is_default: boolean;
}

export interface AudioLanguage {
  code: string;
  label: string;
  format_id: string;
  is_original: boolean;
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  duration_human: string | null;
  uploader: string | null;
  platform: string | null;
  webpage_url: string;
  formats: FormatInfo[];
  audio_languages?: AudioLanguage[];
}

export interface AnalyzeSuccess {
  success: true;
  data: VideoInfo;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type AnalyzeResult = AnalyzeSuccess | ApiError;

export type DownloadStatus =
  | "idle"
  | "pending"
  | "downloading"
  | "processing"
  | "done"
  | "error";

export interface DownloadState {
  status: DownloadStatus;
  progress: number; // 0–100
  error: string | null;
}
