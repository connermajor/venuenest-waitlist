import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Great_Vibes } from "next/font/google";
import "./globals.css";

// A wedding-invitation script, used for small flourishes like the live
// "N in line" count. Self-hosted by next/font at build time (no runtime fetch).
const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${greatVibes.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
