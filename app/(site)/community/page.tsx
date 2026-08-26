import type { Metadata } from "next"

import pillarsFallback from "@/content/pillars.json"
import { PillarPage } from "@/components/pillar-page"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const pillars = await getContent("pillars", pillarsFallback)
  return { title: pillars.community.navLabel, description: pillars.community.metaDescription }
}

export default function CommunityPage() {
  return <PillarPage slug="community" />
}
