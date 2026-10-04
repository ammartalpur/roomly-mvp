import Link from "next/link";
import { DateTime } from "luxon";
import { Ban, BarChart3, CalendarCheck2, Clock3, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { getResourceUtilization } from "@/lib/operations";
import { prisma } from "@/lib/prisma";

const RANGES = [7, 30, 90] as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const query = await searchParams;
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const timezone = membership.organization.timezone;
  const requestedRange = Number(query.range);
  const range = RANGES.includes(requestedRange as typeof RANGES[number]) ? requestedRange : 30;
  const end = DateTime.fromJSDate(new Date(), { zone: "UTC" }).setZone(timezone).endOf("day");
  const start = end.minus({ days: range - 1 }).startOf("day");

  const [utilization, bookings, customers] = await Promise.all([
    getResourceUtilization({ organizationId, fromDate: start.toISODate()!, toDate: end.toISODate()! }),
    prisma.booking.findMany({
      where: { organizationId, startsAt: { gte: start.toUTC().toJSDate(), lte: end.toUTC().toJSDate() } },
      select: { startsAt: true, endsAt: true, status: true },
    }),
    prisma.customer.count({ where: { organizationId } }),
  ]);

  const activeBookings = bookings.filter((booking) => !["CANCELLED", "NO_SHOW"].includes(booking.status));
  const bookedMinutes = activeBookings.reduce((total, booking) => total + Math.max(0, DateTime.fromJSDate(booking.endsAt).diff(DateTime.fromJSDate(booking.startsAt), "minutes").minutes), 0);
  const availableMinutes = utilization.reduce((total, resource) => total + resource.availableMinutes, 0);
  const utilizedMinutes = utilization.reduce((total, resource) => total + resource.bookedMinutes, 0);
  const overallUtilization = availableMinutes > 0 ? Math.min(100, Math.round((utilizedMinutes / availableMinutes) * 100)) : 0;
  const exceptions = bookings.filter((booking) => booking.status === "CANCELLED" || booking.status === "NO_SHOW").length;
  const rankedResources = [...utilization].sort((left, right) => right.utilization - left.utilization || right.bookings - left.bookings);

  return <div className="mx-auto max-w-6xl">
    <PageHeader eyebrow="Operations" title="Reports" description={`A practical view of bookings and workspace usage for ${start.toFormat("dd LLL")} – ${end.toFormat("dd LLL yyyy")}.`} />
    <div className="mb-5 flex flex-wrap gap-2">{RANGES.map((days) => <Link key={days} href={`/dashboard/reports?range=${days}`} className={`rounded-xl px-4 py-2 text-sm font-semibold ${range === days ? "bg-[#173f35] text-white" : "border border-[#dce2dd] bg-white text-[#5f6d65] hover:bg-[#f7f9f7]"}`}>Last {days} days</Link>)}</div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={<CalendarCheck2 size={18} />} label="Bookings" value={String(bookings.length)} note={`${activeBookings.length} active`} />
      <Metric icon={<Clock3 size={18} />} label="Booked hours" value={formatHours(bookedMinutes)} note="Excludes cancelled and no-show" />
      <Metric icon={<TrendingUp size={18} />} label="Utilization" value={`${overallUtilization}%`} note={`${formatHours(utilizedMinutes)} of ${formatHours(availableMinutes)}`} />
      <Metric icon={<Ban size={18} />} label="Exceptions" value={String(exceptions)} note="Cancelled or no-show" />
      <Metric icon={<BarChart3 size={18} />} label="Customers" value={String(customers)} note="Total customer records" />
    </section>
    <section className="panel mt-6 overflow-hidden">
      <div className="border-b border-[#e5e9e5] px-5 py-4"><h2 className="font-semibold">Workspace utilization</h2><p className="mt-1 text-sm text-[#748078]">Booked time compared with configured availability.</p></div>
      {rankedResources.length ? <div className="divide-y divide-[#e8ebe8]">{rankedResources.map((resource) => <div key={resource.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_2fr_110px] md:items-center">
        <div><p className="font-semibold">{resource.name}</p><p className="mt-1 text-xs text-[#7b857f]">{resource.locationName} · {resource.bookings} bookings</p></div>
        <div><div className="h-2 overflow-hidden rounded-full bg-[#e8ede9]"><div className="h-full rounded-full bg-[#2f725e]" style={{ width: `${resource.utilization}%` }} /></div><p className="mt-2 text-xs text-[#7b857f]">{formatHours(resource.bookedMinutes)} booked / {formatHours(resource.availableMinutes)} available</p></div>
        <p className="text-right text-2xl font-semibold text-[#173f35]">{resource.utilization}%</p>
      </div>)}</div> : <p className="px-5 py-12 text-center text-sm text-[#7b857f]">Add active workspaces and availability rules to see utilization.</p>}
    </section>
  </div>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article className="panel p-5"><div className="flex items-center gap-2 text-[#577066]">{icon}<p className="text-xs font-semibold uppercase tracking-[.08em]">{label}</p></div><p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs text-[#7b857f]">{note}</p></article>;
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours < 10 && !Number.isInteger(hours) ? hours.toFixed(1) : Math.round(hours)}h`;
}
