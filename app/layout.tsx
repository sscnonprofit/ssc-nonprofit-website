import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import siteFallback from "@/content/site.json"
import { getContent } from "@/lib/cms/content"
import { fontVariables } from "@/lib/cms/theme-fonts"
import { getTheme } from "@/lib/cms/theme-store"

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

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme()
  return {
    colorScheme: "light",
    themeColor: theme.meta.themeColor,
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${fontVariables}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
