import Link from "next/link";
import { ArrowRight, Mail, Phone, Search, UserRound } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireMembership } from "@/lib/auth";
import { formatInTimezone } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { membership } = await requireMembership();
  const query = q?.trim();
  const customers = await prisma.customer.findMany({
    where: {
      organizationId: membership.organizationId,
      OR: query ? [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }, { phone: { contains: query, mode: "insensitive" } }] : undefined,
    },
    include: {
      _count: { select: { bookings: true } },
      bookings: { select: { startsAt: true }, orderBy: { startsAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  return <div className="mx-auto max-w-6xl"><PageHeader eyebrow="Customer directory" title="Customers" description="Contact details and booking history created automatically from reservations." /><form className="panel mb-5 flex gap-3 p-4"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b857f]" /><input name="q" defaultValue={query} className="pl-9" placeholder="Search name, email, or phone" /></label><button className="button button-secondary">Search</button></form>{customers.length === 0 ? <div className="panel"><EmptyState title="No customers found" description="Customers are created when staff or public visitors make bookings." /></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-[#afbeb5] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8f0e9] text-[#3f6d59]"><UserRound size={19} /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{customer.name}</p><p className="mt-1 flex items-center gap-1 truncate text-xs text-[#748078]"><Mail size={12} />{customer.email}</p>{customer.phone && <p className="mt-1 flex items-center gap-1 text-xs text-[#748078]"><Phone size={12} />{customer.phone}</p>}</div><ArrowRight size={15} className="text-[#97a19b] transition group-hover:translate-x-1" /></div><div className="mt-5 flex items-center justify-between border-t border-[#e7eae7] pt-4"><div><p className="text-xl font-semibold">{customer._count.bookings}</p><p className="text-[11px] text-[#7b857f]">Total bookings</p></div><div className="text-right"><p className="text-xs font-medium">{customer.bookings[0] ? formatInTimezone(customer.bookings[0].startsAt, membership.organization.timezone, "dd LLL yyyy") : "Never"}</p><p className="mt-1 text-[11px] text-[#7b857f]">Last booking</p></div></div></Link>)}</div>}</div>;
}
