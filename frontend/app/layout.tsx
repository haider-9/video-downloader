import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL, siteJsonLd } from "@/lib/seo";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VidGet — Unlock Any Video | 4K Video & MP3 Downloader",
    template: "%s | VidGet — Video Downloader",
  },
  description:
    "Free online video downloader. Paste any URL and download in 4K, 1080p, 720p, or MP3 with multi-language audio tracks. Works with YouTube, TikTok, Instagram, Twitter/X, Vimeo, and 1000+ sites. No account needed.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "tiktok downloader",
    "instagram video downloader",
    "twitter video downloader",
    "vimeo downloader",
    "4k video download",
    "1080p video download",
    "mp3 converter",
    "online video downloader",
    "free video downloader",
    "download video from url",
    "vidget",
  ],
  applicationName: "VidGet",
  authors: [{ name: "VidGet" }],
  creator: "VidGet",
  publisher: "VidGet",
  category: "Web Application",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "VidGet",
    title: "VidGet — Unlock Any Video | 4K Video & MP3 Downloader",
    description:
      "Paste any video URL and download in pristine 4K, 1080p, or MP3 with multi-language audio tracks. Works with YouTube, TikTok, Instagram, Twitter/X, and 1000+ sites.",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "VidGet — free online video downloader for YouTube, TikTok, Instagram and more",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VidGet — Unlock Any Video | 4K Video & MP3 Downloader",
    description:
      "Paste any video URL and download in 4K, 1080p, or MP3 with multi-language audio tracks. Works with 1000+ sites.",
    images: ["/og-image.svg"],
    site: "@vidget",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf9f5",
};

const structuredData = siteJsonLd();

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
      <head />
      <body className="min-h-screen bg-[#f7f5ef] text-[#14171f] font-sans antialiased selection:bg-[#14171f] selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#14171f] focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
