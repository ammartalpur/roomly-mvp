import { MarketplaceFooter, MarketplaceHeader } from "@/components/marketplace-header";

export default function MarketplaceLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-screen flex-col bg-[#f6f7f4]"><MarketplaceHeader />{children}<MarketplaceFooter /></div>;
}
