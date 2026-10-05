import Link from "next/link";
import { CircleDollarSign, ReceiptText, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

const STATUSES = ["UNPAID", "PARTIAL", "PAID", "REFUNDED"] as const;

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const timezone = membership.organization.timezone;
  const status = STATUSES.includes(query.status as typeof STATUSES[number]) ? query.status as typeof STATUSES[number] : undefined;
  const [bookings, payments] = await Promise.all([
    prisma.booking.findMany({
      where: { organizationId, paymentStatus: status },
      include: { customer: true, resource: true, payments: true },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
    prisma.payment.findMany({ where: { organizationId }, orderBy: { paidAt: "desc" }, take: 200 }),
  ]);
  const received = payments.filter((payment) => payment.status === "PAID" || payment.status === "PARTIAL").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const refunded = payments.filter((payment) => payment.status === "REFUNDED").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const outstanding = bookings.filter((booking) => booking.paymentStatus === "UNPAID" || booking.paymentStatus === "PARTIAL").reduce((sum, booking) => {
    const collected = booking.payments.filter((payment) => payment.status === "PAID" || payment.status === "PARTIAL").reduce((total, payment) => total + Number(payment.amount), 0);
    return sum + Math.max(0, Number(booking.quotedAmount) - collected);
  }, 0);
  const currency = bookings[0]?.currency ?? "PKR";

  return <div className="mx-auto max-w-6xl">
    <PageHeader eyebrow="Commercial operations" title="Payments" description="Track manual payments without waiting for an online payment integration." />
    <section className="grid gap-4 sm:grid-cols-3">
      <Metric icon={<CircleDollarSign size={18} />} label="Received" value={money(received, currency)} />
      <Metric icon={<WalletCards size={18} />} label="Outstanding" value={money(outstanding, currency)} />
      <Metric icon={<ReceiptText size={18} />} label="Refunded" value={money(refunded, currency)} />
    </section>
    <form className="panel my-5 flex flex-wrap items-end gap-3 p-4"><label className="field w-full sm:w-56"><span>Payment status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-secondary">Filter</button></form>
    <section className="panel overflow-hidden"><div className="border-b border-[#e5e9e5] px-5 py-4"><h2 className="font-semibold">Booking balances</h2><p className="mt-1 text-sm text-[#748078]">Open a booking to record or update its payment.</p></div>{bookings.length ? <div className="divide-y divide-[#e7ebe7]">{bookings.map((booking) => {
      const collected = booking.payments.filter((payment) => payment.status === "PAID" || payment.status === "PARTIAL").reduce((sum, payment) => sum + Number(payment.amount), 0);
      return <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="grid gap-3 px-5 py-4 hover:bg-[#fafbf9] sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="font-semibold">{booking.customer.name}</p><p className="mt-1 text-xs text-[#7b857f]">{booking.confirmationCode} · {booking.resource.name}</p></div><div><p className="text-sm font-medium">{money(collected, booking.currency)} / {money(Number(booking.quotedAmount), booking.currency)}</p><p className="mt-1 text-xs text-[#7b857f]">{formatInTimezone(booking.startsAt, timezone, "dd LLL yyyy")}</p></div><span className={`badge payment-${booking.paymentStatus.toLowerCase()}`}>{booking.paymentStatus}</span></Link>;
    })}</div> : <p className="px-5 py-14 text-center text-sm text-[#7b857f]">No bookings match this payment status.</p>}</section>
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="panel p-5"><div className="flex items-center gap-2 text-[#567066]">{icon}<p className="text-xs font-semibold uppercase tracking-[.08em]">{label}</p></div><p className="mt-4 text-2xl font-semibold">{value}</p></article>;
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
