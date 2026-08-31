import {
  Layers,
  Film,
  Music,
  Zap,
  Globe,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";

const FEATURES = [
  {
    icon: Layers,
    title: "Multiple qualities",
    description: "4K, 1080p, 720p, 480p, and more. Download the exact resolution you need.",
  },
  {
    icon: Film,
    title: "Video + Audio",
    description: "When a stream is video-only, we automatically merge the best audio track so you always get a complete file.",
  },
  {
    icon: Music,
    title: "Audio-only downloads",
    description: "Extract the audio track for music, podcasts, or lectures without the video.",
  },
  {
    icon: Zap,
    title: "Fast processing",
    description: "We stream the file directly from the source — no re-encoding unless merging tracks — so downloads start quickly.",
  },
  {
    icon: Globe,
    title: "Hundreds of sources",
    description: "Powered by yt-dlp — supports YouTube, Vimeo, TikTok, Twitter/X, Dailymotion, Reddit, and thousands of other sites.",
  },
  {
    icon: ShieldCheck,
    title: "No account required",
    description: "Paste a URL, pick your quality, and download. No sign-up, no tracking, no subscriptions.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-16 border-y border-border bg-surface-muted py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            A focused tool built to do one thing well.
          </p>
        </Reveal>

        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <StaggerItem key={feat.title}>
              <Card className="h-full gap-0 p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="pt-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feat.icon className="size-5" />
                  </span>
                  <CardTitle className="mt-4 text-base">{feat.title}</CardTitle>
                  <CardDescription className="mt-1 leading-relaxed">
                    {feat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
