"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  OWNER_SCOPE,
  signScope,
  verifyScope,
  hashWithSecret,
} from "@/lib/auth";
import { sendReadyEmail as sendReadyMail } from "@/lib/email";

type Store = Awaited<ReturnType<typeof cookies>>;

function setSession(store: Store, scope: string) {
  store.set(ADMIN_COOKIE, signScope(scope), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const store = await cookies();

  // 1. The owner password unlocks every list.
  const ownerPw = process.env.ADMIN_PASSWORD ?? "";
  if (ownerPw && password === ownerPw) {
    setSession(store, OWNER_SCOPE);
    redirect("/admin");
  }

  // 2. Otherwise, does the password match a single project's admin password?
  //    Scope the session to that one project.
  if (password) {
    const project = await prisma.project.findFirst({
      where: { adminPasswordHash: hashWithSecret(password) },
    });
    if (project) {
      setSession(store, project.id);
      redirect(`/admin?project=${project.slug}`);
    }
  }

  redirect("/admin?error=1");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}

// Sends the "your spot is ready" email to one waitlist entry and moves them off
// the active list by stamping invitedAt. Scope-guarded: the owner can invite on
// any list; a project-scoped admin can only invite from their own list.
export async function sendReadyEmail(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const store = await cookies();
  const scope = verifyScope(store.get(ADMIN_COOKIE)?.value);
  if (!scope) redirect("/admin?error=1");

  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry) redirect("/admin");
  if (scope !== OWNER_SCOPE && scope !== entry.projectId) redirect("/admin");
  if (entry.invitedAt) redirect("/admin"); // already invited — nothing to do

  const messageId = await sendReadyMail({ to: entry.email, name: entry.name });

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      invitedAt: new Date(),
      ...(messageId
        ? { emailId: messageId, emailStatus: "sent", emailUpdatedAt: new Date() }
        : {}),
    },
  });

  redirect("/admin");
}
