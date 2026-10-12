import type { Metadata } from "next"

import servicesFallback from "@/content/services.json"
import { ServicePage } from "@/components/service-page"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const services = await getContent("services", servicesFallback)
  return {
    title: services["end-of-life"].seo.title,
    description: services["end-of-life"].seo.description,
    alternates: { canonical: "/end-of-life" },
  }
}

export default function EndOfLifePage() {
  return <ServicePage slug="end-of-life" />
}

// End-of-life care is presented as a service page so it shares the same
// accessible contact, FAQ, and content management patterns as other care pages.

export const dynamic = "force-dynamic"
