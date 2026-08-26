import type { Metadata } from "next"

import pillars from "@/content/pillars.json"
import { PillarPage } from "@/components/pillar-page"

export const metadata: Metadata = {
  title: pillars.environment.navLabel,
  description: pillars.environment.metaDescription,
}

export default function EnvironmentPage() {
  return <PillarPage slug="environment" />
}
