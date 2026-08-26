import type { Metadata } from "next"

import pillars from "@/content/pillars.json"
import { PillarPage } from "@/components/pillar-page"

export const metadata: Metadata = {
  title: pillars.community.navLabel,
  description: pillars.community.metaDescription,
}

export default function CommunityPage() {
  return <PillarPage slug="community" />
}
