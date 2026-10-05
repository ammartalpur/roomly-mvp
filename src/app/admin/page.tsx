import { DateTime } from "luxon";
import { Activity, Building2, CalendarCheck2, CircleOff, Layers3, Users2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const since = DateTime.fromJSDate(new Date()).minus({ days: 30 }).toJSDate();
  const [businesses, activeBusinesses, users, bookings, subscriptions, disabledBusinesses] = await Promise.all([
    prisma.organization.count(), prisma.organization.count({ where: { isActive: true } }), prisma.user.count(), prisma.booking.count({ where: { createdAt: { gte: since } } }), prisma.subscription.count({ where: { status: "ACTIVE" } }), prisma.organization.findMany({ where: { isActive: false }, select: { id: true, name: true, supportNotes: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  return <div><PageHeader eyebrow="SaaS control center" title="Platform overview" description="Monitor Roomly businesses, users, subscriptions, and booking volume." /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Metric icon={<Building2 size={19} />} label="Businesses" value={businesses} note={`${activeBusinesses} active`} /><Metric icon={<Users2 size={19} />} label="Users" value={users} note="Registered accounts" /><Metric icon={<CalendarCheck2 size={19} />} label="Booking volume" value={bookings} note="Created in the last 30 days" /><Metric icon={<Layers3 size={19} />} label="Subscriptions" value={subscriptions} note="Active manual subscriptions" /><Metric icon={<Activity size={19} />} label="Active organizations" value={activeBusinesses} note="Can access business dashboard" /><Metric icon={<CircleOff size={19} />} label="Disabled" value={businesses - activeBusinesses} note="Access paused by platform" /></section><section className="panel mt-6 overflow-hidden"><div className="border-b border-[#e5e9e5] px-5 py-4"><h2 className="font-semibold">Disabled organizations</h2><p className="mt-1 text-sm text-[#748078]">Businesses currently blocked from their dashboards.</p></div>{disabledBusinesses.length ? <div className="divide-y divide-[#e8ebe8]">{disabledBusinesses.map((organization) => <div key={organization.id} className="px-5 py-4"><p className="font-semibold">{organization.name}</p><p className="mt-1 text-sm text-[#748078]">{organization.supportNotes || "No support note recorded"}</p></div>)}</div> : <p className="px-5 py-10 text-sm text-[#748078]">No organizations are disabled.</p>}</section></div>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return <article className="panel p-5"><div className="flex items-center gap-2 text-[#587168]">{icon}<p className="text-xs font-semibold uppercase tracking-[.08em]">{label}</p></div><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-[#7b857f]">{note}</p></article>;
}
