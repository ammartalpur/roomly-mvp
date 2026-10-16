import Link from "next/link";
import { Building2, CalendarCheck2, MapPin, Search, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#15211c]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link className="button button-ghost" href="/login">Log in</Link>
          <Link className="button button-primary" href="/signup">List your space</Link>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <span className="eyebrow">Rooms for the way you work</span>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Your next great meeting starts here.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#5d6963]">Discover meeting rooms, private offices, and desks. See real availability and book in minutes.</p>
          <form className="market-home-search mt-9" action="/spaces"><label><MapPin size={17} /><input name="city" placeholder="Where do you need a room?" aria-label="City or area" /></label><button className="button button-primary button-lg"><Search size={17} /> Search spaces</button></form>
          <div className="mt-6 flex flex-wrap gap-5 text-sm text-[#5e6d65]"><span className="flex items-center gap-2"><ShieldCheck size={16} /> Live availability</span><span className="flex items-center gap-2"><CalendarCheck2 size={16} /> Easy booking management</span></div>
        </div>
        <div className="rounded-[2rem] border border-[#dfe5df] bg-white p-4 shadow-[0_30px_80px_rgba(37,58,48,.12)]">
          <div className="rounded-[1.5rem] bg-[#173f35] p-7 text-white">
            <p className="text-sm text-[#aed0c4]">Available tomorrow</p>
            <h2 className="mt-1 text-2xl font-semibold">Find the right room</h2>
            <div className="mt-8 space-y-3">
              {[[Building2, "Meeting rooms", "Private, equipped, ready"], [CalendarCheck2, "Real-time slots", "No back-and-forth"], [ShieldCheck, "Trusted booking", "Manage it online"]].map(([Icon, title, detail]) => {
                const ItemIcon = Icon as typeof Building2;
                return <div key={String(title)} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4"><ItemIcon size={20} /><div><p className="font-medium">{String(title)}</p><p className="text-sm text-[#aed0c4]">{String(detail)}</p></div></div>;
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-[#dde4de] bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-3"><div><strong className="text-lg">Search</strong><p className="mt-1 text-sm text-[#68756e]">Choose a city, date, duration, and group size.</p></div><div><strong className="text-lg">Book</strong><p className="mt-1 text-sm text-[#68756e]">Pick a live time slot and reserve as a guest.</p></div><div><strong className="text-lg">Meet</strong><p className="mt-1 text-sm text-[#68756e]">Bring your confirmation number and get to work.</p></div></div></section>
    </main>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] ${light ? "text-white" : "text-[#163b32]"}`}><span className="grid size-8 place-items-center rounded-xl bg-[#c9f36b] text-sm text-[#173f35]">R</span>Roomly</Link>;
}
