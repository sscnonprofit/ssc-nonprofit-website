import type { Metadata } from "next"

import pillars from "@/content/pillars.json"
import { PillarPage } from "@/components/pillar-page"

export const metadata: Metadata = {
  title: pillars["community-outreach"].navLabel,
  description: pillars["community-outreach"].metaDescription,
}

export default function CommunityOutreachPage() {
  return <PillarPage slug="community-outreach" />
}
