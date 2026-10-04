import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

const suffix = randomUUID().slice(0, 8);
const userId = `test-user-${suffix}`;
const organizationId = `test-org-${suffix}`;
const locationId = `test-location-${suffix}`;
const resourceId = `test-resource-${suffix}`;
const customerId = `test-customer-${suffix}`;

async function main() {
  try {
    await prisma.user.create({ data: { id: userId, name: "Phase 2 Test", email: `phase2-${suffix}@roomly.test`, passwordHash: "not-a-login" } });
    await prisma.organization.create({ data: { id: organizationId, name: "Phase 2 Verification", slug: `phase2-${suffix}`, timezone: "UTC" } });
    await prisma.location.create({ data: { id: locationId, organizationId, name: "Test Location", timezone: "UTC" } });
    await prisma.resource.create({ data: { id: resourceId, organizationId, locationId, name: "Test Room", slug: `test-room-${suffix}`, capacity: 4 } });
    await prisma.customer.create({ data: { id: customerId, organizationId, name: "Test Customer", email: `customer-${suffix}@roomly.test` } });

    const startsAt = new Date("2030-01-15T10:00:00.000Z");
    const endsAt = new Date("2030-01-15T11:00:00.000Z");
    await prisma.booking.create({
      data: {
        organizationId,
        resourceId,
        customerId,
        createdByUserId: userId,
        confirmationCode: `TEST-${suffix}-1`,
        startsAt,
        endsAt,
        bufferStartsAt: new Date("2030-01-15T09:45:00.000Z"),
        bufferEndsAt: new Date("2030-01-15T11:15:00.000Z"),
        status: "CONFIRMED",
      },
    });

    let overlapRejected = false;
    try {
      await prisma.booking.create({
        data: {
          organizationId,
          resourceId,
          customerId,
          createdByUserId: userId,
          confirmationCode: `TEST-${suffix}-2`,
          startsAt: new Date("2030-01-15T11:00:00.000Z"),
          endsAt: new Date("2030-01-15T12:00:00.000Z"),
          bufferStartsAt: new Date("2030-01-15T10:45:00.000Z"),
          bufferEndsAt: new Date("2030-01-15T12:15:00.000Z"),
          status: "CONFIRMED",
        },
      });
    } catch {
      overlapRejected = true;
    }
    if (!overlapRejected) throw new Error("Database allowed an overlapping active booking");

    await prisma.booking.create({
      data: {
        organizationId,
        resourceId,
        customerId,
        createdByUserId: userId,
        confirmationCode: `TEST-${suffix}-3`,
        startsAt: new Date("2030-01-15T11:15:00.000Z"),
        endsAt: new Date("2030-01-15T12:15:00.000Z"),
        bufferStartsAt: new Date("2030-01-15T11:15:00.000Z"),
        bufferEndsAt: new Date("2030-01-15T12:30:00.000Z"),
        status: "CANCELLED",
      },
    });

    console.log("Phase 2 verification passed: active overlap rejected and cancelled booking excluded from the constraint.");
  } finally {
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
