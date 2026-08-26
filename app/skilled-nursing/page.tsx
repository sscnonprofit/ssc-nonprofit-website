import type { Metadata } from "next"

import servicesFallback from "@/content/services.json"
import { ServicePage } from "@/components/service-page"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const services = await getContent("services", servicesFallback)
  return {
    title: services["skilled-nursing"].seo.title,
    description: services["skilled-nursing"].seo.description,
    alternates: { canonical: "/skilled-nursing" },
  }
}

export default function SkilledNursingPage() {
  return <ServicePage slug="skilled-nursing" />
}
