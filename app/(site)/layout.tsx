import Link from "next/link"
import { draftMode } from "next/headers"

import siteFallback from "@/content/site.json"
import { SiteThemePreviewBridge } from "@/components/site-theme-preview-bridge"
import { getContent } from "@/lib/cms/content"
import { themeToCss } from "@/lib/cms/theme"
import { getTheme } from "@/lib/cms/theme-store"

/** Keeps admin-authored CSS from closing the <style> element. */
function escapeStyle(css: string) {
  return css.replace(/</g, "\\3c ")
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { isEnabled: isDraft } = await draftMode()
  const [site, theme] = await Promise.all([getContent("site", siteFallback), getTheme({ draft: isDraft })])

  return (
    <>
      <style
        id="ssc-theme"
        // Generated from sanitized theme values; custom CSS is validated on save.
        dangerouslySetInnerHTML={{ __html: escapeStyle(themeToCss(theme) + theme.customCss) }}
      />
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
      {isDraft && (
        <div className="flex items-center justify-center gap-4 bg-foreground px-4 py-2 text-sm text-background">
          <span className="font-medium">Draft preview — you are seeing unpublished changes.</span>
          <Link href="/api/admin/preview?exit=1" className="underline underline-offset-4" prefetch={false}>
            Exit preview
          </Link>
        </div>
      )}
      <SiteThemePreviewBridge site={site} theme={theme}>
        <main id="main" className="ssc-public">{children}</main>
      </SiteThemePreviewBridge>
    </>
  )
}
