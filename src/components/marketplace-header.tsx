import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { Logo } from "@/app/page";

export function MarketplaceHeader() {
  return (
    <header className="border-b border-[#e1e5e1] bg-white/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link className="button button-ghost" href="/spaces"><Search size={16} /> Find a space</Link>
          <Link className="button button-ghost hidden sm:inline-flex" href="/bookings/manage">Manage booking</Link>
          <Link className="button button-secondary" href="/login"><Building2 size={16} /> List your space</Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketplaceFooter() {
  return (
    <footer className="mt-auto border-t border-[#dde3de] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-[#66736c] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Roomly. Book better workspaces.</p>
        <div className="flex gap-5"><Link href="/spaces">Explore spaces</Link><Link href="/bookings/manage">Manage booking</Link><Link href="/login">Provider login</Link></div>
      </div>
    </footer>
  );
}
