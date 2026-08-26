import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter, Bricolage_Grotesque } from "next/font/google"

import "./globals.css"
import site from "@/content/site.json"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

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

export const metadata: Metadata = {
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

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#7c1231",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${inter.variable} ${bricolage.variable}`}>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
