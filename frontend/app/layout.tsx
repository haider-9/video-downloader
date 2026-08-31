import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VidGet — Unlock Any Video | 4K & MP3 Downloader",
  description:
    "Paste any video URL and download in pristine 4K, 1080p, or MP3 with multi-language audio track support. Works with YouTube, TikTok, Instagram, Twitter/X, and 1000+ sites.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "tiktok downloader",
    "4k video download",
    "mp3 converter",
    "instagram video download",
    "vidget",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf9f5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#f7f5ef] text-[#14171f] font-sans antialiased selection:bg-[#14171f] selection:text-white">
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
