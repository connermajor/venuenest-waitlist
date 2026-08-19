import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Default project: the existing VenueNest waitlist (backing "/").
  const venuenest = await prisma.project.upsert({
    where: { slug: "venuenest" },
    update: {},
    create: { slug: "venuenest", name: "VenueNest" },
  });

  // A second, independent waitlist so multi-tenancy is actually demonstrable.
  await prisma.project.upsert({
    where: { slug: "garden-pavilion" },
    update: {},
    create: { slug: "garden-pavilion", name: "Garden Pavilion Events" },
  });

  // Attach every pre-existing signup to the default project.
  const backfilled = await prisma.waitlistEntry.updateMany({
    where: { projectId: null },
    data: { projectId: venuenest.id },
  });

  const projects = await prisma.project.count();
  const orphans = await prisma.waitlistEntry.count({ where: { projectId: null } });
  console.log(
    `projects=${projects} backfilled=${backfilled.count} remaining_orphans=${orphans} default=${venuenest.id}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
