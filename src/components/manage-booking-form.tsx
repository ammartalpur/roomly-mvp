"use client";

import { useActionState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { cancelMarketplaceBookingAction, lookupMarketplaceBookingAction, type BookingLookupState } from "@/app/actions/marketplace";

const initialState: BookingLookupState = undefined;

export function ManageBookingForm() {
  const [state, lookup, pending] = useActionState<BookingLookupState, FormData>(lookupMarketplaceBookingAction, initialState);
  return <div className="mx-auto max-w-2xl"><form action={lookup} className="panel grid gap-4 p-6 sm:grid-cols-2 sm:p-8"><label className="field"><span>Confirmation number</span><input name="confirmationCode" placeholder="RMLY-…" required /></label><label className="field"><span>Booking email</span><input name="email" type="email" placeholder="you@example.com" required /></label>{state?.error && <p className="market-error sm:col-span-2" role="alert">{state.error}</p>}<div className="sm:col-span-2"><button className="button button-primary w-full" disabled={pending}>{pending ? "Finding booking…" : "Find my booking"}</button></div></form>{state?.booking && <BookingResult booking={state.booking} />}</div>;
}

function BookingResult({ booking }: { booking: NonNullable<BookingLookupState>["booking"] & {} }) {
  const [cancelState, cancel, pending] = useActionState<BookingLookupState, FormData>(cancelMarketplaceBookingAction, { booking });
  const shown = cancelState?.booking || booking;
  const start = new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short", timeZone: shown.timezone }).format(new Date(shown.startsAt));
  const end = new Intl.DateTimeFormat("en", { timeStyle: "short", timeZone: shown.timezone }).format(new Date(shown.endsAt));
  return <section className="panel mt-6 overflow-hidden"><div className="flex items-start justify-between gap-4 border-b border-[#e2e6e3] p-6"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#66756d]">{shown.confirmationCode}</p><h2 className="mt-2 text-2xl font-semibold">{shown.workspace}</h2><p className="mt-1 text-sm text-[#647169]">Hosted by {shown.business}</p></div><span className={`badge booking-${shown.status.toLowerCase()}`}>{shown.status.replace("_", " ")}</span></div><div className="space-y-4 p-6"><p className="flex items-start gap-3 text-sm"><CalendarDays size={18} className="mt-0.5 text-[#47705d]" /><span><strong className="block">{start}</strong><span className="text-[#6b7770]">Ends {end} · {shown.timezone}</span></span></p><p className="flex items-center gap-3 text-sm"><MapPin size={18} className="text-[#47705d]" />{shown.location}</p><div className="flex items-center justify-between rounded-xl bg-[#f1f4f1] px-4 py-3 text-sm"><span>Payment status</span><strong>{shown.paymentStatus} · {new Intl.NumberFormat("en", { style: "currency", currency: shown.currency }).format(shown.quotedAmount)}</strong></div>{cancelState?.error && <p className="market-error" role="alert">{cancelState.error}</p>}{["PENDING", "CONFIRMED"].includes(shown.status) && <form action={cancel}><input type="hidden" name="bookingId" value={shown.id} /><input type="hidden" name="confirmationCode" value={shown.confirmationCode} /><input type="hidden" name="email" value={shown.email} /><button className="button button-danger" disabled={pending}>{pending ? "Cancelling…" : "Cancel booking"}</button></form>}</div></section>;
}
