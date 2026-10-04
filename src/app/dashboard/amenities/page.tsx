import { Plus, Sparkles } from "lucide-react";
import { createAmenityAction, deleteAmenityAction } from "@/app/actions/foundation";
import { FormButton } from "@/components/form-button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { canManage, requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AmenitiesPage() {
  const { membership } = await requireMembership();
  const amenities = await prisma.amenity.findMany({ where: { organizationId: membership.organizationId }, include: { _count: { select: { resources: true } } }, orderBy: { name: "asc" } });
  const allowed = canManage(membership.role);
  return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Workspace features" title="Amenities" description="Create reusable amenities and attach them to any room, desk, or office." />{allowed && <form action={createAmenityAction} className="panel mb-6 flex gap-3 p-5"><input className="min-w-0 flex-1" name="name" placeholder="Wi-Fi, projector, parking…" required /><FormButton><Plus size={16} /> Add amenity</FormButton></form>}<section className="panel overflow-hidden">{amenities.length === 0 ? <EmptyState title="No amenities yet" description="Add features customers care about when choosing a workspace." /> : <div className="divide-y divide-[#e6eae6]">{amenities.map((amenity) => <div key={amenity.id} className="flex items-center gap-4 px-6 py-4"><span className="grid size-9 place-items-center rounded-xl bg-[#eaf3e9] text-[#447250]"><Sparkles size={16} /></span><div className="flex-1"><p className="font-medium">{amenity.name}</p><p className="text-xs text-[#7a847e]">Used by {amenity._count.resources} workspaces</p></div>{allowed && <form action={deleteAmenityAction}><input name="id" type="hidden" value={amenity.id} /><button className="button button-danger button-sm">Remove</button></form>}</div>)}</div>}</section></div>;
}
