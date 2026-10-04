import Link from "next/link";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight, Clock3, Plus, Wrench } from "lucide-react";
import { createBlockedTimeAction, deleteBlockedTimeAction } from "@/app/actions/availability";
import type { Prisma } from "@/generated/prisma/client";
import { FormButton } from "@/components/form-button";
import { PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

const VIEWS = ["day", "week", "month"] as const;
const STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const START_HOUR = 7;
const END_HOUR = 21;

type Query = { view?: string; date?: string; location?: string; resource?: string; status?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const timezone = membership.organization.timezone;
  const view = VIEWS.includes(query.view as typeof VIEWS[number]) ? query.view as typeof VIEWS[number] : "day";
  const today = DateTime.fromJSDate(new Date(), { zone: "UTC" }).setZone(timezone).startOf("day");
  const base = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? DateTime.fromISO(query.date!, { zone: timezone }).startOf("day") : today;
  const status = STATUSES.includes(query.status as typeof STATUSES[number]) ? query.status as typeof STATUSES[number] : undefined;
  const displayStart = view === "day" ? base : view === "week" ? base.startOf("week") : base.startOf("month").startOf("week");
  const displayEnd = view === "day" ? base.plus({ days: 1 }) : view === "week" ? displayStart.plus({ days: 7 }) : base.endOf("month").endOf("week").plus({ milliseconds: 1 });

  const [locations, resources] = await Promise.all([
    prisma.location.findMany({ where: { organizationId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.resource.findMany({
      where: { organizationId, isActive: true, locationId: query.location || undefined },
      include: { location: true },
      orderBy: [{ location: { name: "asc" } }, { name: "asc" }],
    }),
  ]);
  const resourceIds = resources.filter((resource) => !query.resource || resource.id === query.resource).map((resource) => resource.id);
  const [bookings, blocks] = resourceIds.length ? await Promise.all([
    prisma.booking.findMany({
      where: { organizationId, resourceId: { in: resourceIds }, status, startsAt: { lt: displayEnd.toUTC().toJSDate() }, endsAt: { gt: displayStart.toUTC().toJSDate() } },
      include: { customer: true, resource: { include: { location: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.blockedTime.findMany({
      where: { organizationId, resourceId: { in: resourceIds }, startsAt: { lt: displayEnd.toUTC().toJSDate() }, endsAt: { gt: displayStart.toUTC().toJSDate() } },
      include: { resource: true },
      orderBy: { startsAt: "asc" },
    }),
  ]) : [[], []];

  const step = view === "day" ? { days: 1 } : view === "week" ? { weeks: 1 } : { months: 1 };
  const href = (date: DateTime, nextView = view) => calendarHref({ ...query, view: nextView, date: date.toISODate()! });
  const filteredResources = resources.filter((resource) => !query.resource || resource.id === query.resource);
  const blockStart = base.set({ hour: 9, minute: 0 }).toFormat("yyyy-LL-dd'T'HH:mm");
  const blockEnd = base.set({ hour: 10, minute: 0 }).toFormat("yyyy-LL-dd'T'HH:mm");

  return <div className="mx-auto max-w-[1500px]"><PageHeader eyebrow="Operations calendar" title={calendarTitle(base, view)} description={`Bookings and blocked time · ${timezone}`} action={<div className="flex gap-2"><Link href="/dashboard/bookings/new" className="button button-primary"><Plus size={15} /> New booking</Link></div>} /><section className="panel mb-5 p-4"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><form className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><input type="hidden" name="view" value={view} /><input type="hidden" name="date" value={base.toISODate()!} /><label className="field"><span>Location</span><select name="location" defaultValue={query.location ?? ""}><option value="">All locations</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label className="field"><span>Workspace</span><select name="resource" defaultValue={query.resource ?? ""}><option value="">All workspaces</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label><label className="field"><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></label><div className="flex items-end"><button className="button button-secondary w-full">Apply filters</button></div></form><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl border border-[#d9dfda] bg-white p-1">{VIEWS.map((item) => <Link key={item} href={href(base, item)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${view === item ? "bg-[#173f35] text-white" : "text-[#66736c] hover:bg-[#f0f3f0]"}`}>{item}</Link>)}</div><Link href={href(base.minus(step))} className="button button-secondary button-sm" aria-label="Previous"><ChevronLeft size={16} /></Link><Link href={href(today)} className="button button-secondary button-sm">Today</Link><Link href={href(base.plus(step))} className="button button-secondary button-sm" aria-label="Next"><ChevronRight size={16} /></Link></div></div></section><div className="grid gap-6 xl:grid-cols-[1fr_310px]"><section className="panel min-w-0 overflow-hidden">{view === "day" ? <DayTimeline date={base} timezone={timezone} resources={filteredResources} bookings={bookings} blocks={blocks} /> : view === "week" ? <WeekCalendar start={displayStart} timezone={timezone} bookings={bookings} blocks={blocks} query={query} /> : <MonthCalendar start={displayStart} end={displayEnd} month={base.month} timezone={timezone} bookings={bookings} query={query} />}</section><aside className="space-y-5"><section className="panel p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e8edf3] text-[#4d6178]"><Wrench size={17} /></span><div><h2 className="font-semibold">Manual block</h2><p className="text-xs text-[#7b857f]">Hold time from bookings</p></div></div>{resources.length ? <form action={createBlockedTimeAction} className="mt-5 space-y-4"><label className="field"><span>Workspace</span><select name="resourceId" defaultValue={query.resource ?? resources[0]?.id}>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label><label className="field"><span>Starts</span><input name="startsAt" type="datetime-local" defaultValue={blockStart} required /></label><label className="field"><span>Ends</span><input name="endsAt" type="datetime-local" defaultValue={blockEnd} required /></label><label className="field"><span>Type</span><select name="type"><option value="MANUAL">Manual block</option><option value="MAINTENANCE">Maintenance</option></select></label><label className="field"><span>Reason</span><input name="reason" placeholder="Cleaning or private use" /></label><FormButton className="button button-secondary w-full"><Plus size={15} /> Add block</FormButton></form> : <p className="mt-4 text-sm text-[#7b857f]">No active workspace available.</p>}</section>{blocks.length > 0 && <section className="panel p-5"><h2 className="font-semibold">Blocks in view</h2><div className="mt-3 divide-y divide-[#e5e9e5]">{blocks.slice(0, 8).map((block) => <div key={block.id} className="flex gap-3 py-3"><Clock3 size={15} className="mt-0.5 text-[#6d7872]" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{block.resource.name}</p><p className="mt-1 text-xs text-[#7b857f]">{formatInTimezone(block.startsAt, timezone, "dd LLL, h:mm a")}</p></div><form action={deleteBlockedTimeAction}><input type="hidden" name="id" value={block.id} /><input type="hidden" name="resourceId" value={block.resourceId} /><button className="text-xs font-semibold text-red-600">Remove</button></form></div>)}</div></section>}</aside></div></div>;
}

type CalendarBooking = Prisma.BookingGetPayload<{ include: { customer: true; resource: { include: { location: true } } } }>;
type CalendarBlock = Prisma.BlockedTimeGetPayload<{ include: { resource: true } }>;

function DayTimeline({ date, timezone, resources, bookings, blocks }: { date: DateTime; timezone: string; resources: Array<{ id: string; name: string; location: { name: string } }>; bookings: CalendarBooking[]; blocks: CalendarBlock[] }) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  return <div className="overflow-x-auto"><div className="min-w-[950px]"><div className="grid grid-cols-[180px_1fr] border-b border-[#e4e8e4] bg-[#fafbf9]"><div className="px-5 py-4 text-xs font-semibold uppercase tracking-[.1em] text-[#7b857f]">Workspace</div><div className="relative h-14">{hours.map((hour, index) => <span key={hour} className="absolute top-4 -translate-x-1/2 text-[11px] text-[#7b857f]" style={{ left: `${(index / (hours.length - 1)) * 100}%` }}>{DateTime.fromObject({ hour }, { zone: timezone }).toFormat("h a")}</span>)}</div></div>{resources.length ? resources.map((resource) => { const resourceBookings = bookings.filter((booking) => booking.resourceId === resource.id && DateTime.fromJSDate(booking.startsAt, { zone: "UTC" }).setZone(timezone).hasSame(date, "day")); const resourceBlocks = blocks.filter((block) => block.resourceId === resource.id && DateTime.fromJSDate(block.startsAt, { zone: "UTC" }).setZone(timezone).hasSame(date, "day")); return <div key={resource.id} className="grid min-h-24 grid-cols-[180px_1fr] border-b border-[#edf0ed] last:border-0"><div className="border-r border-[#e8ece8] px-5 py-5"><p className="text-sm font-semibold">{resource.name}</p><p className="mt-1 text-xs text-[#7c857f]">{resource.location.name}</p></div><div className="relative my-3 overflow-hidden rounded-r-xl bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(7.14%_-_1px),#edf0ed_calc(7.14%_-_1px),#edf0ed_7.14%)]">{resourceBlocks.map((block) => <TimelineBlock key={block.id} start={block.startsAt} end={block.endsAt} timezone={timezone} totalMinutes={totalMinutes} label={block.reason || (block.type === "MAINTENANCE" ? "Maintenance" : "Blocked")} />)}{resourceBookings.map((booking) => <TimelineBooking key={booking.id} booking={booking} timezone={timezone} totalMinutes={totalMinutes} />)}</div></div>; }) : <div className="px-6 py-16 text-center text-sm text-[#7c857f]">No workspaces match these filters.</div>}</div></div>;
}

function TimelineBooking({ booking, timezone, totalMinutes }: { booking: CalendarBooking; timezone: string; totalMinutes: number }) {
  const start = DateTime.fromJSDate(booking.startsAt, { zone: "UTC" }).setZone(timezone);
  const end = DateTime.fromJSDate(booking.endsAt, { zone: "UTC" }).setZone(timezone);
  const startMinute = start.hour * 60 + start.minute;
  const endMinute = end.hour * 60 + end.minute;
  const left = Math.max(0, ((startMinute - START_HOUR * 60) / totalMinutes) * 100);
  const width = Math.max(2, ((Math.min(endMinute, END_HOUR * 60) - Math.max(startMinute, START_HOUR * 60)) / totalMinutes) * 100);
  return <Link href={`/dashboard/bookings/${booking.id}`} className={`absolute top-2 h-14 overflow-hidden rounded-lg border px-2 py-1.5 text-[11px] shadow-sm booking-${booking.status.toLowerCase()}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${booking.customer.name} · ${start.toFormat("h:mm a")}–${end.toFormat("h:mm a")}`}><strong className="block truncate">{booking.customer.name}</strong><span className="block truncate opacity-80">{start.toFormat("h:mm")}–{end.toFormat("h:mm a")}</span></Link>;
}

function TimelineBlock({ start, end, timezone, totalMinutes, label }: { start: Date; end: Date; timezone: string; totalMinutes: number; label: string }) {
  const localStart = DateTime.fromJSDate(start, { zone: "UTC" }).setZone(timezone);
  const localEnd = DateTime.fromJSDate(end, { zone: "UTC" }).setZone(timezone);
  const startMinute = localStart.hour * 60 + localStart.minute;
  const endMinute = localEnd.hour * 60 + localEnd.minute;
  const left = Math.max(0, ((startMinute - START_HOUR * 60) / totalMinutes) * 100);
  const width = Math.max(2, ((Math.min(endMinute, END_HOUR * 60) - Math.max(startMinute, START_HOUR * 60)) / totalMinutes) * 100);
  return <div className="absolute bottom-1 top-1 rounded-lg border border-slate-300 bg-[repeating-linear-gradient(135deg,#e8edf0_0,#e8edf0_6px,#dce3e7_6px,#dce3e7_12px)] px-2 py-1 text-[10px] font-semibold text-slate-600" style={{ left: `${left}%`, width: `${width}%` }}>{label}</div>;
}

function WeekCalendar({ start, timezone, bookings, blocks, query }: { start: DateTime; timezone: string; bookings: CalendarBooking[]; blocks: CalendarBlock[]; query: Query }) {
  const days = Array.from({ length: 7 }, (_, index) => start.plus({ days: index }));
  return <div className="overflow-x-auto"><div className="grid min-w-[900px] grid-cols-7 divide-x divide-[#e6eae6]">{days.map((day) => { const dayBookings = bookings.filter((booking) => DateTime.fromJSDate(booking.startsAt, { zone: "UTC" }).setZone(timezone).hasSame(day, "day")); const dayBlocks = blocks.filter((block) => DateTime.fromJSDate(block.startsAt, { zone: "UTC" }).setZone(timezone).hasSame(day, "day")); return <div key={day.toISODate()} className="min-h-[620px]"><Link href={calendarHref({ ...query, view: "day", date: day.toISODate()! })} className="block border-b border-[#e6eae6] px-3 py-4 text-center hover:bg-[#f7f9f7]"><p className="text-xs font-semibold uppercase tracking-[.08em] text-[#7b857f]">{day.toFormat("ccc")}</p><p className="mt-1 text-xl font-semibold">{day.day}</p></Link><div className="space-y-2 p-2">{dayBookings.map((booking) => <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className={`block rounded-lg border p-2 text-xs booking-${booking.status.toLowerCase()}`}><strong className="block truncate">{formatInTimezone(booking.startsAt, timezone, "h:mm a")} · {booking.customer.name}</strong><span className="mt-1 block truncate opacity-75">{booking.resource.name}</span></Link>)}{dayBlocks.map((block) => <div key={block.id} className="rounded-lg border border-slate-300 bg-slate-100 p-2 text-xs text-slate-600"><strong className="block truncate">{formatInTimezone(block.startsAt, timezone, "h:mm a")} · Blocked</strong><span className="mt-1 block truncate">{block.resource.name}</span></div>)}</div></div>; })}</div></div>;
}

function MonthCalendar({ start, end, month, timezone, bookings, query }: { start: DateTime; end: DateTime; month: number; timezone: string; bookings: CalendarBooking[]; query: Query }) {
  const days: DateTime[] = [];
  for (let day = start; day < end; day = day.plus({ days: 1 })) days.push(day);
  return <div><div className="grid grid-cols-7 border-b border-[#e6eae6] bg-[#fafbf9]">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-[#7b857f]">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const dayBookings = bookings.filter((booking) => DateTime.fromJSDate(booking.startsAt, { zone: "UTC" }).setZone(timezone).hasSame(day, "day")); return <div key={day.toISODate()} className={`min-h-28 border-b border-r border-[#e9ece9] p-2 ${day.month === month ? "bg-white" : "bg-[#f7f8f6] text-[#9aa29d]"}`}><Link href={calendarHref({ ...query, view: "day", date: day.toISODate()! })} className="inline-grid size-7 place-items-center rounded-lg text-xs font-semibold hover:bg-[#eaf1ec]">{day.day}</Link><div className="mt-1 space-y-1">{dayBookings.slice(0, 3).map((booking) => <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className={`block truncate rounded border px-1.5 py-1 text-[10px] booking-${booking.status.toLowerCase()}`}>{formatInTimezone(booking.startsAt, timezone, "h:mm")} {booking.customer.name}</Link>)}{dayBookings.length > 3 && <p className="px-1 text-[10px] font-semibold text-[#68746d]">+{dayBookings.length - 3} more</p>}</div></div>; })}</div></div>;
}

function calendarHref(query: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  return `/dashboard/calendar?${params}`;
}

function calendarTitle(date: DateTime, view: typeof VIEWS[number]) {
  if (view === "day") return date.toFormat("cccc, dd LLLL yyyy");
  if (view === "week") return `${date.startOf("week").toFormat("dd LLL")} – ${date.endOf("week").toFormat("dd LLL yyyy")}`;
  return date.toFormat("LLLL yyyy");
}
