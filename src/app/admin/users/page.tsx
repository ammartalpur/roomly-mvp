import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ include: { memberships: { include: { organization: true } } }, orderBy: { createdAt: "desc" }, take: 250 });
  return <div><PageHeader eyebrow="Platform administration" title="Users" description="Registered accounts and their organization access." /><section className="panel overflow-hidden">{users.length ? <div className="divide-y divide-[#e7ebe7]">{users.map((user) => <div key={user.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><div className="flex items-center gap-2"><p className="font-semibold">{user.name}</p>{user.isPlatformAdmin && <span className="badge badge-green">Platform admin</span>}</div><p className="mt-1 text-xs text-[#7b857f]">{user.email}</p></div><div><p className="text-sm font-medium">{user.memberships[0]?.organization.name ?? "No organization"}</p><p className="mt-1 text-xs text-[#7b857f]">{user.memberships.map((membership) => membership.role).join(", ") || "No role"}</p></div><p className="text-xs text-[#7b857f]">Joined {user.createdAt.toLocaleDateString("en")}</p></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-[#7b857f]">No users yet.</p>}</section></div>;
}
