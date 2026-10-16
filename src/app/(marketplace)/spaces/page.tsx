import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- marketplace photo hosts are configured by each organization */
import { Building2, Clock3, MapPin, Search, SlidersHorizontal, Users } from "lucide-react";
import { DateTime } from "luxon";
import { AvailabilityService } from "@/lib/availability";
import { first, marketplaceHref, pricingLabel } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";

type SearchQuery = { city?: string | string[]; date?: string | string[]; duration?: string | string[]; guests?: string | string[] };

export const metadata = { title: "Find a workspace — Roomly", description: "Discover and book meeting rooms, desks, and private offices." };

export default async function SpacesPage({ searchParams }: { searchParams: Promise<SearchQuery> }) {
  const query = await searchParams;
  const city = first(query.city).trim();
  const date = first(query.date) || DateTime.now().plus({ days: 1 }).toISODate()!;
  const duration = Math.max(30, Number(first(query.duration)) || 60);
  const guests = Math.max(1, Number(first(query.guests)) || 1);
  const resources = await prisma.resource.findMany({
    where: {
      isPublic: true, isActive: true, capacity: { gte: guests }, organization: { isActive: true }, location: {
        isActive: true,
        ...(city ? { OR: [{ city: { contains: city, mode: "insensitive" } }, { name: { contains: city, mode: "insensitive" } }, { address: { contains: city, mode: "insensitive" } }] } : {}),
      },
    },
    include: { organization: true, location: true, category: true, photos: { orderBy: { sortOrder: "asc" }, take: 1 }, amenities: { include: { amenity: true }, take: 4 }, bookingPolicy: true },
    orderBy: { createdAt: "desc" },
  });
  const results = (await Promise.all(resources.map(async (resource) => {
    try {
      const availability = await AvailabilityService.getAvailableSlots({ organizationId: resource.organizationId, resourceId: resource.id, date, durationMinutes: duration });
      return { resource, slots: availability.slots.slice(0, 3), timezone: availability.timezone };
    } catch { return { resource, slots: [], timezone: resource.location.timezone || resource.organization.timezone }; }
  }))).filter((result) => result.slots.length > 0);

  return (
    <main className="flex-1">
      <section className="market-search-hero">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="eyebrow">Roomly marketplace</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Find a space that works for you.</h1>
          <p className="mt-3 max-w-2xl text-[#607068]">Meeting rooms, desks, and private offices with availability you can trust.</p>
          <SearchForm city={city} date={date} duration={duration} guests={guests} />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-[#657169]">{city ? `Spaces near ${city}` : "Available spaces"}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">{results.length} {results.length === 1 ? "space" : "spaces"} available</h2></div><span className="flex items-center gap-2 text-sm text-[#67736d]"><SlidersHorizontal size={15} /> {duration} minutes · {guests} {guests === 1 ? "guest" : "guests"}</span></div>
        {results.length ? <div className="market-grid">{results.map(({ resource, slots, timezone }) => {
          const href = marketplaceHref(resource.organization.slug, resource.slug);
          const params = new URLSearchParams({ date, duration: String(duration), guests: String(guests) });
          return <article key={resource.id} className="market-card">
            <Link href={`${href}?${params}`} className="market-card-image">
              {resource.photos[0]?.url ? <img src={resource.photos[0].url} alt={resource.photos[0].alt || resource.name} /> : <div className="market-photo-placeholder"><Building2 size={32} /><span>Roomly verified space</span></div>}
              <span className="market-mode">{resource.bookingPolicy?.bookingMode === "APPROVAL_REQUIRED" ? "Request to book" : "Instant booking"}</span>
            </Link>
            <div className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#668078]">{resource.category?.name || "Workspace"}</p><h3 className="mt-1 text-xl font-semibold"><Link href={`${href}?${params}`}>{resource.name}</Link></h3></div><strong className="text-sm">{pricingLabel(resource.pricingType, Number(resource.price), resource.currency)}</strong></div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-[#68756e]"><MapPin size={14} /> {[resource.location.name, resource.location.city].filter(Boolean).join(", ")}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#68756e]"><Users size={14} /> Up to {resource.capacity} guests</p>
              {resource.amenities.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{resource.amenities.map(({ amenity }) => <span className="market-chip" key={amenity.id}>{amenity.name}</span>)}</div>}
              <div className="mt-5 border-t border-[#e5e9e5] pt-4"><p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#64716a]"><Clock3 size={13} /> Next available · {timezone}</p><div className="flex flex-wrap gap-2">{slots.map((slot) => <Link className="market-slot" key={slot.localStart} href={`${href}?${new URLSearchParams({ date, duration: String(duration), guests: String(guests), startsAt: slot.localStart, endsAt: slot.localEnd })}`}>{DateTime.fromJSDate(slot.startsAt, { zone: "utc" }).setZone(timezone).toFormat("h:mm a")}</Link>)}</div></div>
            </div>
          </article>;
        })}</div> : <div className="market-empty"><Search size={30} /><h2>No matching rooms are open</h2><p>Try another city, date, duration, or party size.</p></div>}
      </section>
    </main>
  );
}

function SearchForm({ city, date, duration, guests }: { city: string; date: string; duration: number; guests: number }) {
  return <form className="market-search mt-8" action="/spaces"><label><span>Where</span><input name="city" defaultValue={city} placeholder="City or area" /></label><label><span>Date</span><input name="date" type="date" defaultValue={date} required /></label><label><span>Duration</span><select name="duration" defaultValue={duration}>{[30, 60, 90, 120, 180, 240, 480].map((value) => <option value={value} key={value}>{value < 60 ? `${value} min` : `${value / 60} ${value === 60 ? "hour" : "hours"}`}</option>)}</select></label><label><span>Guests</span><input name="guests" type="number" min={1} defaultValue={guests} /></label><button className="button button-primary button-lg"><Search size={17} /> Search</button></form>;
}
