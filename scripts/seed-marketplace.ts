import { loadEnvConfig } from "@next/env";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const workspaces = [
  { id: "demo_boardroom", name: "The Boardroom", slug: "the-boardroom", description: "A quiet, polished meeting room for client presentations, planning sessions, and team workshops.", capacity: 10, price: 3500, category: "Meeting room", amenities: ["Fast Wi-Fi", "75-inch display", "Whiteboard", "Video conferencing"] },
  { id: "demo_focus", name: "Focus Studio", slug: "focus-studio", description: "A private, sunlit room designed for deep work, interviews, and focused one-to-one meetings.", capacity: 3, price: 1800, category: "Private office", amenities: ["Fast Wi-Fi", "Natural light", "Air conditioning"] },
  { id: "demo_team", name: "Team Lab", slug: "team-lab", description: "A flexible collaboration room with generous table space for workshops and project teams.", capacity: 16, price: 5000, category: "Team room", amenities: ["Fast Wi-Fi", "Projector", "Whiteboard", "Tea and coffee"] },
];

async function main() {
  const passwordHash = await hash("demo12345", 12);
  const user = await prisma.user.upsert({ where: { email: "host@roomly.test" }, create: { id: "demo_host", name: "Roomly Demo Host", email: "host@roomly.test", passwordHash }, update: { passwordHash } });
  const organization = await prisma.organization.upsert({ where: { slug: "worknest-hyderabad" }, create: { id: "demo_org", name: "WorkNest Coworking", slug: "worknest-hyderabad", email: "hello@worknest.test", phone: "+92 300 555 0101", timezone: "Asia/Karachi", description: "Flexible rooms in the heart of Hyderabad." }, update: { isActive: true } });
  await prisma.organizationMember.upsert({ where: { organizationId_invitedEmail: { organizationId: organization.id, invitedEmail: user.email } }, create: { id: "demo_member", organizationId: organization.id, userId: user.id, invitedEmail: user.email, invitedName: user.name, role: "OWNER" }, update: { userId: user.id, role: "OWNER" } });
  const location = await prisma.location.upsert({ where: { organizationId_name: { organizationId: organization.id, name: "Autobahn Branch" } }, create: { id: "demo_location", organizationId: organization.id, name: "Autobahn Branch", address: "Main Autobahn Road", city: "Hyderabad", country: "Pakistan", timezone: "Asia/Karachi" }, update: { isActive: true } });

  for (const [index, item] of workspaces.entries()) {
    const category = await prisma.workspaceCategory.upsert({ where: { organizationId_name: { organizationId: organization.id, name: item.category } }, create: { id: `demo_category_${index}`, organizationId: organization.id, name: item.category }, update: { isActive: true } });
    const resource = await prisma.resource.upsert({ where: { organizationId_slug: { organizationId: organization.id, slug: item.slug } }, create: { id: item.id, organizationId: organization.id, locationId: location.id, categoryId: category.id, name: item.name, slug: item.slug, description: item.description, capacity: item.capacity, pricingType: "HOURLY", price: item.price, currency: "PKR", isPublic: true, isActive: true }, update: { name: item.name, description: item.description, capacity: item.capacity, price: item.price, isPublic: true, isActive: true } });
    await prisma.bookingPolicy.upsert({ where: { resourceId: resource.id }, create: { organizationId: organization.id, resourceId: resource.id, minimumDurationMinutes: 60, maximumDurationMinutes: 480, bookingIncrementMinutes: 30, minimumNoticeMinutes: 30, maximumAdvanceDays: 90, bufferBeforeMinutes: 0, bufferAfterMinutes: 15, bookingMode: "INSTANT" }, update: {} });
    for (let day = 0; day < 7; day++) {
      const existing = await prisma.availabilityRule.findFirst({ where: { resourceId: resource.id, dayOfWeek: day } });
      if (!existing) await prisma.availabilityRule.create({ data: { organizationId: organization.id, resourceId: resource.id, dayOfWeek: day, startMinute: 8 * 60, endMinute: 20 * 60 } });
    }
    for (const [amenityIndex, name] of item.amenities.entries()) {
      const amenity = await prisma.amenity.upsert({ where: { organizationId_name: { organizationId: organization.id, name } }, create: { id: `demo_amenity_${name.toLowerCase().replaceAll(" ", "_")}`, organizationId: organization.id, name }, update: {} });
      await prisma.resourceAmenity.upsert({ where: { resourceId_amenityId: { resourceId: resource.id, amenityId: amenity.id } }, create: { resourceId: resource.id, amenityId: amenity.id }, update: {} });
      void amenityIndex;
    }
  }
  console.log("Marketplace demo ready: host@roomly.test / demo12345");
}

main().finally(() => prisma.$disconnect());
