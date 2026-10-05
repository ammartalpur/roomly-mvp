/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BarChart3, Building2, CalendarCheck2, CalendarClock, CalendarDays, ChevronDown, ContactRound, CreditCard, LayoutDashboard, MapPin, Settings2, ShieldCheck, Sparkles, Users2, Warehouse } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { initials } from "@/lib/utils";

const links = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/calendar", "Calendar", CalendarDays],
  ["/dashboard/bookings", "Bookings", CalendarCheck2],
  ["/dashboard/workspaces", "Workspaces", Warehouse],
  ["/dashboard/locations", "Locations & floors", MapPin],
  ["/dashboard/customers", "Customers", ContactRound],
  ["/dashboard/availability", "Availability", CalendarClock],
  ["/dashboard/amenities", "Amenities", Sparkles],
  ["/dashboard/reports", "Reports", BarChart3],
  ["/dashboard/payments", "Payments", CreditCard],
  ["/dashboard/team", "Team", Users2],
  ["/dashboard/organization", "Business settings", Settings2],
] as const;

export function DashboardShell({ children, user, organization, role }: { children: React.ReactNode; user: { name: string; email: string; isPlatformAdmin: boolean }; organization: { name: string; logoUrl: string | null }; role: string }) {
  const visibleLinks = user.isPlatformAdmin ? [...links, ["/admin", "Platform admin", ShieldCheck] as const] : links;
  return <div className="min-h-screen bg-[#f5f6f3] text-[#16211c]"><aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#153b32] px-4 py-5 text-white lg:flex"><Link href="/dashboard" className="flex items-center gap-2 px-2 text-xl font-semibold"><span className="grid size-8 place-items-center rounded-xl bg-[#c9f36b] text-sm text-[#173f35]">R</span>Roomly</Link><div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10 text-xs font-semibold">{organization.logoUrl ? <img src={organization.logoUrl} alt="" className="size-full object-cover" /> : initials(organization.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{organization.name}</p><p className="text-xs capitalize text-[#a9c4ba]">{role.toLowerCase()}</p></div><ChevronDown size={15} className="text-[#a9c4ba]" /></div></div><nav className="mt-8 space-y-1">{visibleLinks.map(([href, label, Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#c7d8d2] transition hover:bg-white/10 hover:text-white"><Icon size={18} />{label}</Link>)}</nav><div className="mt-auto border-t border-white/10 pt-4"><div className="flex items-center gap-3 px-2"><span className="grid size-9 place-items-center rounded-full bg-[#c9f36b] text-xs font-bold text-[#173f35]">{initials(user.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-[#a9c4ba]">{user.email}</p></div></div><form action={logoutAction}><button className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm text-[#a9c4ba] hover:bg-white/10 hover:text-white">Log out</button></form></div></aside><div className="lg:pl-64"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e1e5e0] bg-[#f5f6f3]/90 px-5 backdrop-blur lg:px-9"><Link href="/dashboard" className="flex items-center gap-2 font-semibold text-[#173f35] lg:hidden"><Building2 size={18} />Roomly</Link><p className="hidden text-sm text-[#6b756f] lg:block">Workspace management</p><form action={logoutAction} className="lg:hidden"><button className="text-sm font-medium">Log out</button></form></header><main className="px-5 py-8 lg:px-9 lg:py-10">{children}</main><nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-[#dfe4df] bg-white p-2 lg:hidden">{links.slice(0, 5).map(([href, label, Icon]) => <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] text-[#5f6d66]"><Icon size={18} /><span>{label.split(" ")[0]}</span></Link>)}</nav></div></div>;
}
