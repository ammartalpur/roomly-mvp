import "server-only";

import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";

const COUNTED_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED"] as const;

export type ResourceUtilization = {
  id: string;
  name: string;
  locationName: string;
  bookedMinutes: number;
  availableMinutes: number;
  utilization: number;
  bookings: number;
};

export async function getResourceUtilization(input: {
  organizationId: string;
  fromDate: string;
  toDate: string;
}) {
  const broadStart = DateTime.fromISO(input.fromDate, { zone: "UTC" }).minus({ days: 1 }).toJSDate();
  const broadEnd = DateTime.fromISO(input.toDate, { zone: "UTC" }).plus({ days: 2 }).toJSDate();
  const resources = await prisma.resource.findMany({
    where: { organizationId: input.organizationId, isActive: true },
    include: {
      organization: true,
      location: true,
      availabilityRules: true,
      availabilityOverrides: {
        where: { date: { gte: DateTime.fromISO(input.fromDate, { zone: "UTC" }).toJSDate(), lte: DateTime.fromISO(input.toDate, { zone: "UTC" }).toJSDate() } },
      },
      bookings: {
        where: { status: { in: [...COUNTED_STATUSES] }, startsAt: { lt: broadEnd }, endsAt: { gt: broadStart } },
        select: { startsAt: true, endsAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const output: ResourceUtilization[] = [];
  for (const resource of resources) {
    const zone = resource.location.timezone || resource.organization.timezone;
    let day = DateTime.fromISO(input.fromDate, { zone }).startOf("day");
    const last = DateTime.fromISO(input.toDate, { zone }).endOf("day");
    let availableMinutes = 0;
    let bookedMinutes = 0;

    while (day <= last) {
      const dateKey = day.toISODate();
      const override = resource.availabilityOverrides.find((item) => DateTime.fromJSDate(item.date, { zone: "UTC" }).toISODate() === dateKey);
      const windows = override
        ? override.isClosed || override.startMinute === null || override.endMinute === null ? [] : [{ startMinute: override.startMinute, endMinute: override.endMinute }]
        : resource.availabilityRules.filter((rule) => rule.dayOfWeek === day.weekday % 7);

      for (const window of windows) {
        const windowStart = day.plus({ minutes: window.startMinute }).toUTC();
        const windowEnd = day.plus({ minutes: window.endMinute }).toUTC();
        availableMinutes += Math.max(0, windowEnd.diff(windowStart, "minutes").minutes);
        for (const booking of resource.bookings) {
          const bookingStart = DateTime.fromJSDate(booking.startsAt, { zone: "UTC" });
          const bookingEnd = DateTime.fromJSDate(booking.endsAt, { zone: "UTC" });
          const overlapStart = bookingStart > windowStart ? bookingStart : windowStart;
          const overlapEnd = bookingEnd < windowEnd ? bookingEnd : windowEnd;
          if (overlapEnd > overlapStart) bookedMinutes += overlapEnd.diff(overlapStart, "minutes").minutes;
        }
      }
      day = day.plus({ days: 1 });
    }

    output.push({
      id: resource.id,
      name: resource.name,
      locationName: resource.location.name,
      bookedMinutes: Math.round(bookedMinutes),
      availableMinutes: Math.round(availableMinutes),
      utilization: availableMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100)) : 0,
      bookings: resource.bookings.length,
    });
  }
  return output;
}
