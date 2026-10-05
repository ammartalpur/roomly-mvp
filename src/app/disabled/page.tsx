import { CircleOff } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentMembership } from "@/lib/auth";

export default async function DisabledPage() {
  const { membership } = await getCurrentMembership();
  return <main className="grid min-h-screen place-items-center bg-[#f5f6f3] px-5"><section className="panel max-w-lg p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700"><CircleOff size={22} /></span><h1 className="mt-5 text-2xl font-semibold">Organization access is paused</h1><p className="mt-3 text-sm leading-6 text-[#6f7a74]">{membership?.organization.name ?? "This organization"} is currently disabled. Contact Roomly support to review the account.</p><form action={logoutAction}><button className="button button-secondary mt-6">Log out</button></form></section></main>;
}
