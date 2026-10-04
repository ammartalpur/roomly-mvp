import Link from "next/link";
import { createResourceAction } from "@/app/actions/foundation";
import { PageHeader } from "@/components/page-header";
import { WorkspaceForm } from "@/components/workspace-form";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewWorkspacePage() {
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const [locations, categories, amenities] = await Promise.all([
    prisma.location.findMany({ where: { organizationId, isActive: true }, include: { floors: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.workspaceCategory.findMany({ where: { organizationId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.amenity.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);
  if (!locations.length) return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="New workspace" title="Add a location first" description="Every workspace must belong to one of your business locations." /><Link className="button button-primary" href="/dashboard/locations">Go to locations</Link></div>;
  const floors = locations.flatMap((location) => location.floors.map((floor) => ({ id: floor.id, name: floor.name, locationId: location.id, locationName: location.name })));
  return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Inventory" title="Create workspace" description="Add the details staff and customers need to identify this space." /><WorkspaceForm action={createResourceAction} locations={locations} floors={floors} categories={categories} amenities={amenities} /></div>;
}
