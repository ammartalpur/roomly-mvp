import { Logo } from "@/app/page";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen bg-[#f7f8f5] lg:grid-cols-[.85fr_1.15fr]"><section className="flex flex-col p-7 sm:p-10"><Logo /><div className="mx-auto flex w-full max-w-md flex-1 items-center py-14">{children}</div></section><aside className="relative hidden overflow-hidden bg-[#173f35] p-12 text-white lg:flex lg:flex-col lg:justify-end"><div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#c9f36b]/15" /><div className="absolute left-28 top-40 size-56 rounded-full border border-white/10" /><div className="relative max-w-xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#c9f36b]">Roomly Foundation</p><blockquote className="mt-5 text-4xl font-medium leading-tight tracking-[-0.04em]">One source of truth for every location, floor, room, desk, and team member.</blockquote></div></aside></main>;
}
