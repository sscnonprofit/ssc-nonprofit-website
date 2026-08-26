import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter, Bricolage_Grotesque } from "next/font/google"

import "./globals.css"
import siteFallback from "@/content/site.json"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getContent } from "@/lib/cms/content"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const site = await getContent("site", siteFallback)
  return {
    metadataBase: new URL("https://sscnonprofit.org"),
    title: {
      default: `${site.name} – ${site.tagline}`,
      template: `%s – ${site.name}`,
    },
    description: site.description,
    keywords: [
      "Sheboygan Senior Community",
      "senior living Sheboygan",
      "assisted living Wisconsin",
      "skilled nursing Sheboygan",
      "short term rehab",
      "nonprofit senior care",
    ],
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${site.name} – ${site.tagline}`,
      description: site.description,
      locale: "en_US",
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#7c1231",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const site = await getContent("site", siteFallback)

  return (
    <html lang="en" className={`bg-background ${inter.variable} ${bricolage.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Static, non-user-controlled organization data for search engines.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["NursingHome", "NGO"],
              name: site.name,
              description: site.description,
              url: "https://sscnonprofit.org",
              telephone: site.phone,
              foundingDate: String(site.founded),
              address: {
                "@type": "PostalAddress",
                streetAddress: site.address.street,
                addressLocality: site.address.city,
                addressRegion: site.address.state,
                postalCode: site.address.zip,
                addressCountry: "US",
              },
              sameAs: site.social.map((s) => s.href),
            }),
          }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader site={site} />
        <main id="main">{children}</main>
        <SiteFooter site={site} />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
