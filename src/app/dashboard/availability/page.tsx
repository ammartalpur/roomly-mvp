import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AvailabilityPage() {
  const { membership } = await requireMembership();
  const resources = await prisma.resource.findMany({
    where: { organizationId: membership.organizationId },
    include: { location: true, bookingPolicy: true, availabilityRules: true, _count: { select: { availabilityOverrides: true, blockedTimes: true } } },
    orderBy: [{ location: { name: "asc" } }, { name: "asc" }],
  });
  return <div className="mx-auto max-w-6xl"><PageHeader eyebrow="Core engine" title="Availability" description="Configure when each workspace can be booked and the rules every booking must follow." />{resources.length === 0 ? <div className="panel"><EmptyState title="No workspaces available" description="Create a workspace before configuring availability." /></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{resources.map((resource) => <Link key={resource.id} href={`/dashboard/availability/${resource.id}`} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-[#aabbb0] hover:shadow-md"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f0e9] text-[#376650]"><CalendarClock size={18} /></span><span className={`badge ${resource.availabilityRules.length ? "badge-green" : ""}`}>{resource.availabilityRules.length ? "Configured" : "Needs hours"}</span></div><h2 className="mt-5 font-semibold">{resource.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-[#748078]"><MapPin size={12} />{resource.location.name}</p><div className="mt-5 flex items-center justify-between border-t border-[#e5e9e5] pt-4 text-xs text-[#69756e]"><span>{resource.bookingPolicy?.bookingMode === "APPROVAL_REQUIRED" ? "Approval required" : "Instant booking"}</span><span className="flex items-center gap-1 font-semibold text-[#336650]">Configure <ArrowRight size={13} /></span></div></Link>)}</div>}</div>;
}
