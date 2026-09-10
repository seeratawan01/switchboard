import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const DESCRIPTION =
  "What do you want for yourself? Flip on everything. Some of it can't be true at the same time, and the board shows you why, with the psychology behind it.";

/** Absolute URLs for og:image and friends. Vercel sets the production URL at build; set NEXT_PUBLIC_SITE_URL elsewhere. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Switchboard", template: "%s · Switchboard" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Switchboard",
    title: "What do you want for yourself?",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "What do you want for yourself?",
    description: DESCRIPTION,
    creator: "@seeratawan01",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
