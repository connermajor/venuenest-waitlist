import { prisma } from "@/lib/prisma";
import WaitlistForm from "./waitlist-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  let count = 0;
  try {
    count = await prisma.waitlistEntry.count();
  } catch {
    // DB not reachable at render time (env not set yet) — still show the form.
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-neutral-900" />
            <span className="text-sm font-mono font-medium tracking-tight text-neutral-900">
              VenueNest
            </span>
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-neutral-900">
            Join the waitlist
          </h1>
          <p className="mt-3 leading-relaxed text-neutral-500">
            Book and manage venues without the endless back-and-forth. Leave your
            email and we&apos;ll let you in as spots open up.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <WaitlistForm />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>We&apos;ll only email you about your spot.</span>
          {count > 0 && (
            <span className="font-mono text-neutral-900">
              {count.toLocaleString()} in line
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
