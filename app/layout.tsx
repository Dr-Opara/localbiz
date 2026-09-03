import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://localbiz.lol"),
  title: {
    default: "LocalBiz — Sponsored Local Business Rankings",
    template: "%s | LocalBiz",
  },
  description:
    "LocalBiz is a transparent sponsored-ranking marketplace where local businesses compete for visibility in their city and category.",
  keywords: [
    "local business advertising",
    "sponsored local rankings",
    "local business promotion",
    "local business visibility",
    "small business advertising",
    "local marketing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://localbiz.lol",
    siteName: "LocalBiz",
    title: "LocalBiz — Sponsored Local Business Rankings",
    description:
      "Compete for sponsored visibility in your city and category with transparent paid rankings.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalBiz — Sponsored Local Business Rankings",
    description:
      "Compete for sponsored visibility in your city and category with transparent paid rankings.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LocalBiz",
  url: "https://localbiz.lol",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "A transparent sponsored-ranking marketplace for local businesses competing for visibility by city and category.",
  offers: {
    "@type": "Offer",
    category: "Sponsored local business placement",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
