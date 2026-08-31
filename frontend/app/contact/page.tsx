"use client";

import { useState } from "react";
import InfoPageLayout from "@/components/InfoPageLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";

const CONTACT_EMAIL = "support@vidget.app";

const TOPICS = [
  { value: "general", label: "General inquiry" },
  { value: "support", label: "Technical support" },
  { value: "privacy", label: "Privacy" },
  { value: "dmca", label: "DMCA / Copyright" },
  { value: "feedback", label: "Feedback" },
];

export default function ContactPage() {
  const [topic, setTopic] = useState("general");

  return (
    <InfoPageLayout
      title="Contact"
      updated="August 31, 2026"
    >
      <p>
        Have a question about VidGet, a suggestion, or a copyright inquiry?
        Fill out the form below and we&apos;ll get back to you as soon as we
        can. Your email opens in your own mail client — we never store your
        message on our servers.
      </p>

      <form
        action={`mailto:${CONTACT_EMAIL}`}
        method="post"
        encType="text/plain"
        className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              name="name"
              placeholder="Your name"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-topic">Topic</Label>
          <Select value={topic} onValueChange={setTopic} name="topic">
            <SelectTrigger id="contact-topic" className="w-full">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>How can we help?</SelectLabel>
                {TOPICS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <input type="hidden" name="topic" value={topic} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="How can we help?"
            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button
          type="submit"
          className="w-full sm:w-auto rounded-full px-6 font-bold uppercase tracking-wide"
        >
          <Send />
          Send message
        </Button>

        <p className="text-xs text-muted-foreground">
          This opens your default email app with the message pre-filled. For
          urgent DMCA notices, please also reference the specific URL involved.
        </p>
      </form>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Other Resources</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <a className="text-[#e26a45] underline" href="/privacy">Privacy Policy</a>
            — how your data is handled.
          </li>
          <li>
            <a className="text-[#e26a45] underline" href="/terms">Terms of Service</a>
            — acceptable use of the service.
          </li>
          <li>
            <a className="text-[#e26a45] underline" href="/dmca">DMCA / Copyright Policy</a>
            — reporting alleged infringement.
          </li>
        </ul>
      </section>
    </InfoPageLayout>
  );
}
