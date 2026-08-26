import type { Metadata } from "next"

import servicesFallback from "@/content/services.json"
import { ServicePage } from "@/components/service-page"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const services = await getContent("services", servicesFallback)
  return {
    title: services["short-term-rehab"].seo.title,
    description: services["short-term-rehab"].seo.description,
    alternates: { canonical: "/short-term-rehab" },
  }
}

export default function ShortTermRehabPage() {
  return <ServicePage slug="short-term-rehab" />
}
