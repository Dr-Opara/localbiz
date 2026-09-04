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
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/localbiz-logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/localbiz-logo.png",
    apple: "/localbiz-logo.png",
  },
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
    images: [
      {
        url: "/localbiz-logo.png",
        width: 512,
        height: 512,
        alt: "LocalBiz logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "LocalBiz — Sponsored Local Business Rankings",
    description:
      "Compete for sponsored visibility in your city and category with transparent paid rankings.",
    images: ["/localbiz-logo.png"],
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
  image: "https://localbiz.lol/localbiz-logo.png",
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
      <head>
        <style>{`
          .brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }
          .brand::before {
            content: "LB";
            display: inline-grid;
            place-items: center;
            width: 34px;
            height: 34px;
            border-radius: 9px;
            background: #cf674f;
            color: #fffdf9;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: -0.04em;
            line-height: 1;
            flex: 0 0 auto;
          }
          @media (max-width: 600px) {
            .brand::before {
              width: 30px;
              height: 30px;
              border-radius: 8px;
              font-size: 10px;
            }
          }
        `}</style>
      </head>
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
