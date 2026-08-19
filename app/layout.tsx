import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://venuenest-waitlist-three.vercel.app"),
  title: "VenueNest — Join the Waitlist",
  description:
    "VenueNest is the software that runs your whole wedding venue. Join the waitlist and we'll let you in as spots open up.",
  openGraph: {
    title: "VenueNest — Join the Waitlist",
    description:
      "The software that runs your whole wedding venue. Join the waitlist and we'll let you in as spots open up.",
    url: "/",
    siteName: "VenueNest",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VenueNest — Join the Waitlist",
    description: "The software that runs your whole wedding venue. Join the waitlist.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
