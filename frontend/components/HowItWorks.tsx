import { ClipboardPaste, ListChecks, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/reveal";

const STEPS = [
  {
    icon: ClipboardPaste,
    step: "01",
    title: "Paste your URL",
    description:
      "Copy the link from any supported video platform and paste it into the input. Works with YouTube, Vimeo, TikTok, Twitter, and hundreds more.",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "Choose quality",
    description:
      "We analyse the video and show all available qualities and formats — from 4K to 360p, video with audio or audio-only.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download",
    description:
      "Hit Download and the file is processed and saved directly to your device. No accounts, no waiting rooms, no popups.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Three steps. That&apos;s it.
          </p>
        </Reveal>

        <Stagger className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <StaggerItem key={step.step}>
              <Card className="group h-full gap-0 p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="flex-row items-center justify-between border-b px-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm font-semibold text-muted-foreground">
                    {step.step}
                  </span>
                </CardHeader>
                <CardContent className="pt-6">
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardDescription className="mt-1.5 leading-relaxed">
                    {step.description}
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
