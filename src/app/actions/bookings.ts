"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AvailabilityService } from "@/lib/availability";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone, localDateTimeToUtc } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export type BookingFormState = { error?: string } | undefined;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function messageFrom(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("Booking_no_active_overlap") || error.message.includes("exclusion constraint")) return "That time was just booked by someone else. Choose another slot.";
    return error.message;
  }
  return "The booking could not be saved";
}

function confirmationCode() {
  return `RMLY-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createBookingAction(_: BookingFormState, formData: FormData): Promise<BookingFormState> {
  try {
    const { user, membership } = await requireMembership();
    const resourceId = value(formData, "resourceId");
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, organizationId: membership.organizationId },
      include: { organization: true, location: true },
    });
    if (!resource) return { error: "Workspace not found" };
    const timezone = resource.location.timezone || resource.organization.timezone;
    const startsAt = localDateTimeToUtc(value(formData, "startsAt"), timezone);
    const endsAt = localDateTimeToUtc(value(formData, "endsAt"), timezone);
    const validated = await AvailabilityService.validateBookingRequest({ organizationId: membership.organizationId, resourceId, startsAt, endsAt });
    const email = value(formData, "customerEmail").toLowerCase();
    const name = value(formData, "customerName");
    if (!name || !email.includes("@")) return { error: "Customer name and a valid email are required" };
    const partySize = Math.max(1, Number(value(formData, "partySize")) || 1);
    if (partySize > resource.capacity) return { error: `Party size cannot exceed this workspace's capacity of ${resource.capacity}` };

    const booking = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { organizationId_email: { organizationId: membership.organizationId, email } },
        create: { organizationId: membership.organizationId, name, email, phone: value(formData, "customerPhone") || null },
        update: { name, phone: value(formData, "customerPhone") || null },
      });
      return tx.booking.create({
        data: {
          organizationId: membership.organizationId,
          resourceId,
          customerId: customer.id,
          createdByUserId: user.id,
          confirmationCode: confirmationCode(),
          startsAt: validated.startsAt,
          endsAt: validated.endsAt,
          bufferStartsAt: validated.bufferStartsAt,
          bufferEndsAt: validated.bufferEndsAt,
          status: validated.status,
          source: "STAFF",
          partySize,
          customerNotes: value(formData, "customerNotes") || null,
          internalNotes: value(formData, "internalNotes") || null,
          activities: {
            create: {
              organizationId: membership.organizationId,
              userId: user.id,
              type: "CREATED",
              description: `Booking created by ${user.name}`,
            },
          },
        },
      });
    }, { isolationLevel: "Serializable" });
    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
    redirect(`/dashboard/bookings/${booking.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: messageFrom(error) };
  }
}

export async function rescheduleBookingAction(_: BookingFormState, formData: FormData): Promise<BookingFormState> {
  try {
    const { user, membership } = await requireMembership();
    const id = value(formData, "id");
    const booking = await prisma.booking.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: { resource: { include: { organization: true, location: true } } },
    });
    if (!booking || ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.status)) return { error: "This booking cannot be rescheduled" };
    const timezone = booking.resource.location.timezone || booking.resource.organization.timezone;
    const startsAt = localDateTimeToUtc(value(formData, "startsAt"), timezone);
    const endsAt = localDateTimeToUtc(value(formData, "endsAt"), timezone);
    const validated = await AvailabilityService.validateBookingRequest({ organizationId: membership.organizationId, resourceId: booking.resourceId, startsAt, endsAt, excludeBookingId: booking.id });
    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { startsAt: validated.startsAt, endsAt: validated.endsAt, bufferStartsAt: validated.bufferStartsAt, bufferEndsAt: validated.bufferEndsAt },
      }),
      prisma.bookingActivity.create({
        data: {
          organizationId: membership.organizationId,
          bookingId: id,
          userId: user.id,
          type: "RESCHEDULED",
          description: `Booking rescheduled by ${user.name}`,
          metadata: { from: booking.startsAt.toISOString(), to: validated.startsAt.toISOString() },
        },
      }),
    ], { isolationLevel: "Serializable" });
    revalidatePath(`/dashboard/bookings/${id}`);
    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
    return undefined;
  } catch (error) {
    return { error: messageFrom(error) };
  }
}

const STATUS_ACTIONS = {
  confirm: { from: ["PENDING"], to: "CONFIRMED", type: "CONFIRMED", label: "confirmed" },
  cancel: { from: ["PENDING", "CONFIRMED", "CHECKED_IN"], to: "CANCELLED", type: "CANCELLED", label: "cancelled" },
  checkIn: { from: ["CONFIRMED"], to: "CHECKED_IN", type: "CHECKED_IN", label: "checked in" },
  complete: { from: ["CHECKED_IN", "CONFIRMED"], to: "COMPLETED", type: "COMPLETED", label: "completed" },
  noShow: { from: ["CONFIRMED"], to: "NO_SHOW", type: "NO_SHOW", label: "marked as no-show" },
} as const;

export async function updateBookingStatusAction(formData: FormData) {
  const { user, membership } = await requireMembership();
  const id = value(formData, "id");
  const operation = value(formData, "operation") as keyof typeof STATUS_ACTIONS;
  const change = STATUS_ACTIONS[operation];
  if (!change) throw new Error("Unknown booking action");
  const booking = await prisma.booking.findFirst({ where: { id, organizationId: membership.organizationId } });
  if (!booking || !(change.from as readonly string[]).includes(booking.status)) throw new Error("This status change is not allowed");
  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: change.to } }),
    prisma.bookingActivity.create({ data: { organizationId: membership.organizationId, bookingId: id, userId: user.id, type: change.type, description: `Booking ${change.label} by ${user.name}` } }),
  ]);
  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}

export async function updateBookingNotesAction(formData: FormData) {
  const { membership } = await requireMembership();
  const id = value(formData, "id");
  await prisma.booking.updateMany({
    where: { id, organizationId: membership.organizationId },
    data: { internalNotes: value(formData, "internalNotes") || null },
  });
  revalidatePath(`/dashboard/bookings/${id}`);
}

export async function describeBookingTime(bookingId: string) {
  const { membership } = await requireMembership();
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, organizationId: membership.organizationId }, include: { resource: { include: { organization: true, location: true } } } });
  if (!booking) return null;
  const timezone = booking.resource.location.timezone || booking.resource.organization.timezone;
  return formatInTimezone(booking.startsAt, timezone);
}
