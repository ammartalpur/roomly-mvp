import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, isPlatformAdmin: true },
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
  if (!context.membership.organization.isActive) redirect("/disabled");
  return { ...context, membership: context.membership };
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  const configuredAdmins = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!user.isPlatformAdmin && !configuredAdmins.includes(user.email.toLowerCase())) redirect("/dashboard");
  return user;
}

export function canManage(role: "OWNER" | "ADMIN" | "STAFF") {
  return role === "OWNER" || role === "ADMIN";
}
