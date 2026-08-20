import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/venuenest-logo.png";

export const metadata: Metadata = {
  title: "VenueNest — Spot Claimed",
  robots: { index: false },
};

// Landing page for the "Claim your spot" button in the ready email. Mirrors the
// waitlist page's look, but just confirms the claim.
export default function ClaimedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Image src={logo} alt="VenueNest" width={44} height={34} priority />
          <span className="font-serif text-lg tracking-tight text-ink">VenueNest</span>
        </div>

        <div className="rounded-2xl border border-[#ecece3] bg-white p-9 shadow-sm">
          <h1 className="font-serif text-3xl tracking-tight text-ink">
            Thanks for claiming your spot!
          </h1>
          <p className="mt-4 leading-relaxed text-[#6e6e6e]">
            A representative will be reaching out to your email shortly to get you
            set up. We can&apos;t wait to help you run your whole venue, from the
            first inquiry to the last dance.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-[#8f8f8f] transition-colors hover:text-sage-deep"
        >
          &larr; Back to the site
        </Link>
      </div>
    </main>
  );
}
