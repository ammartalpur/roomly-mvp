"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE"]),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function recordPaymentAction(formData: FormData) {
  const { user, membership } = await requireMembership();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the payment details");
  const booking = await prisma.booking.findFirst({ where: { id: parsed.data.bookingId, organizationId: membership.organizationId } });
  if (!booking) throw new Error("Booking not found");

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        organizationId: membership.organizationId,
        bookingId: booking.id,
        recordedByUserId: user.id,
        amount: parsed.data.amount,
        currency: booking.currency,
        status: parsed.data.status,
        method: parsed.data.method,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
      },
    }),
    prisma.booking.update({ where: { id: booking.id }, data: { paymentStatus: parsed.data.status } }),
  ]);
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/reports");
}
