import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter, Bricolage_Grotesque } from "next/font/google"

import "./globals.css"
import siteFallback from "@/content/site.json"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${inter.variable} ${bricolage.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
