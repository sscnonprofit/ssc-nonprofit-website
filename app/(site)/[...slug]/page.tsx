import type { Metadata } from "next"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"

import { getBuilderPage } from "@/lib/builder/pages"
import { RenderSections } from "@/lib/builder/render-page"

type Params = { params: Promise<{ slug: string[] }> }

async function load(params: Params["params"]) {
  const { slug } = await params
  if (slug.length !== 1) return null
  const { isEnabled } = await draftMode()
  return getBuilderPage(slug[0], { draft: isEnabled })
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = await load(params)
  if (!doc) return {}
  const title = doc.seo.title || doc.title
  return {
    title,
    description: doc.seo.description || undefined,
    robots: doc.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: doc.seo.description || undefined,
      images: doc.seo.image ? [doc.seo.image] : undefined,
    },
  }
}

export default async function BuilderPage({ params }: Params) {
  const doc = await load(params)
  if (!doc) notFound()
  return <RenderSections sections={doc.sections} />
}
