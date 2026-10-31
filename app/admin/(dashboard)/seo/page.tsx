import type { Metadata } from "next"

import { SearchConsoleOverview } from "@/components/admin/dashboard/search-console-overview"
import { SeoOverview } from "@/components/admin/dashboard/seo-overview"
import { buildSeoAudit } from "@/lib/admin/seo"
import { requirePermission } from "@/lib/cms/auth-helpers"
import { listPageRows } from "@/lib/cms/pages"

export const metadata: Metadata = {
  title: "SEO | SSC Content Manager",
  description: "Review website SEO health and Google Search Console performance.",
  robots: { index: false, follow: false },
}

export default async function AdminSeoPage() {
  await requirePermission("view_content")
  const rows = await listPageRows()

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-sm font-medium text-muted-foreground">Search visibility</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">SEO</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review content health and monitor live search performance for the SSC website.
        </p>
      </header>
      <SeoOverview audit={buildSeoAudit(rows)} />
      <SearchConsoleOverview />
    </div>
  )
}
