/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { deletePhotoAction, updateResourceAction } from "@/app/actions/foundation";
import { PageHeader } from "@/components/page-header";
import { PhotoUploadForm } from "@/components/photo-upload-form";
import { WorkspaceForm } from "@/components/workspace-form";
import { requireMembership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const [resource, locations, categories, amenities] = await Promise.all([
    prisma.resource.findFirst({
      where: { id, organizationId },
      include: { photos: { orderBy: { sortOrder: "asc" } }, amenities: true },
    }),
    prisma.location.findMany({
      where: { organizationId },
      include: { floors: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.workspaceCategory.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.amenity.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);
  if (!resource) notFound();

  const floors = locations.flatMap((location) =>
    location.floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      locationId: location.id,
      locationName: location.name,
    })),
  );
  const values = {
    id: resource.id,
    name: resource.name,
    description: resource.description,
    locationId: resource.locationId,
    floorId: resource.floorId,
    categoryId: resource.categoryId,
    capacity: resource.capacity,
    pricingType: resource.pricingType,
    price: resource.price.toString(),
    currency: resource.currency,
    isPublic: resource.isPublic,
    amenityIds: resource.amenities.map((item) => item.amenityId),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Workspace details" title={resource.name} description="Update inventory details, pricing, amenities, and photos." />
      <WorkspaceForm action={updateResourceAction} locations={locations} floors={floors} categories={categories} amenities={amenities} resource={values} />
      <section className="panel mt-6 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Workspace photos</h2>
        <p className="mt-1 text-sm text-[#78817c]">Upload to Cloudinary when configured, or paste an existing hosted image URL. The first image becomes the cover.</p>
        <PhotoUploadForm resourceId={resource.id} resourceName={resource.name} />
        {resource.photos.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resource.photos.map((photo) => (
              <figure className="overflow-hidden rounded-2xl border border-[#dfe4df]" key={photo.id}>
                <div className="aspect-[4/3] bg-[#e8ece8]"><img src={photo.url} alt={photo.alt ?? resource.name} className="size-full object-cover" /></div>
                <figcaption className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-[#6f7973]">{photo.alt ?? "Workspace photo"}</span>
                  <form action={deletePhotoAction}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <button className="text-xs font-semibold text-red-600">Remove</button>
                  </form>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : <p className="mt-6 rounded-2xl bg-[#f4f6f3] px-5 py-8 text-center text-sm text-[#7c857f]">No photos added yet.</p>}
      </section>
    </div>
  );
}
