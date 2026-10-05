import Link from "next/link";
import { BarChart3, Building2, Layers3, LogOut, Users2 } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { requirePlatformAdmin } from "@/lib/auth";

const links = [["/admin", "Overview", BarChart3], ["/admin/businesses", "Businesses", Building2], ["/admin/users", "Users", Users2], ["/admin/plans", "Plans", Layers3]] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdmin();
  return <div className="min-h-screen bg-[#f4f5f2] text-[#17211c]"><header className="border-b border-[#dfe4df] bg-[#102f28] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/admin" className="flex items-center gap-3 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#c9f36b] text-[#173f35]">R</span><span>Roomly Platform</span></Link><div className="flex items-center gap-4"><Link href="/dashboard" className="text-sm text-[#c4d6cf] hover:text-white">Business dashboard</Link><form action={logoutAction}><button aria-label="Log out" className="text-[#c4d6cf] hover:text-white"><LogOut size={18} /></button></form></div></div></header><div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[210px_1fr]"><aside><p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[.1em] text-[#818b85]">Platform admin</p><nav className="space-y-1">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5d6a63] hover:bg-white hover:text-[#173f35]"><Icon size={17} />{label}</Link>)}</nav><p className="mt-8 px-3 text-xs text-[#818b85]">Signed in as<br /><span className="font-medium text-[#56635c]">{user.email}</span></p></aside><main className="min-w-0">{children}</main></div></div>;
}
