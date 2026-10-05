"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateOrganizationAdminAction(formData: FormData) {
  await requirePlatformAdmin();
  const organizationId = String(formData.get("organizationId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const status = z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).parse(formData.get("subscriptionStatus"));
  const isActive = formData.get("isActive") === "on";
  const supportNotes = String(formData.get("supportNotes") ?? "").trim() || null;
  const [organization, plan] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.plan.findUnique({ where: { id: planId } }),
  ]);
  if (!organization || !plan) throw new Error("Organization or plan not found");
  await prisma.$transaction([
    prisma.organization.update({ where: { id: organizationId }, data: { isActive, supportNotes } }),
    prisma.subscription.upsert({
      where: { organizationId },
      create: { organizationId, planId, status },
      update: { planId, status },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
}

export async function updatePlanAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const monthlyPrice = z.coerce.number().nonnegative().parse(formData.get("monthlyPrice"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  await prisma.plan.update({ where: { id }, data: { monthlyPrice, description, isActive } });
  revalidatePath("/admin/plans");
  revalidatePath("/admin");
}
