import Link from "next/link";
import { ArrowRight, Building2, Layers3, Users2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#15211c]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link className="button button-ghost" href="/login">Log in</Link>
          <Link className="button button-primary" href="/signup">Get started</Link>
        </div>
      </nav>
      <section className="mx-auto grid max-w-6xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <span className="eyebrow">Workspace operations, organized</span>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Set up every space your business manages.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#5d6963]">Roomly gives coworking teams one clear place for locations, floors, rooms, desks, amenities, and staff access.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="button button-primary button-lg" href="/signup">Create your workspace <ArrowRight size={17} /></Link>
            <Link className="button button-secondary button-lg" href="/login">I already have an account</Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-[#dfe5df] bg-white p-4 shadow-[0_30px_80px_rgba(37,58,48,.12)]">
          <div className="rounded-[1.5rem] bg-[#173f35] p-7 text-white">
            <p className="text-sm text-[#aed0c4]">WorkNest Coworking</p>
            <h2 className="mt-1 text-2xl font-semibold">Hyderabad Branch</h2>
            <div className="mt-8 space-y-3">
              {[[Building2, "Ground floor", "3 workspaces"], [Layers3, "First floor", "3 workspaces"], [Users2, "Team access", "Owner · Admin · Staff"]].map(([Icon, title, detail]) => {
                const ItemIcon = Icon as typeof Building2;
                return <div key={String(title)} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4"><ItemIcon size={20} /><div><p className="font-medium">{String(title)}</p><p className="text-sm text-[#aed0c4]">{String(detail)}</p></div></div>;
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2 text-xl font-semibold tracking-[-0.03em] ${light ? "text-white" : "text-[#163b32]"}`}><span className="grid size-8 place-items-center rounded-xl bg-[#c9f36b] text-sm text-[#173f35]">R</span>Roomly</Link>;
}
