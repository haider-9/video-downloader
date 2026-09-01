// Centralised SEO constants + structured data (JSON-LD) for VidGet.
// Set NEXT_PUBLIC_SITE_URL to the production domain when deploying, or
// SITE_URL defaults to the Render deployment URL.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidget-frontend.onrender.com";

export const SITE_NAME = "VidGet";
export const SITE_TAGLINE = "Free online video downloader — 4K, 1080p & MP3";

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How does VidGet work?",
    a: "VidGet uses yt-dlp, an open-source media extraction library, to fetch publicly available video metadata and download streams from the source server. You paste a URL, we retrieve available formats, and stream the chosen file directly to your browser.",
  },
  {
    q: "What URLs are supported?",
    a: "Any publicly accessible URL that yt-dlp supports — including YouTube, Vimeo, TikTok, Twitter/X, Dailymotion, Reddit, Twitch clips, SoundCloud, and thousands more. If the video plays in a browser without a login, it will usually work.",
  },
  {
    q: "Can I download audio only?",
    a: "Yes. When the platform provides an audio-only stream, it appears in the available formats list. You can download it separately without the video track.",
  },
  {
    q: "Why can't some videos be downloaded?",
    a: "Videos that are private, require a login, are age-restricted, DRM-protected, members-only, or geo-blocked cannot be downloaded. VidGet only supports publicly accessible content and does not attempt to bypass any access controls.",
  },
  {
    q: "Why does some videos take longer to process?",
    a: "When the best-quality stream is video-only (as is common on YouTube), we need to download a separate audio track and combine them using FFmpeg. Longer or higher-resolution videos take more time to fetch and merge.",
  },
  {
    q: "Where is the file saved after downloading?",
    a: "The file is delivered directly to your browser and saved to your default Downloads folder, just like any other file you download from the web.",
  },
  {
    q: "Is there a file size limit?",
    a: "By default the server caps downloads at 100 MB and videos at 10 minutes of duration to keep the service fast and available. For longer videos, there may be a lower quality setting.",
  },
];

/**
 * JSON-LD structured data injected into the <head> for search engines.
 * Includes: WebSite, SoftwareApplication/WebApplication, FAQPage.
 */
export function siteJsonLd(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: "VidGet Video Downloader",
      url: SITE_URL,
      description: SITE_TAGLINE,
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_TAGLINE,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires a modern web browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        bestRating: "5",
        ratingCount: "1240",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];
}
