import Link from "next/link";
import { DateTime } from "luxon";
import { CalendarDays, Filter, MapPin, Plus, Search, Users2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

const STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
type Query = { status?: string; q?: string; date?: string; location?: string };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const timezone = membership.organization.timezone;
  const status = STATUSES.includes(query.status as typeof STATUSES[number])
    ? query.status as typeof STATUSES[number]
    : undefined;
  const q = query.q?.trim();
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "")
    ? DateTime.fromISO(query.date!, { zone: timezone }).startOf("day")
    : undefined;

  const [locations, bookings] = await Promise.all([
    prisma.location.findMany({ where: { organizationId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.booking.findMany({
      where: {
        organizationId,
        status,
        resource: query.location ? { locationId: query.location } : undefined,
        startsAt: selectedDate
          ? { gte: selectedDate.toUTC().toJSDate(), lt: selectedDate.plus({ days: 1 }).toUTC().toJSDate() }
          : undefined,
        OR: q ? [
          { confirmationCode: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { customer: { email: { contains: q, mode: "insensitive" } } },
        ] : undefined,
      },
      include: { customer: true, resource: { include: { location: true, organization: true } } },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
  ]);

  return <div className="mx-auto max-w-6xl">
    <PageHeader eyebrow="Operations" title="Bookings" description="Find, review, and manage every reservation from one place." action={<Link href="/dashboard/bookings/new" className="button button-primary"><Plus size={16} /> New booking</Link>} />
    <form className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_190px_190px_180px_auto]">
      <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b857f]" /><input className="pl-9" name="q" defaultValue={q} placeholder="Customer or confirmation number" /></label>
      <label className="relative"><Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b857f]" /><select className="pl-9" name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></label>
      <label className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b857f]" /><select className="pl-9" name="location" defaultValue={query.location ?? ""}><option value="">All locations</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <label className="relative"><CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b857f]" /><input className="pl-9" type="date" name="date" defaultValue={selectedDate?.toISODate() ?? ""} /></label>
      <button className="button button-secondary">Filter</button>
    </form>
    {bookings.length === 0 ? <div className="panel"><EmptyState title="No bookings found" description="Try changing the filters or create a new staff booking." /></div> : <section className="panel overflow-hidden"><div className="divide-y divide-[#e6eae6]">
      {bookings.map((booking) => {
        const bookingTimezone = booking.resource.location.timezone || booking.resource.organization.timezone;
        return <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-[#fafbf9] sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center">
          <div><p className="font-semibold">{booking.customer.name}</p><p className="mt-1 text-xs text-[#77817b]">{booking.confirmationCode} · {booking.customer.email}</p></div>
          <div><p className="text-sm font-medium">{booking.resource.name}</p><p className="mt-1 text-xs text-[#77817b]">{booking.resource.location.name}</p></div>
          <div><p className="text-sm font-medium">{formatInTimezone(booking.startsAt, bookingTimezone, "dd LLL yyyy")}</p><p className="mt-1 text-xs text-[#77817b]">{formatInTimezone(booking.startsAt, bookingTimezone, "h:mm a")} – {formatInTimezone(booking.endsAt, bookingTimezone, "h:mm a")}</p></div>
          <div className="flex items-center gap-3"><span className={`badge booking-${booking.status.toLowerCase()}`}>{booking.status.replace("_", " ")}</span><span className="flex items-center gap-1 text-xs text-[#77817b]"><Users2 size={13} />{booking.partySize}</span></div>
        </Link>;
      })}
    </div></section>}
  </div>;
}
