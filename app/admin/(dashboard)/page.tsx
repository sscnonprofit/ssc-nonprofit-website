import { ExternalLinkIcon, FileTextIcon, LayoutTemplateIcon, PencilIcon, SettingsIcon } from "lucide-react"
import Link from "next/link"

import { CreatePageDialog } from "@/components/admin/builder/create-page-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listBuilderPages } from "@/lib/builder/pages"
import { listPageRows } from "@/lib/cms/pages"
import { cmsRegistry } from "@/lib/cms/registry"

export default async function AdminPagesDashboard() {
  const [rows, builderPages] = await Promise.all([listPageRows(), listBuilderPages()])
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
        <div className="flex items-center gap-3">
          {draftCount > 0 && (
            <Badge variant="secondary" className="gap-1.5 py-1.5">
              {draftCount} unpublished draft{draftCount === 1 ? "" : "s"}
            </Badge>
          )}
          <CreatePageDialog />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <LayoutTemplateIcon className="size-3.5 text-muted-foreground" />
          Builder pages ({builderPages.length})
        </h2>
        {builderPages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <LayoutTemplateIcon className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No custom pages yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create a page and design it visually with drag-and-drop sections.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden py-0">
            <ul className="divide-y divide-border">
              {builderPages.map((page) => (
                <li key={page.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{page.title}</span>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      /{page.slug} · {page.sectionCount} section{page.sectionCount === 1 ? "" : "s"} · updated{" "}
                      {new Date(page.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  <Badge variant={page.status === "published" && !page.hasDraft ? "default" : "secondary"}>
                    {page.status !== "published" ? "Draft" : page.hasDraft ? "Unpublished changes" : "Live"}
                  </Badge>
                  <Button render={<Link href={`/admin/builder/${page.slug}`} />} nativeButton={false} size="sm">
                    <PencilIcon data-icon="inline-start" />
                    Open builder
                  </Button>
                  {page.status === "published" && (
                    <Button
                      render={<Link href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" />}
                      nativeButton={false}
                      size="sm"
                      variant="ghost"
                    >
                      <ExternalLinkIcon data-icon="inline-start" />
                      View
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

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
