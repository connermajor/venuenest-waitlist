import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import logo from "@/public/venuenest-logo.png";
import WaitlistForm from "../../waitlist-form";

export const dynamic = "force-dynamic";

// A standalone waitlist page for any project (tenant). Same UI as the
// homepage, scoped to one project's slug so signups and counts stay isolated.
export default async function ProjectWaitlist({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  let count = 0;
  try {
    count = await prisma.waitlistEntry.count({ where: { projectId: project.id } });
  } catch {
    // DB not reachable at render time — still show the form.
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
            {project.name}
          </h1>
          <p className="mt-3 leading-relaxed text-[#6e6e6e]">
            Join the waitlist for {project.name}. Leave your email and we&apos;ll
            let you in as spots open up.
          </p>
        </div>

        <div className="rounded-2xl border border-[#ecece3] bg-white p-7 shadow-sm">
          <WaitlistForm slug={project.slug} />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-[#8f8f8f]">
          <span>We&apos;ll only email you about your spot.</span>
          {count > 0 && (
            <span className="font-mono text-sage-deep">
              {count.toLocaleString()} in line
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
