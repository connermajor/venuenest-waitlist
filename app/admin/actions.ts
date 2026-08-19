"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, adminToken, isAuthed } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validation";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!expected || password !== expected) {
    redirect("/admin?error=1");
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}

// Creates a new waitlist (tenant). Admin-only. On success, redirects to that
// project's tab so the reviewer immediately lands on the new list.
export async function createProject(formData: FormData) {
  const store = await cookies();
  if (!isAuthed(store.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const parsed = createProjectSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  });
  if (!parsed.success) {
    redirect("/admin?perror=1");
  }

  try {
    await prisma.project.create({ data: parsed.data });
  } catch (err) {
    // Slug already taken.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirect("/admin?perror=taken");
    }
    throw err;
  }
  redirect(`/admin?project=${parsed.data.slug}`);
}
