import "server-only";

type PricingInput = {
  pricingType: "HOURLY" | "DAILY" | "MONTHLY" | "FIXED" | "FREE";
  price: { toString(): string } | number;
  startsAt: Date;
  endsAt: Date;
};

export function calculateBookingPrice(input: PricingInput) {
  const basePrice = Number(input.price);
  const durationMs = Math.max(0, input.endsAt.getTime() - input.startsAt.getTime());
  let amount = basePrice;

  if (input.pricingType === "FREE") amount = 0;
  if (input.pricingType === "HOURLY") amount = basePrice * (durationMs / 3_600_000);
  if (input.pricingType === "DAILY") amount = basePrice * Math.max(1, Math.ceil(durationMs / 86_400_000));

  return Math.round(amount * 100) / 100;
}
