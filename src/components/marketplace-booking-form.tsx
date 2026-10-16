"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { createMarketplaceBookingAction, type MarketplaceBookingState } from "@/app/actions/marketplace";

export function MarketplaceBookingForm({ resourceId, startsAt, endsAt, slotLabel, capacity, priceLabel, bookingMode }: {
  resourceId: string; startsAt: string; endsAt: string; slotLabel: string; capacity: number; priceLabel: string; bookingMode: "INSTANT" | "APPROVAL_REQUIRED";
}) {
  const [state, action, pending] = useActionState<MarketplaceBookingState, FormData>(createMarketplaceBookingAction, undefined);
  return (
    <form action={action} className="market-checkout">
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <input type="hidden" name="endsAt" value={endsAt} />
      <div className="market-selection"><div><span>Your selected time</span><strong>{slotLabel}</strong></div><strong>{priceLabel}</strong></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field"><span>Full name</span><input name="customerName" autoComplete="name" required placeholder="Your name" /></label>
        <label className="field"><span>Email address</span><input name="customerEmail" autoComplete="email" type="email" required placeholder="you@example.com" /></label>
        <label className="field"><span>Phone number</span><input name="customerPhone" autoComplete="tel" required placeholder="+92 300 1234567" /></label>
        <label className="field"><span>Guests</span><input name="partySize" type="number" min={1} max={capacity} defaultValue={1} required /></label>
        <label className="field sm:col-span-2"><span>Anything the host should know? <em>Optional</em></span><textarea name="customerNotes" rows={3} placeholder="Accessibility needs, equipment, or arrival details" /></label>
      </div>
      <label className="market-consent"><input type="checkbox" name="acceptedPolicies" required /><span>I agree to the venue rules and understand that cancellations are subject to the host’s policy.</span></label>
      {state?.error && <p className="market-error" role="alert">{state.error}</p>}
      <button className="button button-primary button-lg w-full" disabled={pending}>{pending ? "Securing your room…" : bookingMode === "INSTANT" ? "Book now · Pay at venue" : "Request this room"}<ArrowRight size={17} /></button>
      <div className="market-trust"><span><LockKeyhole size={14} /> Secure booking</span><span><ShieldCheck size={14} /> Live availability checked</span></div>
    </form>
  );
}
