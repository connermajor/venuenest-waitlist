"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  OWNER_SCOPE,
  signScope,
  verifyScope,
  hashWithSecret,
} from "@/lib/auth";
import { createProjectSchema } from "@/lib/validation";

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

// Creates a new waitlist (tenant). Owner-only. An optional password lets that
// project's own admin sign in scoped to just their list.
export async function createProject(formData: FormData) {
  const store = await cookies();
  if (verifyScope(store.get(ADMIN_COOKIE)?.value) !== OWNER_SCOPE) redirect("/admin");

  const parsed = createProjectSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    redirect("/admin?perror=1");
  }

  const data: { name: string; slug: string; adminPasswordHash?: string } = {
    name: parsed.data.name,
    slug: parsed.data.slug,
  };
  if (parsed.data.password) {
    data.adminPasswordHash = hashWithSecret(parsed.data.password);
  }

  try {
    await prisma.project.create({ data });
  } catch (err) {
    // Slug already taken.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirect("/admin?perror=taken");
    }
    throw err;
  }
  redirect(`/admin?project=${parsed.data.slug}`);
}
