import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentMembership() {
  const user = await requireUser();
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return { user, membership };
}

export async function requireMembership() {
  const context = await getCurrentMembership();
  if (!context.membership) redirect("/onboarding");
  return { ...context, membership: context.membership };
}

export function canManage(role: "OWNER" | "ADMIN" | "STAFF") {
  return role === "OWNER" || role === "ADMIN";
}
