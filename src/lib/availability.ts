import "server-only";

import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { localDateToDatabaseDate } from "@/lib/datetime";

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"] as const;

export type AvailableSlot = {
  startsAt: Date;
  endsAt: Date;
  localStart: string;
  localEnd: string;
  label: string;
};

export type BookingValidation = {
  resourceId: string;
  organizationId: string;
  timezone: string;
  startsAt: Date;
  endsAt: Date;
  bufferStartsAt: Date;
  bufferEndsAt: Date;
  status: "PENDING" | "CONFIRMED";
};

type Policy = {
  minimumDurationMinutes: number;
  maximumDurationMinutes: number;
  bookingIncrementMinutes: number;
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  bookingMode: "INSTANT" | "APPROVAL_REQUIRED";
};

const DEFAULT_POLICY: Policy = {
  minimumDurationMinutes: 60,
  maximumDurationMinutes: 480,
  bookingIncrementMinutes: 30,
  minimumNoticeMinutes: 0,
  maximumAdvanceDays: 90,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  bookingMode: "INSTANT",
};

export class AvailabilityService {
  static async getAvailableSlots(input: {
    organizationId: string;
    resourceId: string;
    date: string;
    durationMinutes?: number;
    now?: Date;
  }): Promise<{ timezone: string; durationMinutes: number; slots: AvailableSlot[] }> {
    const context = await this.getContext(input.organizationId, input.resourceId);
    const policy = { ...DEFAULT_POLICY, ...context.bookingPolicy } as Policy;
    const durationMinutes = input.durationMinutes ?? policy.minimumDurationMinutes;
    this.validateDuration(durationMinutes, policy);

    const timezone = context.location.timezone || context.organization.timezone;
    const localDay = DateTime.fromISO(input.date, { zone: timezone }).startOf("day");
    if (!localDay.isValid) throw new Error("Date is invalid");

    const now = DateTime.fromJSDate(input.now ?? new Date(), { zone: "UTC" });
    const earliest = now.plus({ minutes: policy.minimumNoticeMinutes });
    const latest = now.plus({ days: policy.maximumAdvanceDays });
    if (localDay.endOf("day").toUTC() < earliest || localDay.toUTC() > latest) {
      return { timezone, durationMinutes, slots: [] };
    }

    const windows = await this.getWindows(context.id, input.organizationId, input.date, localDay.weekday % 7);
    if (!windows.length) return { timezone, durationMinutes, slots: [] };

    const dayStartsAt = localDay.toUTC().toJSDate();
    const dayEndsAt = localDay.plus({ days: 1 }).toUTC().toJSDate();
    const [bookings, blocks] = await Promise.all([
      prisma.booking.findMany({
        where: {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
          bufferStartsAt: { lt: dayEndsAt },
          bufferEndsAt: { gt: dayStartsAt },
        },
        select: { bufferStartsAt: true, bufferEndsAt: true },
      }),
      prisma.blockedTime.findMany({
        where: {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
          startsAt: { lt: dayEndsAt },
          endsAt: { gt: dayStartsAt },
        },
        select: { startsAt: true, endsAt: true },
      }),
    ]);

    const slots: AvailableSlot[] = [];
    for (const window of windows) {
      for (let minute = window.startMinute; minute + durationMinutes <= window.endMinute; minute += policy.bookingIncrementMinutes) {
        const localStart = localDay.plus({ minutes: minute });
        const localEnd = localStart.plus({ minutes: durationMinutes });
        const start = localStart.toUTC();
        const end = localEnd.toUTC();
        const bufferStart = start.minus({ minutes: policy.bufferBeforeMinutes });
        const bufferEnd = end.plus({ minutes: policy.bufferAfterMinutes });
        const windowStart = localDay.plus({ minutes: window.startMinute }).toUTC();
        const windowEnd = localDay.plus({ minutes: window.endMinute }).toUTC();

        if (start < earliest || start > latest || bufferStart < windowStart || bufferEnd > windowEnd) continue;
        const overlapsBooking = bookings.some((booking) => bufferStart.toJSDate() < booking.bufferEndsAt && bufferEnd.toJSDate() > booking.bufferStartsAt);
        const overlapsBlock = blocks.some((block) => bufferStart.toJSDate() < block.endsAt && bufferEnd.toJSDate() > block.startsAt);
        if (overlapsBooking || overlapsBlock) continue;

        slots.push({
          startsAt: start.toJSDate(),
          endsAt: end.toJSDate(),
          localStart: localStart.toFormat("yyyy-LL-dd'T'HH:mm"),
          localEnd: localEnd.toFormat("yyyy-LL-dd'T'HH:mm"),
          label: `${localStart.toFormat("h:mm a")} – ${localEnd.toFormat("h:mm a")}`,
        });
      }
    }
    return { timezone, durationMinutes, slots };
  }

  static async isTimeAvailable(input: { organizationId: string; resourceId: string; startsAt: Date; endsAt: Date; excludeBookingId?: string }) {
    try {
      await this.validateBookingRequest(input);
      return true;
    } catch {
      return false;
    }
  }

  static async validateBookingRequest(input: {
    organizationId: string;
    resourceId: string;
    startsAt: Date;
    endsAt: Date;
    excludeBookingId?: string;
    now?: Date;
  }): Promise<BookingValidation> {
    const context = await this.getContext(input.organizationId, input.resourceId);
    const policy = { ...DEFAULT_POLICY, ...context.bookingPolicy } as Policy;
    const timezone = context.location.timezone || context.organization.timezone;
    const startsAt = DateTime.fromJSDate(input.startsAt, { zone: "UTC" });
    const endsAt = DateTime.fromJSDate(input.endsAt, { zone: "UTC" });
    if (!startsAt.isValid || !endsAt.isValid || endsAt <= startsAt) throw new Error("Booking time is invalid");

    const durationMinutes = Math.round(endsAt.diff(startsAt, "minutes").minutes);
    this.validateDuration(durationMinutes, policy);
    const now = DateTime.fromJSDate(input.now ?? new Date(), { zone: "UTC" });
    if (startsAt < now.plus({ minutes: policy.minimumNoticeMinutes })) throw new Error("This booking does not meet the minimum advance notice");
    if (startsAt > now.plus({ days: policy.maximumAdvanceDays })) throw new Error("This booking is too far in advance");

    const localStart = startsAt.setZone(timezone);
    const localEnd = endsAt.setZone(timezone);
    if (localStart.toISODate() !== localEnd.minus({ milliseconds: 1 }).toISODate()) throw new Error("Bookings must start and end on the same local date");
    const startMinute = localStart.hour * 60 + localStart.minute;
    const endMinute = localEnd.hour * 60 + localEnd.minute;
    const date = localStart.toISODate();
    if (!date) throw new Error("Booking date is invalid");
    const windows = await this.getWindows(context.id, input.organizationId, date, localStart.weekday % 7);
    const containingWindow = windows.find((window) => startMinute >= window.startMinute && endMinute <= window.endMinute);
    if (!containingWindow) throw new Error("The selected time is outside this workspace's availability");
    if ((startMinute - containingWindow.startMinute) % policy.bookingIncrementMinutes !== 0) throw new Error("The start time does not match the booking increment");

    const bufferStartsAt = startsAt.minus({ minutes: policy.bufferBeforeMinutes });
    const bufferEndsAt = endsAt.plus({ minutes: policy.bufferAfterMinutes });
    const localWindowStart = localStart.startOf("day").plus({ minutes: containingWindow.startMinute }).toUTC();
    const localWindowEnd = localStart.startOf("day").plus({ minutes: containingWindow.endMinute }).toUTC();
    if (bufferStartsAt < localWindowStart || bufferEndsAt > localWindowEnd) throw new Error("Required buffer time falls outside availability");

    const [bookingConflict, blockConflict] = await Promise.all([
      prisma.booking.findFirst({
        where: {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
          id: input.excludeBookingId ? { not: input.excludeBookingId } : undefined,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
          bufferStartsAt: { lt: bufferEndsAt.toJSDate() },
          bufferEndsAt: { gt: bufferStartsAt.toJSDate() },
        },
      }),
      prisma.blockedTime.findFirst({
        where: {
          organizationId: input.organizationId,
          resourceId: input.resourceId,
          startsAt: { lt: bufferEndsAt.toJSDate() },
          endsAt: { gt: bufferStartsAt.toJSDate() },
        },
      }),
    ]);
    if (bookingConflict) throw new Error("This workspace is already booked during that time");
    if (blockConflict) throw new Error("This workspace is blocked during that time");

    return {
      resourceId: context.id,
      organizationId: input.organizationId,
      timezone,
      startsAt: startsAt.toJSDate(),
      endsAt: endsAt.toJSDate(),
      bufferStartsAt: bufferStartsAt.toJSDate(),
      bufferEndsAt: bufferEndsAt.toJSDate(),
      status: policy.bookingMode === "INSTANT" ? "CONFIRMED" : "PENDING",
    };
  }

  private static validateDuration(durationMinutes: number, policy: Policy) {
    if (!Number.isInteger(durationMinutes) || durationMinutes < policy.minimumDurationMinutes || durationMinutes > policy.maximumDurationMinutes) {
      throw new Error(`Duration must be between ${policy.minimumDurationMinutes} and ${policy.maximumDurationMinutes} minutes`);
    }
    if (durationMinutes % policy.bookingIncrementMinutes !== 0) throw new Error("Duration must follow the booking increment");
  }

  private static async getContext(organizationId: string, resourceId: string) {
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, organizationId, isActive: true, location: { isActive: true } },
      include: { organization: true, location: true, bookingPolicy: true },
    });
    if (!resource) throw new Error("Workspace is unavailable");
    return resource;
  }

  private static async getWindows(resourceId: string, organizationId: string, date: string, dayOfWeek: number) {
    const overrideDate = localDateToDatabaseDate(date);
    const override = await prisma.availabilityOverride.findFirst({ where: { resourceId, organizationId, date: overrideDate } });
    if (override) {
      if (override.isClosed) return [];
      if (override.startMinute === null || override.endMinute === null) return [];
      return [{ startMinute: override.startMinute, endMinute: override.endMinute }];
    }
    return prisma.availabilityRule.findMany({
      where: { resourceId, organizationId, dayOfWeek },
      select: { startMinute: true, endMinute: true },
      orderBy: { startMinute: "asc" },
    });
  }
}
