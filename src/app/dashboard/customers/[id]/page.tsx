import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck2, Mail, Phone, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { membership } = await requireMembership();
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: membership.organizationId },
    include: { bookings: { include: { resource: { include: { location: true, organization: true } } }, orderBy: { startsAt: "desc" } } },
  });
  if (!customer) notFound();
  const completed = customer.bookings.filter((booking) => booking.status === "COMPLETED").length;
  const cancelled = customer.bookings.filter((booking) => ["CANCELLED", "NO_SHOW"].includes(booking.status)).length;
  return <div className="mx-auto max-w-5xl"><Link href="/dashboard/customers" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-[#527066]"><ArrowLeft size={15} /> Customers</Link><PageHeader eyebrow="Customer profile" title={customer.name} description="Contact details and complete reservation history." action={<Link href="/dashboard/bookings/new" className="button button-primary">Create booking</Link>} /><div className="grid gap-6 lg:grid-cols-[300px_1fr]"><aside className="space-y-5"><section className="panel p-6"><span className="grid size-14 place-items-center rounded-full bg-[#e8f0e9] text-[#3f6d59]"><UserRound size={24} /></span><div className="mt-5 space-y-3"><p className="flex items-center gap-2 text-sm"><Mail size={15} className="text-[#718078]" />{customer.email}</p>{customer.phone && <p className="flex items-center gap-2 text-sm"><Phone size={15} className="text-[#718078]" />{customer.phone}</p>}</div></section><section className="panel grid grid-cols-3 divide-x divide-[#e5e9e5] p-4 text-center"><div><p className="text-xl font-semibold">{customer.bookings.length}</p><p className="mt-1 text-[10px] text-[#7b857f]">Total</p></div><div><p className="text-xl font-semibold">{completed}</p><p className="mt-1 text-[10px] text-[#7b857f]">Completed</p></div><div><p className="text-xl font-semibold">{cancelled}</p><p className="mt-1 text-[10px] text-[#7b857f]">Exceptions</p></div></section></aside><section className="panel overflow-hidden"><div className="flex items-center gap-3 border-b border-[#e5e9e5] px-6 py-5"><CalendarCheck2 size={18} className="text-[#41705e]" /><div><h2 className="font-semibold">Booking history</h2><p className="text-xs text-[#7b857f]">Newest first</p></div></div>{customer.bookings.length ? <div className="divide-y divide-[#e7eae7]">{customer.bookings.map((booking) => { const zone = booking.resource.location.timezone || booking.resource.organization.timezone; return <Link href={`/dashboard/bookings/${booking.id}`} key={booking.id} className="grid gap-3 px-6 py-4 hover:bg-[#fafbf9] sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="font-medium">{booking.resource.name}</p><p className="mt-1 text-xs text-[#7b857f]">{booking.resource.location.name} · {booking.confirmationCode}</p></div><div><p className="text-sm font-medium">{formatInTimezone(booking.startsAt, zone, "dd LLL yyyy")}</p><p className="mt-1 text-xs text-[#7b857f]">{formatInTimezone(booking.startsAt, zone, "h:mm a")} – {formatInTimezone(booking.endsAt, zone, "h:mm a")}</p></div><span className={`badge booking-${booking.status.toLowerCase()}`}>{booking.status.replace("_", " ")}</span></Link>; })}</div> : <p className="px-6 py-12 text-center text-sm text-[#7b857f]">No bookings yet.</p>}</section></div></div>;
}
