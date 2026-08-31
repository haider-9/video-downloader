import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/reveal";

const FAQ_ITEMS = [
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
    q: "Can I download private videos?",
    a: "No. VidGet does not support private, login-required, or DRM-protected content. Attempting to download such videos will return an error.",
  },
  {
    q: "Is there a file size limit?",
    a: "By default the server caps downloads at 2 GB. For most videos this is more than enough — a two-hour 1080p video is typically 2–4 GB, so very long high-resolution videos may need a lower quality setting.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={0.05}>
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border bg-card px-6 shadow-sm"
          >
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
