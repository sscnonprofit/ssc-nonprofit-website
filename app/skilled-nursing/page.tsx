import type { Metadata } from "next"

import services from "@/content/services.json"
import { ServicePage } from "@/components/service-page"

export const metadata: Metadata = {
  title: services["skilled-nursing"].seo.title,
  description: services["skilled-nursing"].seo.description,
  alternates: { canonical: "/skilled-nursing" },
}

export default function SkilledNursingPage() {
  return <ServicePage slug="skilled-nursing" />
}
