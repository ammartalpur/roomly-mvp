import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomly — Find and book workspaces",
  description: "Discover and book meeting rooms, private offices, and desks with live availability.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
