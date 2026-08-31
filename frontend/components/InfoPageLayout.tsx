import Link from "next/link";

interface InfoPageLayoutProps {
  title: string;
  updated?: string;
  children: React.ReactNode;
}

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/dmca", label: "DMCA / Copyright" },
  { href: "/contact", label: "Contact" },
];

export default function InfoPageLayout({
  title,
  updated,
  children,
}: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#e8ecf2]">
      <div className="mx-auto w-full max-w-[1360px] bg-[#faf8f4] min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-5 border-b border-[#ece6d9]/60">
          <Link href="/" className="group flex items-center gap-2.5" title="VidGet" aria-label="VidGet home">
            <div className="relative size-9 sm:size-10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full">
                <path d="M18 20 L82 20 L48 84 L32 84 L58 34 L18 34 Z" fill="#14171f" />
                <polygon points="66,20 82,20 70,36" fill="#e26a45" />
                <polygon points="36,46 52,56 36,66" fill="#e26a45" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-[#14171f]">VidGet</span>
          </Link>
          <nav aria-label="Footer" className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#14171f]">
            <Link href="/" className="hover:text-[#e26a45] transition-colors">Downloader</Link>
            <Link href="/contact" className="hover:text-[#e26a45] transition-colors">Contact</Link>
          </nav>
        </header>

        {/* Content */}
        <main id="main-content" className="flex-1 px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
          <article className="mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[#8c8477]">
              <Link href="/" className="hover:text-[#e26a45] transition-colors">Home</Link>
              <span aria-hidden="true" className="mx-1.5">/</span>
              <span className="font-medium text-[#14171f]">{title}</span>
            </nav>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#14171f] tracking-tight">
              {title}
            </h1>
            {updated && (
              <p className="mt-2 text-xs text-[#8c8477]">
                Last updated: <time dateTime={updated}>{updated}</time>
              </p>
            )}
            <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#3a3f4a]">
              {children}
            </div>
          </article>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#ece6d9] py-8">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-between gap-4 text-xs text-[#716a5f] sm:flex-row">
            <span className="font-semibold text-[#14171f]">VidGet</span>
            <nav aria-label="Footer legal links" className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-[#e26a45] transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
            <span>© {new Date().getFullYear()} VidGet. For personal use only.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
