import { desc } from "drizzle-orm"
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FrameIcon,
  GalleryHorizontalIcon,
  HistoryIcon,
  LayoutTemplateIcon,
  PencilIcon,
  SettingsIcon,
} from "lucide-react"
import Link from "next/link"

import { CreatePageDialog } from "@/components/admin/builder/create-page-dialog"
import { RebuildButton } from "@/components/admin/builder/rebuild-button"
import { db } from "@/lib/db"
import { pageRevisions } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getFeatureOverview } from "@/lib/admin/overview"
import { listBuilderPages } from "@/lib/builder/pages"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { listPageRows } from "@/lib/cms/pages"
import { cmsRegistry } from "@/lib/cms/registry"
import { hasPermission } from "@/lib/cms/roles"
import { cn } from "@/lib/utils"

export default async function AdminPagesDashboard() {
  const [rows, builderPages, recent, overview, user] = await Promise.all([
    listPageRows(),
    listBuilderPages(),
    db.select().from(pageRevisions).orderBy(desc(pageRevisions.createdAt)).limit(6),
    getFeatureOverview(),
    getSessionUser(),
  ])
  const canEdit = hasPermission(user?.role, "edit_content")
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const bySlug = new Map(rows.map((row) => [row.slug, row]))

  const pages = cmsRegistry.filter((doc) => doc.group === "page")
  const settings = cmsRegistry.filter((doc) => doc.group === "settings")
  const draftCount = rows.filter((row) => row.draftContent).length
  const lastPublished = recent.find((rev) => rev.note === "Published")

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card p-5 shadow-[0_12px_32px_-24px_rgba(122,31,43,0.55)] sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(135deg,transparent_0%,color-mix(in_oklab,var(--accent)_10%,transparent)_100%)] sm:block" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="size-2 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_16%,transparent)]" />
              SSC content workspace
            </div>
            <h1 className="text-balance font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
              Manage pages, events, galleries and exhibitions in one place. Everything you change stays a draft until
              it is published.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {draftCount > 0 && (
              <Badge variant="secondary" className="min-h-10 gap-1.5 rounded-xl px-3">
                {draftCount} unpublished draft{draftCount === 1 ? "" : "s"}
              </Badge>
            )}
            {canEdit && <CreatePageDialog />}
          </div>
        </div>
      </section>

      <section aria-labelledby="overview-heading" className="flex flex-col gap-3">
        <h2 id="overview-heading" className="text-sm font-semibold text-foreground">
          Overview
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <OverviewCard
            href="/admin/events"
            icon={CalendarDaysIcon}
            title="Events"
            primary={{ value: overview.events.upcoming, label: "upcoming" }}
            details={[
              { label: "Drafts", value: overview.events.drafts },
              { label: "On waitlists", value: overview.events.waitlisted },
            ]}
            attention={overview.events.waitlisted > 0 ? `${overview.events.waitlisted} waitlisted` : undefined}
          />
          <OverviewCard
            href="/admin/gallery"
            icon={GalleryHorizontalIcon}
            title="Gallery"
            primary={{ value: overview.gallery.published, label: "published albums" }}
            details={[{ label: "Draft albums", value: overview.gallery.drafts }]}
          />
          <OverviewCard
            href="/admin/exhibitions"
            icon={FrameIcon}
            title="Exhibitions"
            primary={{ value: overview.exhibitions.live, label: "live" }}
            details={[
              { label: "Drafts", value: overview.exhibitions.drafts },
              { label: "New submissions", value: overview.exhibitions.newSubmissions },
            ]}
            attention={
              overview.exhibitions.newSubmissions > 0 ? `${overview.exhibitions.newSubmissions} to review` : undefined
            }
          />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Pages" value={String(pages.length + builderPages.length)} tone="primary" />
        <Stat label="Drafts" value={String(draftCount)} />
        <Stat
          label="Last published"
          value={lastPublished ? new Date(lastPublished.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
        />
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
                canRebuild={canEdit}
              />
            )
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <HistoryIcon className="size-3.5 text-muted-foreground" />
            Recent activity
          </h2>
          <Card className="overflow-hidden py-0">
            <ul className="divide-y divide-border">
              {recent.map((rev) => (
                <li key={rev.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="min-w-0 truncate text-sm text-foreground">
                    <span className="font-medium">{rev.note || "Edited"}</span>
                    <span className="text-muted-foreground"> · {rev.title || rev.pageSlug}</span>
                  </span>
                  <time dateTime={new Date(rev.createdAt).toISOString()} className="shrink-0 text-xs text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  )
}

function OverviewCard({
  href,
  icon: Icon,
  title,
  primary,
  details,
  attention,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  primary: { value: number; label: string }
  details: { label: string; value: number }[]
  attention?: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </span>
        <ArrowUpRightIcon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{primary.value}</span>
        <span className="text-sm text-muted-foreground">{primary.label}</span>
      </p>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        {details.map((item) => (
          <div key={item.label} className="flex gap-1.5">
            <dt>{item.label}</dt>
            <dd className="font-medium tabular-nums text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      {attention && (
        <Badge variant="secondary" className="w-fit gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {attention}
        </Badge>
      )}
    </Link>
  )
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "primary" | "neutral" }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-3 shadow-[0_8px_20px_-18px_rgba(30,10,16,0.5)] sm:p-4", tone === "primary" ? "border-primary/20 bg-primary/[0.035]" : "border-border/80")}>
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{value}</span>
    </div>
  )
}

function PageCard({
  slug,
  label,
  description,
  routes,
  hasDraft,
  canRebuild = false,
}: {
  slug: string
  label: string
  description: string
  routes: string[]
  hasDraft: boolean
  canRebuild?: boolean
}) {
  return (
    <Card className="group overflow-hidden border-border/80 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <CardHeader className="gap-4 border-b border-border/70 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <FileTextIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{label}</CardTitle>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">/{slug}</p>
            </div>
          </div>
          <Badge variant={hasDraft ? "secondary" : "outline"} className="shrink-0 gap-1.5">
            <span className={hasDraft ? "size-1.5 rounded-full bg-amber-500" : "size-1.5 rounded-full bg-emerald-500"} />
            {hasDraft ? "Draft" : "Published"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        <p className="min-h-10 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Button render={<Link href={`/admin/pages/${slug}`} />} nativeButton={false} className="w-full justify-center sm:w-auto">
            <PencilIcon data-icon="inline-start" />
            Edit page content
          </Button>
          <div className="flex flex-wrap gap-2">
            {canRebuild && <RebuildButton slug={slug} label={label} />}
            {routes.map((route) => (
              <Button
                key={route}
                render={<Link href={route} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                size="sm"
                variant="outline"
                className="min-h-10 flex-1 sm:flex-none"
              >
                <ExternalLinkIcon data-icon="inline-start" />
                {routes.length > 1 ? route : "View live page"}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
