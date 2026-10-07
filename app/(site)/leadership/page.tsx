import type { Metadata } from "next"
import { LeadershipPageContent } from "@/components/leadership-page-content"
import { getLeadershipContent } from "@/lib/cms/leadership-content"

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getLeadershipContent()
  return {
    title: seo.title, description: seo.description,
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title: seo.title, description: seo.description, images: seo.image ? [seo.image] : undefined },
  }
}

export default async function LeadershipPage() {
  return <LeadershipPageContent content={await getLeadershipContent()} />
}
