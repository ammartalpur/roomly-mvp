"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: string } | undefined;

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.extend({ name: z.string().trim().min(2, "Enter your name") }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
    });
    await tx.organizationMember.updateMany({
      where: { invitedEmail: parsed.data.email, userId: null },
      data: { userId: created.id },
    });
    return created;
  });

  await createSession(user.id);
  const membership = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  redirect(membership ? "/dashboard" : "/onboarding");
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return { error: "Email or password is incorrect" };
  }

  await createSession(user.id);
  const membership = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  redirect(membership ? "/dashboard" : "/onboarding");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
