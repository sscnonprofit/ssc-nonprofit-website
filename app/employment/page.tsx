import type { Metadata } from "next"

import pillarsFallback from "@/content/pillars.json"
import { PillarPage } from "@/components/pillar-page"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const pillars = await getContent("pillars", pillarsFallback)
  return { title: pillars.employment.navLabel, description: pillars.employment.metaDescription }
}

export default function EmploymentPage() {
  return <PillarPage slug="employment" />
}
