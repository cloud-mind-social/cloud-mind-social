import type { Metadata } from "next";
import { Fraunces, Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import { PageLife } from "@/components/lineart/page-life";
import { ScrollMotion } from "@/components/lineart/scroll-motion";
import { ScrollRail } from "@/components/lineart/scroll-rail";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = "https://cloudmindsocial.com";
const title = "Cloud Mind Social — Diagnosis Before Prescription";
const description =
  "A specialist network for businesses that don't want to guess what they need. We diagnose the actual problem, match the right specialists to it, and scale the work as the business grows — nothing oversold, nothing undersold.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — Cloud Mind Social",
  },
  description,
  keywords: [
    "social media strategy",
    "content production",
    "brand strategy",
    "fractional marketing",
    "specialist network",
  ],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Cloud Mind Social",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink antialiased">
        <PageLife />
        <ScrollMotion />
        <ScrollRail />
        {children}
      </body>
    </html>
  );
}
