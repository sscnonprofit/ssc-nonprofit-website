import type { Metadata } from "next"

import pillars from "@/content/pillars.json"
import { PillarPage } from "@/components/pillar-page"

export const metadata: Metadata = {
  title: pillars.employment.navLabel,
  description: pillars.employment.metaDescription,
}

export default function EmploymentPage() {
  return <PillarPage slug="employment" />
}
