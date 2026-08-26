import { ExternalLinkIcon, FileTextIcon, PencilIcon, SettingsIcon } from "lucide-react"
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
  const draftCount = rows.filter((row) => row.draftContent).length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit site content, save drafts, and publish changes. Publishing requires an admin.
          </p>
        </div>
        {draftCount > 0 && (
          <Badge variant="secondary" className="gap-1.5 py-1.5">
            {draftCount} unpublished draft{draftCount === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <SettingsIcon className="size-3.5 text-muted-foreground" />
          Site-wide
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {settings.map((doc) => {
            const row = bySlug.get(doc.slug)
            return (
              <PageCard
                key={doc.slug}
                slug={doc.slug}
                label={doc.label}
                description={doc.description}
                routes={doc.routes}
                hasDraft={Boolean(row?.draftContent)}
              />
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <FileTextIcon className="size-3.5 text-muted-foreground" />
          Pages ({pages.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((doc) => {
            const row = bySlug.get(doc.slug)
            return (
              <PageCard
                key={doc.slug}
                slug={doc.slug}
                label={doc.label}
                description={doc.description}
                routes={doc.routes}
                hasDraft={Boolean(row?.draftContent)}
              />
            )
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
    <Card className="group transition-colors hover:border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileTextIcon className="size-4" />
            </span>
            {label}
          </CardTitle>
          {hasDraft && (
            <Badge variant="secondary" className="shrink-0">
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button render={<Link href={`/admin/pages/${slug}`} />} nativeButton={false} size="sm">
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          {routes.map((route) => (
            <Button
              key={route}
              render={<Link href={route} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              size="sm"
              variant="ghost"
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {routes.length > 1 ? route : "View live"}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
