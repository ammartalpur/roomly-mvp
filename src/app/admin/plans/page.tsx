import { updatePlanAction } from "@/app/actions/admin";
import { FormButton } from "@/components/form-button";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { monthlyPrice: "asc" } });
  return <div><PageHeader eyebrow="Platform administration" title="Plans" description="Simple manual SaaS plans; automatic subscription billing is intentionally not enabled." /><div className="grid gap-5 lg:grid-cols-3">{plans.map((plan) => <form key={plan.id} action={updatePlanAction} className="panel p-6"><input type="hidden" name="id" value={plan.id} /><div className="flex items-start justify-between"><div><p className="eyebrow">{plan.slug}</p><h2 className="mt-2 text-xl font-semibold">{plan.name}</h2></div><span className="badge badge-green">{plan._count.subscriptions} businesses</span></div><label className="field mt-6"><span>Monthly price · {plan.currency}</span><input name="monthlyPrice" type="number" min="0" step="0.01" defaultValue={Number(plan.monthlyPrice)} required /></label><label className="field mt-4"><span>Description</span><textarea name="description" rows={4} defaultValue={plan.description ?? ""} /></label><label className="mt-4 flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isActive" defaultChecked={plan.isActive} /> Available for assignment</label><FormButton className="button button-secondary mt-5 w-full">Save plan</FormButton></form>)}</div></div>;
}
