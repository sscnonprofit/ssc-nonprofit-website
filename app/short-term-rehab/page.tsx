import type { Metadata } from "next"

import services from "@/content/services.json"
import { ServicePage } from "@/components/service-page"

export const metadata: Metadata = {
  title: services["short-term-rehab"].seo.title,
  description: services["short-term-rehab"].seo.description,
  alternates: { canonical: "/short-term-rehab" },
}

export default function ShortTermRehabPage() {
  return <ServicePage slug="short-term-rehab" />
}
