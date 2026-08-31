import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "DMCA / Copyright Policy",
  description:
    "VidGet DMCA and Copyright Policy — how to report alleged copyright infringement involving the service.",
};

export default function DmcaPage() {
  return (
    <InfoPageLayout
      title="DMCA / Copyright Policy"
      updated="August 31, 2026"
    >
      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Respect for Intellectual Property</h2>
        <p>
          VidGet respects the intellectual property rights of others and expects
          its users to do the same. In accordance with the Digital Millennium
          Copyright Act (DMCA) and other applicable laws, we respond to valid
          notices of alleged copyright infringement.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">What VidGet Is (and Is Not)</h2>
        <p>
          VidGet is a technical tool that downloads media from publicly
          accessible URLs that you provide. We do not host, store, or upload the
          videos or audio files on our servers, and we do not create or publish
          any of the content that users download. Accordingly, we do not control
          the content that third parties upload to their own platforms.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Filing a DMCA Notice</h2>
        <p>
          If you believe that any content you have the rights to is being
          infringed through the use of our service, please send us a DMCA
          takedown notice that includes the following information:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Identification of the copyrighted work you claim has been infringed.</li>
          <li>Identification of the material that is claimed to be infringing, including enough information for us to locate it (such as the source URL).</li>
          <li>Your contact information, including your name and email address.</li>
          <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
          <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or are authorized to act on the owner&apos;s behalf.</li>
          <li>Your physical or electronic signature.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">Counter-Notification</h2>
        <p>
          If you believe that material you provided was removed or access was
          disabled as a result of mistaken identification, you may submit a
          counter-notification containing your contact information, a statement
          of good faith, and a signature, in accordance with applicable law.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-xl text-[#14171f]">How to Submit</h2>
        <p>
          Please send all DMCA notices and counter-notifications to us through
          our <a className="text-[#e26a45] underline" href="/contact">Contact page</a>.
          We aim to review and respond to valid notices promptly.
        </p>
        <p>
          Please note that because we operate as a neutral download tool rather
          than a content host, the most effective and appropriate action for
          material hosted on another platform is to report it directly to that
          platform&apos;s copyright process.
        </p>
      </section>
    </InfoPageLayout>
  );
}
