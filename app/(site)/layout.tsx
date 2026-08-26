import siteFallback from "@/content/site.json"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getContent } from "@/lib/cms/content"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const site = await getContent("site", siteFallback)

  return (
    <>
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
    </>
  )
}
