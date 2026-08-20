import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import logo from "@/public/venuenest-logo.png";
import WaitlistForm from "./waitlist-form";

export const dynamic = "force-dynamic";

// The homepage is the primary VenueNest waitlist.
const DEFAULT_SLUG = "venuenest";

export default async function Home() {
  let count = 0;
  try {
    // Only people still waiting — someone who has been invited off the list
    // (sent their "your spot is ready" email) no longer counts as in line.
    count = await prisma.waitlistEntry.count({
      where: { project: { slug: DEFAULT_SLUG }, invitedAt: null },
    });
  } catch {
    // DB not reachable at render time (env not set yet) — still show the form.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <Image src={logo} alt="VenueNest" width={44} height={34} priority />
            <span className="font-serif text-lg tracking-tight text-ink">
              VenueNest
            </span>
          </div>
          <h1 className="mt-9 font-serif text-4xl tracking-tight text-ink">
            Join the waitlist
          </h1>
          <p className="mt-3 leading-relaxed text-[#6e6e6e]">
            VenueNest is the software that runs your whole wedding venue, from the
            first inquiry to the last dance. Leave your email and we&apos;ll let you
            in as spots open up.
          </p>
        </div>

        <div className="rounded-2xl border border-[#ecece3] bg-white p-7 shadow-sm">
          <WaitlistForm />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-[#8f8f8f]">
          <span>We&apos;ll only email you about your spot.</span>
          {count > 0 && (
            <span className="font-serif text-sm text-sage-deep">
              {count.toLocaleString()} in line
            </span>
          )}
        </div>
      </div>

      {/* Quiet entry point for the venue owner's own admin view. */}
      <Link
        href="/admin"
        className="fixed bottom-4 right-4 rounded-full border border-[#ecece3] bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#8f8f8f] shadow-sm backdrop-blur transition-colors hover:border-sage-line hover:text-sage-deep"
      >
        Admin
      </Link>
    </main>
  );
}
