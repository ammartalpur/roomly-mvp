"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { canManage, requireMembership, requireUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type PhotoFormState = { error?: string; success?: string } | undefined;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

async function managerContext() {
  const context = await requireMembership();
  if (!canManage(context.membership.role)) throw new Error("You do not have permission to make this change");
  return context;
}

async function validateResourceRelations(organizationId: string, formData: FormData) {
  const locationId = text(formData, "locationId");
  const floorId = optional(formData, "floorId");
  const categoryId = optional(formData, "categoryId");
  const amenityIds = [...new Set(formData.getAll("amenityIds").map(String))];
  const [location, floor, category, amenityCount] = await Promise.all([
    prisma.location.findFirst({ where: { id: locationId, organizationId } }),
    floorId ? prisma.floor.findFirst({ where: { id: floorId, locationId, organizationId } }) : null,
    categoryId ? prisma.workspaceCategory.findFirst({ where: { id: categoryId, organizationId } }) : null,
    amenityIds.length ? prisma.amenity.count({ where: { id: { in: amenityIds }, organizationId } }) : 0,
  ]);
  if (!location || (floorId && !floor) || (categoryId && !category) || amenityCount !== amenityIds.length) {
    throw new Error("One or more workspace selections are invalid");
  }
  return { locationId, floorId, categoryId, amenityIds };
}

export async function createOrganizationAction(formData: FormData) {
  const user = await requireUser();
  const name = text(formData, "name");
  if (name.length < 2) throw new Error("Business name is required");

  const baseSlug = slugify(text(formData, "slug") || name) || "workspace";
  let slug = baseSlug;
  if (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await prisma.organization.create({
    data: {
      name,
      slug,
      email: optional(formData, "email") ?? user.email,
      timezone: text(formData, "timezone") || "Asia/Karachi",
      members: {
        create: { userId: user.id, invitedEmail: user.email, invitedName: user.name, role: "OWNER" },
      },
    },
  });
  redirect("/dashboard");
}

export async function updateOrganizationAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.organization.update({
    where: { id: membership.organizationId },
    data: {
      name: text(formData, "name"),
      logoUrl: optional(formData, "logoUrl"),
      email: optional(formData, "email"),
      phone: optional(formData, "phone"),
      website: optional(formData, "website"),
      description: optional(formData, "description"),
      timezone: text(formData, "timezone") || "Asia/Karachi",
    },
  });
  revalidatePath("/dashboard", "layout");
}

export async function inviteMemberAction(formData: FormData) {
  const { membership } = await managerContext();
  const email = text(formData, "email").toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  await prisma.organizationMember.create({
    data: {
      organizationId: membership.organizationId,
      userId: existingUser?.id,
      invitedEmail: email,
      invitedName: optional(formData, "name"),
      role: text(formData, "role") === "ADMIN" ? "ADMIN" : "STAFF",
    },
  });
  revalidatePath("/dashboard/team");
}

export async function updateMemberRoleAction(formData: FormData) {
  const { membership } = await managerContext();
  const id = text(formData, "id");
  const role = text(formData, "role") === "ADMIN" ? "ADMIN" : "STAFF";
  await prisma.organizationMember.updateMany({
    where: { id, organizationId: membership.organizationId, role: { not: "OWNER" } },
    data: { role },
  });
  revalidatePath("/dashboard/team");
}

export async function removeMemberAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.organizationMember.deleteMany({
    where: { id: text(formData, "id"), organizationId: membership.organizationId, role: { not: "OWNER" } },
  });
  revalidatePath("/dashboard/team");
}

export async function createLocationAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.location.create({
    data: {
      organizationId: membership.organizationId,
      name: text(formData, "name"),
      address: optional(formData, "address"),
      city: optional(formData, "city"),
      country: optional(formData, "country"),
      timezone: optional(formData, "timezone"),
    },
  });
  revalidatePath("/dashboard/locations");
}

export async function toggleLocationAction(formData: FormData) {
  const { membership } = await managerContext();
  const location = await prisma.location.findFirst({
    where: { id: text(formData, "id"), organizationId: membership.organizationId },
  });
  if (location) await prisma.location.update({ where: { id: location.id }, data: { isActive: !location.isActive } });
  revalidatePath("/dashboard/locations");
}

export async function createFloorAction(formData: FormData) {
  const { membership } = await managerContext();
  const locationId = text(formData, "locationId");
  const location = await prisma.location.findFirst({ where: { id: locationId, organizationId: membership.organizationId } });
  if (!location) throw new Error("Location not found");
  await prisma.floor.create({
    data: {
      organizationId: membership.organizationId,
      locationId,
      name: text(formData, "name"),
      sortOrder: Number(text(formData, "sortOrder")) || 0,
    },
  });
  revalidatePath("/dashboard/locations");
}

export async function deleteFloorAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.floor.deleteMany({ where: { id: text(formData, "id"), organizationId: membership.organizationId } });
  revalidatePath("/dashboard/locations");
}

export async function createCategoryAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.workspaceCategory.create({
    data: {
      organizationId: membership.organizationId,
      name: text(formData, "name"),
      color: text(formData, "color") || "#0f766e",
    },
  });
  revalidatePath("/dashboard/workspaces");
}

export async function createAmenityAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.amenity.create({
    data: { organizationId: membership.organizationId, name: text(formData, "name") },
  });
  revalidatePath("/dashboard/amenities");
  revalidatePath("/dashboard/workspaces");
}

export async function deleteAmenityAction(formData: FormData) {
  const { membership } = await managerContext();
  await prisma.amenity.deleteMany({ where: { id: text(formData, "id"), organizationId: membership.organizationId } });
  revalidatePath("/dashboard/amenities");
}

export async function createResourceAction(formData: FormData) {
  const { membership } = await managerContext();
  const { locationId, floorId, categoryId, amenityIds } = await validateResourceRelations(membership.organizationId, formData);
  const name = text(formData, "name");
  let slug = slugify(name);
  if (await prisma.resource.findUnique({ where: { organizationId_slug: { organizationId: membership.organizationId, slug } } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const resource = await prisma.resource.create({
    data: {
      organizationId: membership.organizationId,
      locationId,
      floorId,
      categoryId,
      name,
      slug,
      description: optional(formData, "description"),
      capacity: Math.max(1, Number(text(formData, "capacity")) || 1),
      pricingType: (text(formData, "pricingType") || "HOURLY") as "HOURLY" | "DAILY" | "MONTHLY" | "FIXED" | "FREE",
      price: Number(text(formData, "price")) || 0,
      currency: text(formData, "currency") || "PKR",
      isPublic: checked(formData, "isPublic"),
      amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
    },
  });
  redirect(`/dashboard/workspaces/${resource.id}`);
}

export async function updateResourceAction(formData: FormData) {
  const { membership } = await managerContext();
  const id = text(formData, "id");
  const resource = await prisma.resource.findFirst({ where: { id, organizationId: membership.organizationId } });
  if (!resource) throw new Error("Workspace not found");
  const { locationId, floorId, categoryId, amenityIds } = await validateResourceRelations(membership.organizationId, formData);
  await prisma.$transaction([
    prisma.resourceAmenity.deleteMany({ where: { resourceId: id } }),
    prisma.resource.update({
      where: { id },
      data: {
        name: text(formData, "name"),
        description: optional(formData, "description"),
        locationId,
        floorId,
        categoryId,
        capacity: Math.max(1, Number(text(formData, "capacity")) || 1),
        pricingType: (text(formData, "pricingType") || "HOURLY") as "HOURLY" | "DAILY" | "MONTHLY" | "FIXED" | "FREE",
        price: Number(text(formData, "price")) || 0,
        currency: text(formData, "currency") || "PKR",
        amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
      },
    }),
  ]);
  revalidatePath(`/dashboard/workspaces/${id}`);
  revalidatePath("/dashboard/workspaces");
}

export async function toggleResourceStatusAction(formData: FormData) {
  const { membership } = await managerContext();
  const id = text(formData, "id");
  const field = text(formData, "field");
  const resource = await prisma.resource.findFirst({ where: { id, organizationId: membership.organizationId } });
  if (!resource) return;
  await prisma.resource.update({
    where: { id },
    data: field === "public" ? { isPublic: !resource.isPublic } : { isActive: !resource.isActive },
  });
  revalidatePath("/dashboard/workspaces", "layout");
}

export async function addPhotoAction(_: PhotoFormState, formData: FormData): Promise<PhotoFormState> {
  try {
    const { membership } = await managerContext();
    const resourceId = text(formData, "resourceId");
    const resource = await prisma.resource.findFirst({ where: { id: resourceId, organizationId: membership.organizationId } });
    if (!resource) return { error: "Workspace not found" };

    const file = formData.get("file");
    let url = text(formData, "url");
    let cloudinaryPublicId: string | null = null;
    if (!(file instanceof File && file.size > 0) && !url) {
      return { error: "Choose an image file or provide an image URL" };
    }

    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) return { error: "Only image files can be uploaded" };
      if (file.size > 5 * 1024 * 1024) return { error: "Images must be 5 MB or smaller" };
      const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return { error: "Image uploads are not configured yet. Add an image URL instead." };
      }
      cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const uploaded = await cloudinary.uploader.upload(`data:${file.type};base64,${base64}`, {
        folder: `roomly/${membership.organizationId}/${resourceId}`,
        resource_type: "image",
      });
      url = uploaded.secure_url;
      cloudinaryPublicId = uploaded.public_id;
    }

    await prisma.resourcePhoto.create({
      data: { resourceId, url, cloudinaryPublicId, alt: optional(formData, "alt") },
    });
    revalidatePath(`/dashboard/workspaces/${resourceId}`);
    return { success: "Photo added successfully" };
  } catch (error) {
    console.error("Adding workspace photo failed", error);
    return { error: "The photo could not be added right now. Please try again." };
  }
}

export async function deletePhotoAction(formData: FormData) {
  const { membership } = await managerContext();
  const photo = await prisma.resourcePhoto.findFirst({
    where: { id: text(formData, "id"), resource: { organizationId: membership.organizationId } },
  });
  if (photo) {
    if (photo.cloudinaryPublicId && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
      await cloudinary.uploader.destroy(photo.cloudinaryPublicId);
    }
    await prisma.resourcePhoto.delete({ where: { id: photo.id } });
  }
  revalidatePath(`/dashboard/workspaces/${text(formData, "resourceId")}`);
}
