import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "VidGet Privacy Policy — how we handle your data. No accounts, no tracking of your personal information beyond what is needed to process a download.",
};

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Privacy Policy"
      updated="August 31, 2026"
    >
      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Overview</h2>
        <p>
          VidGet is designed to be a simple, privacy-friendly video downloader.
          We do not require you to create an account, and we do not sell your
          personal information to anyone. This policy explains what little data
          is processed when you use the service and how it is handled.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Information You Provide</h2>
        <p>
          When you paste a video URL to analyze or download, that URL is sent to
          our server so we can retrieve the video metadata and download the
          requested media. The URL is used only to fulfill your request and is
          not stored long-term.
        </p>
        <p>
          We do not collect names, email addresses, or any other personal
          identifiers. There is no account creation and no profile system.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Technical Data</h2>
        <p>
          Like most websites, our server logs may automatically record basic
          technical information such as your IP address, browser type, and the
          pages you visit. This data is used only for operational purposes such
          as security, abuse prevention, and diagnosing technical issues. Logs
          are retained only as long as reasonably necessary and are not used to
          build a profile of you.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Cookies and Local Storage</h2>
        <p>
          We may use essential cookies or local storage where necessary for the
          basic functionality of the site. We do not use advertising cookies or
          third-party tracking cookies. Downloaded files are delivered directly
          to your browser and are not uploaded or stored on our servers beyond
          the temporary processing window required to complete a download.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Third-Party Services</h2>
        <p>
          To fetch public video data, we rely on open-source extraction
          libraries (such as yt-dlp) that interact with the relevant platforms.
          We do not share your personal information with these platforms, and
          we only process publicly available content you provide a URL for.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Children&apos;s Privacy</h2>
        <p>
          VidGet is a general audience service and is not directed to children
          under 13. We do not knowingly collect personal information from
          children. If you believe a child has provided us with personal
          information, please contact us and we will take steps to delete it.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Your Rights</h2>
        <p>
          Because we do not collect personal accounts or store your uploaded
          files, there is typically no personal data held about you to review,
          correct, or delete. If you have any concerns or questions about your
          privacy when using the service, you may contact us and we will be
          happy to help.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Contact</h2>
        <p>
          If you have any questions about this Privacy Policy, please reach out
          through our <a className="text-[#e26a45] underline" href="/contact">Contact page</a>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
