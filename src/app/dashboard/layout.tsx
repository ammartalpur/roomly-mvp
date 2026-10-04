import { DashboardShell } from "@/components/dashboard-shell";
import { requireMembership } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, membership } = await requireMembership();
  return <DashboardShell user={user} organization={membership.organization} role={membership.role}>{children}</DashboardShell>;
}
