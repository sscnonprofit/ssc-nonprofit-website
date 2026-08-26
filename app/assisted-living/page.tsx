import type { Metadata } from "next"

import servicesFallback from "@/content/services.json"
import { ServicePage } from "@/components/service-page"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const services = await getContent("services", servicesFallback)
  return {
    title: services["assisted-living"].seo.title,
    description: services["assisted-living"].seo.description,
    alternates: { canonical: "/assisted-living" },
  }
}

export default function AssistedLivingPage() {
  return <ServicePage slug="assisted-living" />
}
