import "server-only";

export function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function pricingLabel(type: "HOURLY" | "DAILY" | "MONTHLY" | "FIXED" | "FREE", price: number, currency: string) {
  if (type === "FREE") return "Free";
  const suffix = type === "HOURLY" ? "/ hour" : type === "DAILY" ? "/ day" : type === "MONTHLY" ? "/ month" : " total";
  return `${money(price, currency)} ${suffix}`;
}

export function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function marketplaceHref(organizationSlug: string, resourceSlug: string) {
  return `/spaces/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(resourceSlug)}`;
}
