import { Download } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-white">
              <Download className="size-4" />
            </span>
            <span className="text-sm font-semibold text-foreground">VidGet</span>
          </div>

          {/* Nav */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1">
              {[
                { href: "#how-it-works", label: "How it works" },
                { href: "#features", label: "Features" },
                { href: "#faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal / credit */}
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            © {year} VidGet. For personal use only.{" "}
            <br className="sm:hidden" />
            Only download content you have permission to download.
          </p>
        </div>
      </div>
    </footer>
  );
}
