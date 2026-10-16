import { ManageBookingForm } from "@/components/manage-booking-form";

export const metadata = { title: "Manage your booking — Roomly" };

export default function ManageBookingPage() {
  return <main className="flex-1 px-5 py-14 sm:px-8"><div className="mx-auto mb-7 max-w-2xl text-center"><p className="eyebrow">Your reservation</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.045em]">Manage your booking</h1><p className="mt-3 text-[#657169]">Enter the confirmation number and email used at checkout.</p></div><ManageBookingForm /></main>;
}
