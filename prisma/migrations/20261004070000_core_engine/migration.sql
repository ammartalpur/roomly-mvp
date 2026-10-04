-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('INSTANT', 'APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "BlockedTimeType" AS ENUM ('MANUAL', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('CUSTOMER', 'STAFF');

-- CreateEnum
CREATE TYPE "BookingActivityType" AS ENUM ('CREATED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "BookingPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "minimumDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "maximumDurationMinutes" INTEGER NOT NULL DEFAULT 480,
    "bookingIncrementMinutes" INTEGER NOT NULL DEFAULT 30,
    "minimumNoticeMinutes" INTEGER NOT NULL DEFAULT 0,
    "maximumAdvanceDays" INTEGER NOT NULL DEFAULT 90,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "bookingMode" "BookingMode" NOT NULL DEFAULT 'INSTANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedTime" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "type" "BlockedTimeType" NOT NULL DEFAULT 'MANUAL',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "confirmationCode" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "bufferStartsAt" TIMESTAMPTZ(3) NOT NULL,
    "bufferEndsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "source" "BookingSource" NOT NULL DEFAULT 'STAFF',
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "BookingActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingPolicy_resourceId_key" ON "BookingPolicy"("resourceId");

-- CreateIndex
CREATE INDEX "BookingPolicy_organizationId_idx" ON "BookingPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "AvailabilityRule_resourceId_dayOfWeek_idx" ON "AvailabilityRule"("resourceId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "AvailabilityRule_organizationId_idx" ON "AvailabilityRule"("organizationId");

-- CreateIndex
CREATE INDEX "AvailabilityOverride_organizationId_date_idx" ON "AvailabilityOverride"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityOverride_resourceId_date_key" ON "AvailabilityOverride"("resourceId", "date");

-- CreateIndex
CREATE INDEX "BlockedTime_resourceId_startsAt_endsAt_idx" ON "BlockedTime"("resourceId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BlockedTime_organizationId_idx" ON "BlockedTime"("organizationId");

-- CreateIndex
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_email_key" ON "Customer"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmationCode_key" ON "Booking"("confirmationCode");

-- CreateIndex
CREATE INDEX "Booking_resourceId_startsAt_endsAt_idx" ON "Booking"("resourceId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_organizationId_status_startsAt_idx" ON "Booking"("organizationId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "BookingActivity_bookingId_createdAt_idx" ON "BookingActivity"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingActivity_organizationId_idx" ON "BookingActivity"("organizationId");

-- AddForeignKey
ALTER TABLE "BookingPolicy" ADD CONSTRAINT "BookingPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPolicy" ADD CONSTRAINT "BookingPolicy_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivity" ADD CONSTRAINT "BookingActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivity" ADD CONSTRAINT "BookingActivity_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivity" ADD CONSTRAINT "BookingActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Database invariants for availability and reservation safety.
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_valid_day" CHECK ("dayOfWeek" BETWEEN 0 AND 6);
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_valid_minutes" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_valid_minutes" CHECK (
  "isClosed" OR ("startMinute" IS NOT NULL AND "endMinute" IS NOT NULL AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute")
);
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_valid_range" CHECK ("startsAt" < "endsAt");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_valid_range" CHECK (
  "bufferStartsAt" <= "startsAt" AND "startsAt" < "endsAt" AND "endsAt" <= "bufferEndsAt"
);

-- The final guard against concurrent requests creating overlapping bookings.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_active_overlap"
EXCLUDE USING gist (
  "resourceId" WITH =,
  tstzrange("bufferStartsAt", "bufferEndsAt", '[)') WITH &&
)
WHERE ("status" IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus", 'CHECKED_IN'::"BookingStatus"));
