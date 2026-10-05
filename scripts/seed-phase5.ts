import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const plans = [
  { id: "plan_starter", name: "Starter", slug: "starter", description: "For small coworking teams getting started.", monthlyPrice: 19 },
  { id: "plan_growth", name: "Growth", slug: "growth", description: "For growing multi-resource businesses.", monthlyPrice: 49 },
  { id: "plan_business", name: "Business", slug: "business", description: "For established operators with multiple locations.", monthlyPrice: 99 },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { slug: plan.slug }, create: { ...plan, currency: "USD" }, update: { name: plan.name, description: plan.description } });
  }

  const adminCount = await prisma.user.count({ where: { isPlatformAdmin: true } });
  if (adminCount === 0) {
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (firstUser) await prisma.user.update({ where: { id: firstUser.id }, data: { isPlatformAdmin: true } });
  }

  const bookings = await prisma.booking.findMany({ where: { quotedAmount: 0 }, include: { resource: true } });
  for (const booking of bookings) {
    const durationMs = Math.max(0, booking.endsAt.getTime() - booking.startsAt.getTime());
    const price = Number(booking.resource.price);
    const amount = booking.resource.pricingType === "FREE" ? 0
      : booking.resource.pricingType === "HOURLY" ? price * durationMs / 3_600_000
      : booking.resource.pricingType === "DAILY" ? price * Math.max(1, Math.ceil(durationMs / 86_400_000))
      : price;
    await prisma.booking.update({ where: { id: booking.id }, data: { quotedAmount: Math.round(amount * 100) / 100, currency: booking.resource.currency } });
  }
}

main().finally(() => prisma.$disconnect());
