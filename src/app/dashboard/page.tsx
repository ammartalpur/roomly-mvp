import Link from "next/link";
import { DateTime } from "luxon";
import { ArrowRight, Ban, CalendarCheck2, Clock3, DoorOpen, Gauge, MapPin, UserCheck, Warehouse } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone } from "@/lib/datetime";
import { getResourceUtilization } from "@/lib/operations";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const timezone = membership.organization.timezone;
  const currentInstant = new Date();
  const localNow = DateTime.fromJSDate(currentInstant, { zone: "UTC" }).setZone(timezone);
  const dayStart = localNow.startOf("day").toUTC().toJSDate();
  const dayEnd = localNow.plus({ days: 1 }).startOf("day").toUTC().toJSDate();
  const today = localNow.toISODate()!;

  const [resources, todayBookings, upcoming, activeBlocks, utilization] = await Promise.all([
    prisma.resource.findMany({ where: { organizationId, isActive: true }, select: { id: true } }),
    prisma.booking.findMany({
      where: { organizationId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      include: { customer: true, resource: { include: { location: true, organization: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { organizationId, startsAt: { gte: currentInstant }, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
      include: { customer: true, resource: { include: { location: true, organization: true } } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.blockedTime.findMany({ where: { organizationId, startsAt: { lte: currentInstant }, endsAt: { gt: currentInstant } }, select: { resourceId: true } }),
    getResourceUtilization({ organizationId, fromDate: today, toDate: today }),
  ]);

  const counted = todayBookings.filter((booking) => !["CANCELLED", "NO_SHOW"].includes(booking.status));
  const occupiedIds = new Set(counted.filter((booking) => booking.startsAt <= currentInstant && booking.endsAt > currentInstant).map((booking) => booking.resourceId));
  const unavailableIds = new Set([...occupiedIds, ...activeBlocks.map((block) => block.resourceId)]);
  const bookingMinutes = counted.reduce((sum, booking) => {
    const start = Math.max(booking.startsAt.getTime(), dayStart.getTime());
    const end = Math.min(booking.endsAt.getTime(), dayEnd.getTime());
    return sum + Math.max(0, (end - start) / 60000);
  }, 0);
  const totalAvailable = utilization.reduce((sum, item) => sum + item.availableMinutes, 0);
  const totalBooked = utilization.reduce((sum, item) => sum + item.bookedMinutes, 0);
  const utilizationPercent = totalAvailable ? Math.round((totalBooked / totalAvailable) * 100) : 0;
  const exceptions = todayBookings.filter((booking) => ["CANCELLED", "NO_SHOW"].includes(booking.status)).length;

  const cards = [
    ["Today's bookings", todayBookings.length, CalendarCheck2, "All statuses"],
    ["Occupied now", occupiedIds.size, UserCheck, "Active reservations"],
    ["Available spaces", Math.max(0, resources.length - unavailableIds.size), DoorOpen, `${resources.length} active total`],
    ["Booking hours", `${(bookingMinutes / 60).toFixed(1)}h`, Clock3, "Scheduled today"],
    ["Utilization", `${utilizationPercent}%`, Gauge, "Of configured hours"],
    ["Exceptions", exceptions, Ban, "Cancelled or no-show"],
  ] as const;

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><span className="eyebrow">Daily operations</span><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Good day, {membership.organization.name}</h1><p className="mt-3 text-[#68736e]">{localNow.toFormat("cccc, dd LLLL yyyy")} · {timezone}</p></div><div className="flex gap-2"><Link href="/dashboard/calendar" className="button button-secondary">Open calendar</Link><Link href="/dashboard/bookings/new" className="button button-primary">New booking</Link></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value, Icon, detail]) => <div className="panel p-5" key={label}><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.08em] text-[#77817b]">{label}</p><Icon size={17} className="text-[#3d725f]" /></div><p className="mt-4 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-2 text-xs text-[#8a938e]">{detail}</p></div>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#e5e9e5] px-6 py-5"><div><h2 className="font-semibold">Today&apos;s schedule</h2><p className="mt-1 text-xs text-[#7b857f]">Bookings in chronological order</p></div><Link href="/dashboard/calendar?view=day" className="text-xs font-semibold text-[#356650]">View timeline</Link></div>{todayBookings.length ? <div className="divide-y divide-[#e8ebe8]">{todayBookings.slice(0, 8).map((booking) => { const bookingZone = booking.resource.location.timezone || booking.resource.organization.timezone; return <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="grid gap-3 px-6 py-4 transition hover:bg-[#fafbf9] sm:grid-cols-[90px_1fr_auto] sm:items-center"><div><p className="text-sm font-semibold">{formatInTimezone(booking.startsAt, bookingZone, "h:mm a")}</p><p className="text-xs text-[#8a938e]">{formatInTimezone(booking.endsAt, bookingZone, "h:mm a")}</p></div><div><p className="font-medium">{booking.customer.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#77817b]"><Warehouse size={12} />{booking.resource.name} · <MapPin size={12} />{booking.resource.location.name}</p></div><span className={`badge booking-${booking.status.toLowerCase()}`}>{booking.status.replace("_", " ")}</span></Link>; })}</div> : <div className="px-6 py-12 text-center"><p className="font-medium">Nothing scheduled today</p><p className="mt-1 text-sm text-[#7c857f]">Create a booking or check another date.</p></div>}</section><section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#e5e9e5] px-6 py-5"><div><h2 className="font-semibold">Coming up</h2><p className="mt-1 text-xs text-[#7b857f]">Next active reservations</p></div><Link href="/dashboard/bookings" className="text-xs font-semibold text-[#356650]">All bookings</Link></div>{upcoming.length ? <div className="divide-y divide-[#e8ebe8]">{upcoming.map((booking) => { const bookingZone = booking.resource.location.timezone || booking.resource.organization.timezone; return <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="group flex items-center gap-4 px-6 py-4 hover:bg-[#fafbf9]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf2ec] text-xs font-bold text-[#356650]">{formatInTimezone(booking.startsAt, bookingZone, "dd")}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{booking.customer.name}</p><p className="mt-1 truncate text-xs text-[#7b857f]">{formatInTimezone(booking.startsAt, bookingZone, "dd LLL · h:mm a")} · {booking.resource.name}</p></div><ArrowRight size={15} className="text-[#9aa39e] transition group-hover:translate-x-1" /></Link>; })}</div> : <div className="px-6 py-12 text-center text-sm text-[#7c857f]">No upcoming bookings.</div>}</section></div></div>;
}
