import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "VidGet",
    description:
      "Free online video downloader — paste any URL and download in 4K, 1080p, or MP3.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#fbf9f5",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    lang: "en",
    categories: ["tools", "multimedia", "utilities"],
    shortcuts: [
      {
        name: "New download",
        url: "/",
        description: "Start a new video download",
      },
    ],
  };
}
