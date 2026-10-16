import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- marketplace photo hosts are configured by each organization */
import { ArrowLeft, Building2, Check, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { DateTime } from "luxon";
import { notFound } from "next/navigation";
import { MarketplaceBookingForm } from "@/components/marketplace-booking-form";
import { AvailabilityService } from "@/lib/availability";
import { first, money, pricingLabel } from "@/lib/marketplace";
import { calculateBookingPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

type Query = { date?: string | string[]; duration?: string | string[]; guests?: string | string[]; startsAt?: string | string[]; endsAt?: string | string[]; checked?: string | string[] };

export default async function SpaceDetailPage({ params, searchParams }: { params: Promise<{ organizationSlug: string; resourceSlug: string }>; searchParams: Promise<Query> }) {
  const [{ organizationSlug, resourceSlug }, query] = await Promise.all([params, searchParams]);
  const resource = await prisma.resource.findFirst({
    where: { slug: resourceSlug, isPublic: true, isActive: true, organization: { slug: organizationSlug, isActive: true }, location: { isActive: true } },
    include: { organization: true, location: true, floor: true, category: true, photos: { orderBy: { sortOrder: "asc" } }, amenities: { include: { amenity: true } }, bookingPolicy: true },
  });
  if (!resource) notFound();
  const timezone = resource.location.timezone || resource.organization.timezone;
  const date = first(query.date) || DateTime.now().setZone(timezone).plus({ days: 1 }).toISODate()!;
  const duration = Math.max(30, Number(first(query.duration)) || resource.bookingPolicy?.minimumDurationMinutes || 60);
  const guests = Math.max(1, Number(first(query.guests)) || 1);
  const checked = first(query.checked) === "1";
  let slots: Awaited<ReturnType<typeof AvailabilityService.getAvailableSlots>>["slots"] = [];
  let error = "";
  try { slots = (await AvailabilityService.getAvailableSlots({ organizationId: resource.organizationId, resourceId: resource.id, date, durationMinutes: duration })).slots; } catch (caught) { error = caught instanceof Error ? caught.message : "Availability could not be loaded"; }
  const selectedStart = first(query.startsAt);
  const selectedEnd = first(query.endsAt);
  const selected = slots.find((slot) => slot.localStart === selectedStart && slot.localEnd === selectedEnd);
  const total = selected ? calculateBookingPrice({ pricingType: resource.pricingType, price: resource.price, startsAt: selected.startsAt, endsAt: selected.endsAt }) : 0;
  const detailPath = `/spaces/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(resourceSlug)}`;
  return <main className="flex-1"><div className="mx-auto max-w-7xl px-5 py-7 sm:px-8"><Link href={`/spaces?${new URLSearchParams({ date, duration: String(duration), guests: String(guests) })}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4b6b60]"><ArrowLeft size={15} /> Back to results</Link>
    <div className="market-gallery mt-5">{resource.photos.length ? resource.photos.slice(0, 3).map((photo, index) => <img className={index === 0 ? "market-gallery-main" : ""} key={photo.id} src={photo.url} alt={photo.alt || resource.name} />) : <div className="market-gallery-placeholder"><Building2 size={42} /><span>Photos coming soon</span></div>}</div>
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_390px]"><div><p className="text-sm font-semibold text-[#557066]">{resource.category?.name || "Workspace"} hosted by {resource.organization.name}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">{resource.name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#627069]"><span className="flex items-center gap-1.5"><MapPin size={15} /> {[resource.location.name, resource.location.city, resource.location.country].filter(Boolean).join(", ")}</span><span className="flex items-center gap-1.5"><Users size={15} /> Up to {resource.capacity} guests</span><span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Live availability</span></div>
      <hr className="my-7 border-[#e1e6e2]" /><h2 className="text-xl font-semibold">About this space</h2><p className="mt-3 whitespace-pre-line leading-7 text-[#59675f]">{resource.description || "A comfortable, professionally managed workspace available to book through Roomly."}</p>
      <h2 className="mt-8 text-xl font-semibold">What this space offers</h2>{resource.amenities.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{resource.amenities.map(({ amenity }) => <div key={amenity.id} className="flex items-center gap-3 rounded-xl border border-[#e0e5e1] bg-white px-4 py-3 text-sm font-medium"><Check size={16} className="text-[#4b795e]" />{amenity.name}</div>)}</div> : <p className="mt-3 text-[#6c7771]">Contact the host for amenity details.</p>}
      <h2 className="mt-8 text-xl font-semibold">Where you’ll be</h2><div className="mt-4 rounded-2xl bg-[#e8eee9] p-6"><MapPin size={20} /><p className="mt-3 font-semibold">{resource.location.name}</p><p className="mt-1 text-sm text-[#657169]">{[resource.location.address, resource.location.city, resource.location.country].filter(Boolean).join(", ")}</p>{resource.floor && <p className="mt-1 text-sm text-[#657169]">{resource.floor.name}</p>}</div>
    </div><aside><div className="market-booking-card"><div className="flex items-start justify-between gap-4"><div><strong className="text-xl">{pricingLabel(resource.pricingType, Number(resource.price), resource.currency)}</strong><p className="mt-1 text-xs text-[#6c7871]">No online payment required for this test</p></div><span className="market-mode static">{resource.bookingPolicy?.bookingMode === "APPROVAL_REQUIRED" ? "Request" : "Instant"}</span></div>
      {!selected ? <><form className="mt-6 grid gap-3" action={detailPath}><input type="hidden" name="checked" value="1" /><label className="field"><span>Date · {timezone}</span><input name="date" type="date" defaultValue={date} required /></label><div className="grid grid-cols-2 gap-3"><label className="field"><span>Duration</span><select name="duration" defaultValue={duration}>{[30, 60, 90, 120, 180, 240, 480].map((value) => <option key={value} value={value}>{value < 60 ? `${value} min` : `${value / 60} hr`}</option>)}</select></label><label className="field"><span>Guests</span><input name="guests" type="number" min={1} max={resource.capacity} defaultValue={guests} /></label></div><button className="button button-secondary">Check availability</button></form>
        <div className="mt-6 border-t border-[#e2e7e3] pt-5">{checked && !error && <p className="market-success" role="status"><Check size={15} /> Availability checked · {slots.length} {slots.length === 1 ? "time" : "times"} open</p>}<p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock3 size={15} /> Available times</p>{error ? <p className="market-error">{error}</p> : slots.length ? <div className="grid grid-cols-2 gap-2">{slots.map((slot) => <Link key={slot.localStart} className="market-slot justify-center" href={`${detailPath}?${new URLSearchParams({ date, duration: String(duration), guests: String(guests), startsAt: slot.localStart, endsAt: slot.localEnd })}`}>{DateTime.fromJSDate(slot.startsAt, { zone: "utc" }).setZone(timezone).toFormat("h:mm a")}</Link>)}</div> : <p className="text-sm text-[#6d7872]">No times are available. Try another date.</p>}</div></> : <MarketplaceBookingForm resourceId={resource.id} startsAt={selected.localStart} endsAt={selected.localEnd} slotLabel={`${DateTime.fromISO(date, { zone: timezone }).toFormat("ccc, dd LLL")} · ${selected.label}`} capacity={resource.capacity} priceLabel={money(total, resource.currency)} bookingMode={resource.bookingPolicy?.bookingMode || "INSTANT"} />}
    </div></aside></div>
  </div></main>;
}
