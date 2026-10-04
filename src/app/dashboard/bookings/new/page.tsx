import Link from "next/link";
import { DateTime } from "luxon";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { AvailabilityService } from "@/lib/availability";
import { CreateBookingForm } from "@/components/booking-form";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Search = { resourceId?: string; date?: string; duration?: string; startsAt?: string; endsAt?: string };

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const { membership } = await requireMembership();
  const resources = await prisma.resource.findMany({
    where: { organizationId: membership.organizationId, isActive: true, location: { isActive: true } },
    include: { organization: true, location: true, bookingPolicy: true, availabilityRules: true },
    orderBy: { name: "asc" },
  });
  const selected = resources.find((resource) => resource.id === query.resourceId) ?? resources[0];
  if (!selected) return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="New booking" title="No active workspaces" description="Create and activate a workspace before making a booking." /><EmptyState title="Workspace required" description="Bookings must belong to an active workspace." /></div>;
  const timezone = selected.location.timezone || selected.organization.timezone;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : DateTime.now().setZone(timezone).toISODate()!;
  const duration = Number(query.duration) || selected.bookingPolicy?.minimumDurationMinutes || 60;
  let result: Awaited<ReturnType<typeof AvailabilityService.getAvailableSlots>> | null = null;
  let availabilityError: string | null = null;
  if (query.resourceId && query.date) {
    try {
      result = await AvailabilityService.getAvailableSlots({ organizationId: membership.organizationId, resourceId: selected.id, date, durationMinutes: duration });
    } catch (error) {
      availabilityError = error instanceof Error ? error.message : "Availability could not be calculated";
    }
  }
  const selectedSlot = result?.slots.find((slot) => slot.localStart === query.startsAt && slot.localEnd === query.endsAt);
  return <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Staff booking" title="Find an available time" description="Every slot below comes from Roomly's central availability service." /><form className="panel grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr_1fr_auto]"><label className="field"><span>Workspace</span><select name="resourceId" defaultValue={selected.id}>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name} · {resource.location.name}</option>)}</select></label><label className="field"><span>Date · {timezone}</span><input name="date" type="date" defaultValue={date} required /></label><label className="field"><span>Duration</span><select name="duration" defaultValue={duration}>{[15, 30, 60, 90, 120, 180, 240, 480].filter((minutes) => minutes >= (selected.bookingPolicy?.minimumDurationMinutes ?? 60) && minutes <= (selected.bookingPolicy?.maximumDurationMinutes ?? 480) && minutes % (selected.bookingPolicy?.bookingIncrementMinutes ?? 30) === 0).map((minutes) => <option value={minutes} key={minutes}>{minutes < 60 ? `${minutes} minutes` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`}</option>)}</select></label><div className="flex items-end"><button className="button button-primary w-full">Check times</button></div></form>{availabilityError && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{availabilityError}</p>}{result && <section className="mt-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Available times</h2><p className="mt-1 text-sm text-[#78817c]">{DateTime.fromISO(date, { zone: timezone }).toFormat("cccc, dd LLLL yyyy")} · {result.durationMinutes} minutes</p></div><span className="badge badge-green">{result.slots.length} slots</span></div>{result.slots.length ? <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">{result.slots.map((slot) => { const params = new URLSearchParams({ resourceId: selected.id, date, duration: String(duration), startsAt: slot.localStart, endsAt: slot.localEnd }); return <Link href={`/dashboard/bookings/new?${params}`} key={slot.startsAt.toISOString()} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${selectedSlot?.localStart === slot.localStart ? "border-[#39705e] bg-[#e9f3ec] text-[#285744]" : "border-[#dbe1dc] bg-white hover:border-[#8eaa9b]"}`}><span className="flex items-center gap-2"><Clock3 size={15} />{slot.label}</span><ArrowRight size={14} /></Link>; })}</div> : <div className="panel"><EmptyState title="No available slots" description="Try another date, duration, or check the workspace's availability rules and blocked time." /></div>}</section>}{selectedSlot && <section className="mt-8"><div className="mb-4"><h2 className="font-semibold">Customer details</h2><p className="mt-1 text-sm text-[#78817c]">Create this reservation as a staff booking.</p></div><CreateBookingForm resourceId={selected.id} startsAt={selectedSlot.localStart} endsAt={selectedSlot.localEnd} slotLabel={`${DateTime.fromISO(date, { zone: timezone }).toFormat("dd LLL yyyy")} · ${selectedSlot.label}`} timezone={timezone} /></section>}{!query.resourceId && <div className="panel mt-6 flex items-center gap-4 p-6"><span className="grid size-11 place-items-center rounded-xl bg-[#e8f0e9] text-[#37624f]"><CalendarDays size={20} /></span><div><p className="font-semibold">Choose a date and check times</p><p className="mt-1 text-sm text-[#78817c]">The engine will apply weekly hours, overrides, notice, buffers, blocks, and existing bookings.</p></div></div>}</div>;
}
