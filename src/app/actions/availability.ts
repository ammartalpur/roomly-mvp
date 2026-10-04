"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/auth";
import { localDateTimeToUtc, localDateToDatabaseDate, timeToMinutes } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function resourceContext(resourceId: string) {
  const { membership } = await requireMembership();
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, organizationId: membership.organizationId },
    include: { location: true, organization: true },
  });
  if (!resource) throw new Error("Workspace not found");
  return { membership, resource, timezone: resource.location.timezone || resource.organization.timezone };
}

export async function saveBookingPolicyAction(formData: FormData) {
  const resourceId = value(formData, "resourceId");
  const { membership } = await resourceContext(resourceId);
  const minimumDurationMinutes = Number(value(formData, "minimumDurationMinutes"));
  const maximumDurationMinutes = Number(value(formData, "maximumDurationMinutes"));
  const bookingIncrementMinutes = Number(value(formData, "bookingIncrementMinutes"));
  const minimumNoticeMinutes = Number(value(formData, "minimumNoticeMinutes"));
  const maximumAdvanceDays = Number(value(formData, "maximumAdvanceDays"));
  const bufferBeforeMinutes = Number(value(formData, "bufferBeforeMinutes"));
  const bufferAfterMinutes = Number(value(formData, "bufferAfterMinutes"));
  if (minimumDurationMinutes < 1 || maximumDurationMinutes < minimumDurationMinutes) throw new Error("Duration limits are invalid");
  if (![15, 30, 60].includes(bookingIncrementMinutes)) throw new Error("Booking increment is invalid");
  if (minimumDurationMinutes % bookingIncrementMinutes || maximumDurationMinutes % bookingIncrementMinutes) throw new Error("Durations must align with the booking increment");

  await prisma.bookingPolicy.upsert({
    where: { resourceId },
    create: {
      organizationId: membership.organizationId,
      resourceId,
      minimumDurationMinutes,
      maximumDurationMinutes,
      bookingIncrementMinutes,
      minimumNoticeMinutes: Math.max(0, minimumNoticeMinutes),
      maximumAdvanceDays: Math.max(1, maximumAdvanceDays),
      bufferBeforeMinutes: Math.max(0, bufferBeforeMinutes),
      bufferAfterMinutes: Math.max(0, bufferAfterMinutes),
      bookingMode: value(formData, "bookingMode") === "APPROVAL_REQUIRED" ? "APPROVAL_REQUIRED" : "INSTANT",
    },
    update: {
      minimumDurationMinutes,
      maximumDurationMinutes,
      bookingIncrementMinutes,
      minimumNoticeMinutes: Math.max(0, minimumNoticeMinutes),
      maximumAdvanceDays: Math.max(1, maximumAdvanceDays),
      bufferBeforeMinutes: Math.max(0, bufferBeforeMinutes),
      bufferAfterMinutes: Math.max(0, bufferAfterMinutes),
      bookingMode: value(formData, "bookingMode") === "APPROVAL_REQUIRED" ? "APPROVAL_REQUIRED" : "INSTANT",
    },
  });
  revalidatePath(`/dashboard/availability/${resourceId}`);
}

export async function saveWeeklyAvailabilityAction(formData: FormData) {
  const resourceId = value(formData, "resourceId");
  const { membership } = await resourceContext(resourceId);
  const rules = DAYS.flatMap((day) => {
    if (formData.get(`day-${day}-enabled`) !== "on") return [];
    const startMinute = timeToMinutes(value(formData, `day-${day}-start`));
    const endMinute = timeToMinutes(value(formData, `day-${day}-end`));
    if (startMinute >= endMinute) throw new Error("Opening time must be before closing time");
    return [{ organizationId: membership.organizationId, resourceId, dayOfWeek: day, startMinute, endMinute }];
  });
  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { organizationId: membership.organizationId, resourceId } }),
    prisma.availabilityRule.createMany({ data: rules }),
  ]);
  revalidatePath(`/dashboard/availability/${resourceId}`);
}

export async function createAvailabilityOverrideAction(formData: FormData) {
  const resourceId = value(formData, "resourceId");
  const { membership } = await resourceContext(resourceId);
  const isClosed = formData.get("isClosed") === "on";
  const date = localDateToDatabaseDate(value(formData, "date"));
  const startMinute = isClosed ? null : timeToMinutes(value(formData, "start"));
  const endMinute = isClosed ? null : timeToMinutes(value(formData, "end"));
  if (!isClosed && startMinute! >= endMinute!) throw new Error("Override hours are invalid");
  await prisma.availabilityOverride.upsert({
    where: { resourceId_date: { resourceId, date } },
    create: { organizationId: membership.organizationId, resourceId, date, isClosed, startMinute, endMinute, reason: value(formData, "reason") || null },
    update: { isClosed, startMinute, endMinute, reason: value(formData, "reason") || null },
  });
  revalidatePath(`/dashboard/availability/${resourceId}`);
}

export async function deleteAvailabilityOverrideAction(formData: FormData) {
  const resourceId = value(formData, "resourceId");
  const { membership } = await resourceContext(resourceId);
  await prisma.availabilityOverride.deleteMany({ where: { id: value(formData, "id"), resourceId, organizationId: membership.organizationId } });
  revalidatePath(`/dashboard/availability/${resourceId}`);
}

export async function createBlockedTimeAction(formData: FormData) {
  const resourceId = value(formData, "resourceId");
  const { membership, timezone } = await resourceContext(resourceId);
  const startsAt = localDateTimeToUtc(value(formData, "startsAt"), timezone);
  const endsAt = localDateTimeToUtc(value(formData, "endsAt"), timezone);
  if (startsAt >= endsAt) throw new Error("Blocked time range is invalid");
  await prisma.blockedTime.create({
    data: {
      organizationId: membership.organizationId,
      resourceId,
      startsAt,
      endsAt,
      type: value(formData, "type") === "MAINTENANCE" ? "MAINTENANCE" : "MANUAL",
      reason: value(formData, "reason") || null,
    },
  });
  revalidatePath(`/dashboard/availability/${resourceId}`);
  revalidatePath("/dashboard/calendar");
}

export async function deleteBlockedTimeAction(formData: FormData) {
  const resourceId = value(formData, "resourceId");
  const { membership } = await resourceContext(resourceId);
  await prisma.blockedTime.deleteMany({ where: { id: value(formData, "id"), resourceId, organizationId: membership.organizationId } });
  revalidatePath(`/dashboard/availability/${resourceId}`);
  revalidatePath("/dashboard/calendar");
}
