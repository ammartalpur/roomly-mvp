"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AvailabilityService } from "@/lib/availability";
import { localDateTimeToUtc } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { calculateBookingPrice } from "@/lib/pricing";

export type MarketplaceBookingState = { error?: string } | undefined;
export type BookingLookupState = {
  error?: string;
  booking?: {
    id: string;
    confirmationCode: string;
    status: string;
    paymentStatus: string;
    workspace: string;
    business: string;
    location: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    quotedAmount: number;
    currency: string;
    email: string;
  };
} | undefined;

const bookingSchema = z.object({
  resourceId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  customerName: z.string().trim().min(2, "Enter your full name"),
  customerEmail: z.email("Enter a valid email address").transform((email) => email.toLowerCase().trim()),
  customerPhone: z.string().trim().min(7, "Enter a valid phone number"),
  partySize: z.coerce.number().int().min(1),
  customerNotes: z.string().trim().max(1000).optional(),
  acceptedPolicies: z.literal("on", { error: "Accept the booking and cancellation policies" }),
});

function messageFrom(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("Booking_no_active_overlap") || error.message.includes("exclusion constraint")) return "That time was just booked. Please choose another available time.";
    return error.message;
  }
  return "We could not complete this booking. Please try again.";
}

export async function createMarketplaceBookingAction(_: MarketplaceBookingState, formData: FormData): Promise<MarketplaceBookingState> {
  let destination = "";
  try {
    const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your booking details" };
    const input = parsed.data;
    const resource = await prisma.resource.findFirst({
      where: { id: input.resourceId, isPublic: true, isActive: true, location: { isActive: true }, organization: { isActive: true } },
      include: { organization: true, location: true },
    });
    if (!resource) return { error: "This workspace is no longer available" };
    if (input.partySize > resource.capacity) return { error: `This workspace allows up to ${resource.capacity} guests` };

    const timezone = resource.location.timezone || resource.organization.timezone;
    const startsAt = localDateTimeToUtc(input.startsAt, timezone);
    const endsAt = localDateTimeToUtc(input.endsAt, timezone);
    const validated = await AvailabilityService.validateBookingRequest({ organizationId: resource.organizationId, resourceId: resource.id, startsAt, endsAt });
    const quotedAmount = calculateBookingPrice({ pricingType: resource.pricingType, price: resource.price, startsAt: validated.startsAt, endsAt: validated.endsAt });
    const confirmationCode = `RMLY-${randomBytes(8).toString("hex").toUpperCase()}`;

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { organizationId_email: { organizationId: resource.organizationId, email: input.customerEmail } },
        create: { organizationId: resource.organizationId, name: input.customerName, email: input.customerEmail, phone: input.customerPhone },
        update: { name: input.customerName, phone: input.customerPhone },
      });
      await tx.booking.create({
        data: {
          organizationId: resource.organizationId,
          resourceId: resource.id,
          customerId: customer.id,
          confirmationCode,
          startsAt: validated.startsAt,
          endsAt: validated.endsAt,
          bufferStartsAt: validated.bufferStartsAt,
          bufferEndsAt: validated.bufferEndsAt,
          status: validated.status,
          source: "CUSTOMER",
          partySize: input.partySize,
          customerNotes: input.customerNotes || null,
          quotedAmount,
          currency: resource.currency,
          activities: { create: { organizationId: resource.organizationId, type: "CREATED", description: "Booking created through the Roomly marketplace" } },
        },
      });
    }, { isolationLevel: "Serializable" });
    destination = `/bookings/${confirmationCode}/confirmation`;
  } catch (error) {
    return { error: messageFrom(error) };
  }
  redirect(destination);
}

const lookupSchema = z.object({
  confirmationCode: z.string().trim().min(6).transform((value) => value.toUpperCase()),
  email: z.email().transform((value) => value.toLowerCase().trim()),
});

export async function lookupMarketplaceBookingAction(_: BookingLookupState, formData: FormData): Promise<BookingLookupState> {
  const parsed = lookupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid confirmation number and email address" };
  const booking = await prisma.booking.findFirst({
    where: { confirmationCode: parsed.data.confirmationCode, customer: { email: parsed.data.email } },
    include: { customer: true, organization: true, resource: { include: { location: true } } },
  });
  if (!booking) return { error: "We could not find a booking matching those details" };
  const timezone = booking.resource.location.timezone || booking.organization.timezone;
  return { booking: {
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    workspace: booking.resource.name,
    business: booking.organization.name,
    location: [booking.resource.location.name, booking.resource.location.city].filter(Boolean).join(", "),
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    timezone,
    quotedAmount: Number(booking.quotedAmount),
    currency: booking.currency,
    email: booking.customer.email,
  } };
}

export async function cancelMarketplaceBookingAction(_: BookingLookupState, formData: FormData): Promise<BookingLookupState> {
  const parsed = lookupSchema.extend({ bookingId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "We could not verify this booking" };
  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.bookingId, confirmationCode: parsed.data.confirmationCode, startsAt: { gt: new Date() }, customer: { email: parsed.data.email } },
    include: { customer: true, organization: true, resource: { include: { location: true } } },
  });
  if (!booking || !["PENDING", "CONFIRMED"].includes(booking.status)) return { error: "This booking can no longer be cancelled online" };
  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } }),
    prisma.bookingActivity.create({ data: { organizationId: booking.organizationId, bookingId: booking.id, type: "CANCELLED", description: "Booking cancelled by the customer" } }),
  ]);
  const timezone = booking.resource.location.timezone || booking.organization.timezone;
  return { booking: {
    id: booking.id, confirmationCode: booking.confirmationCode, status: "CANCELLED", paymentStatus: booking.paymentStatus,
    workspace: booking.resource.name, business: booking.organization.name,
    location: [booking.resource.location.name, booking.resource.location.city].filter(Boolean).join(", "),
    startsAt: booking.startsAt.toISOString(), endsAt: booking.endsAt.toISOString(), timezone,
    quotedAmount: Number(booking.quotedAmount), currency: booking.currency, email: booking.customer.email,
  } };
}
