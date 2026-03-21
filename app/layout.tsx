import type { Metadata } from "next";
import Script from "next/script";
import { Anton, Montserrat } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const siteDescription =
  "Shop premium streetwear t-shirts at tshirts4U. Bold graphic tees, oversized fits, heavyweight cotton basics, and luxury fabrics. Free shipping on orders over $75.";

const ogDescription =
  "Premium streetwear t-shirts — graphic tees, oversized fits, and heavyweight cotton basics. Shop the collection at tshirts4U.";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default:
      "tshirts4U — Premium Streetwear T-Shirts | Graphic Tees & Basics",
    template: "%s | tshirts4U — Streetwear T-Shirts",
  },
  description: siteDescription,
  keywords: [
    "t-shirts",
    "streetwear t-shirts",
    "graphic tees",
    "oversized t-shirts",
    "premium cotton t-shirts",
    "men's t-shirts",
    "women's t-shirts",
    "heavyweight tees",
    "streetwear brand",
    "buy t-shirts online",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "tshirts4U",
    title: "tshirts4U — Premium Streetwear T-Shirts",
    description: ogDescription,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "tshirts4U — Premium Streetwear T-Shirts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tshirts4U — Premium Streetwear T-Shirts",
    description: ogDescription,
    images: [`${siteUrl}/og-image.png`],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "tshirts4U",
      url: siteUrl,
      description: siteDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "tshirts4U",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: "English",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}

        <ThemeProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
