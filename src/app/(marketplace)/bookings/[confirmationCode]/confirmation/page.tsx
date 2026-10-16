import Link from "next/link";
import { CalendarCheck2, CalendarDays, Check, Clock3, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { formatInTimezone } from "@/lib/datetime";
import { money } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Booking confirmed — Roomly" };

export default async function BookingConfirmationPage({ params }: { params: Promise<{ confirmationCode: string }> }) {
  const { confirmationCode } = await params;
  const booking = await prisma.booking.findUnique({ where: { confirmationCode }, include: { organization: true, customer: true, resource: { include: { location: true } } } });
  if (!booking || booking.source !== "CUSTOMER") notFound();
  const timezone = booking.resource.location.timezone || booking.organization.timezone;
  const pending = booking.status === "PENDING";
  return <main className="flex-1 px-5 py-12 sm:px-8"><div className="mx-auto max-w-2xl"><div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e6f2df] text-[#396746]"><Check size={30} /></span><p className="eyebrow mt-6">{pending ? "Request received" : "Booking confirmed"}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.045em]">{pending ? "The host will review your request." : "Your room is reserved."}</h1><p className="mt-3 text-[#657169]">Save your confirmation number: <strong className="text-[#24332c]">{booking.confirmationCode}</strong></p></div><section className="panel mt-8 overflow-hidden"><div className="bg-[#173f35] p-6 text-white"><p className="text-sm text-[#bcd4ca]">{booking.organization.name}</p><h2 className="mt-1 text-2xl font-semibold">{booking.resource.name}</h2></div><div className="grid gap-5 p-6 sm:grid-cols-2"><Detail icon={<CalendarDays size={18} />} label="Date" value={formatInTimezone(booking.startsAt, timezone, "cccc, dd LLLL yyyy")} /><Detail icon={<Clock3 size={18} />} label="Time" value={`${formatInTimezone(booking.startsAt, timezone, "h:mm a")} – ${formatInTimezone(booking.endsAt, timezone, "h:mm a")}`} /><Detail icon={<MapPin size={18} />} label="Location" value={[booking.resource.location.name, booking.resource.location.address, booking.resource.location.city].filter(Boolean).join(", ")} /><Detail icon={<CalendarCheck2 size={18} />} label="Guests" value={`${booking.partySize} ${booking.partySize === 1 ? "guest" : "guests"}`} /><div className="flex items-center justify-between border-t border-[#e2e7e3] pt-5 sm:col-span-2"><span className="text-sm text-[#657169]">Pay at venue</span><strong>{money(Number(booking.quotedAmount), booking.currency)}</strong></div></div></section><div className="mt-6 flex flex-wrap justify-center gap-3"><Link className="button button-primary" href="/bookings/manage">Manage booking</Link><Link className="button button-secondary" href="/spaces">Find another space</Link></div></div></main>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3"><span className="text-[#47705d]">{icon}</span><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#748078]">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div>; }
