import type { Metadata } from "next"

import services from "@/content/services.json"
import { ServicePage } from "@/components/service-page"

export const metadata: Metadata = {
  title: services["assisted-living"].seo.title,
  description: services["assisted-living"].seo.description,
  alternates: { canonical: "/assisted-living" },
}

export default function AssistedLivingPage() {
  return <ServicePage slug="assisted-living" />
}
