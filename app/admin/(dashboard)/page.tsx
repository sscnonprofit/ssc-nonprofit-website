import { ExternalLink, FileText, Pencil } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listPageRows } from "@/lib/cms/pages"
import { cmsRegistry } from "@/lib/cms/registry"

export default async function AdminPagesDashboard() {
  const rows = await listPageRows()
  const bySlug = new Map(rows.map((row) => [row.slug, row]))

  const pages = cmsRegistry.filter((doc) => doc.group === "page")
  const settings = cmsRegistry.filter((doc) => doc.group === "settings")

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Pages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit site content, save drafts, and publish changes. Publishing requires an admin.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Site-wide</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {settings.map((doc) => {
            const row = bySlug.get(doc.slug)
            return <PageCard key={doc.slug} slug={doc.slug} label={doc.label} description={doc.description} routes={doc.routes} hasDraft={Boolean(row?.draftContent)} />
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pages ({pages.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((doc) => {
            const row = bySlug.get(doc.slug)
            return <PageCard key={doc.slug} slug={doc.slug} label={doc.label} description={doc.description} routes={doc.routes} hasDraft={Boolean(row?.draftContent)} />
          })}
        </div>
      </section>
    </div>
  )
}

function PageCard({
  slug,
  label,
  description,
  routes,
  hasDraft,
}: {
  slug: string
  label: string
  description: string
  routes: string[]
  hasDraft: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText data-icon="inline-start" className="text-muted-foreground" />
            {label}
          </CardTitle>
          {hasDraft && <Badge variant="secondary">Unpublished draft</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/pages/${slug}`}>
              <Pencil data-icon="inline-start" />
              Edit
            </Link>
          </Button>
          {routes.map((route) => (
            <Button key={route} asChild size="sm" variant="ghost">
              <Link href={route} target="_blank" rel="noopener noreferrer">
                <ExternalLink data-icon="inline-start" />
                {routes.length > 1 ? route : "View live"}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
