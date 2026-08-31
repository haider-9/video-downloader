import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "VidGet Terms of Service — acceptable use, copyright responsibility, and limitations of liability for using the video downloader.",
};

export default function TermsPage() {
  return (
    <InfoPageLayout
      title="Terms of Service"
      updated="August 31, 2026"
    >
      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Acceptance of Terms</h2>
        <p>
          By accessing or using VidGet, you agree to be bound by these Terms of
          Service and all applicable laws and regulations. If you do not agree
          with any part of these terms, please do not use the service.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Use of the Service</h2>
        <p>
          VidGet provides tools to download publicly available videos and audio
          for your personal, non-commercial use. You agree to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Use the service only for lawful purposes and in compliance with all applicable laws.</li>
          <li>Only download content that you own, have created, or have explicit permission to download.</li>
          <li>Respect the copyright, intellectual property, and terms of service of any third-party platform.</li>
          <li>Not use the service to bypass DRM, access controls, or download private, age-restricted, members-only, or otherwise restricted content.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Copyright &amp; Responsibility</h2>
        <p>
          You are solely responsible for the content you choose to download and
          how you use it. VidGet merely provides a technical tool that fetches
          data from publicly accessible URLs you supply. We do not host, upload,
          distribute, or claim ownership of any video or audio files.
        </p>
        <p>
          Downloading or distributing copyrighted material without permission
          may violate applicable law and the rights of the copyright holder. It
          is your responsibility to ensure your use is lawful.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">No Warranty</h2>
        <p>
          The service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, whether express or implied, including
          but not limited to implied warranties of merchantability, fitness for
          a particular purpose, and non-infringement. We do not warrant that the
          service will be uninterrupted, error-free, or that a given source will
          always be supported.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, VidGet and its operators shall
          not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits or revenues, whether incurred
          directly or indirectly, or any loss of data arising from your use of
          the service.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Availability of the Service</h2>
        <p>
          We may update, suspend, or discontinue the service (or any feature) at
          any time without prior notice. Supported sites and formats may change,
          and some videos may not be downloadable due to platform restrictions.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Changes to These Terms</h2>
        <p>
          We may revise these Terms of Service from time to time. The most
          current version will always be posted on this page, and the date above
          indicates when it was last updated. Continued use of the service after
          changes constitutes acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Contact</h2>
        <p>
          If you have any questions about these Terms, please reach out through
          our <a className="text-[#e26a45] underline" href="/contact">Contact page</a>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
