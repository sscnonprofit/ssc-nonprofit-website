import type { Metadata } from "next"
import { count, desc, eq } from "drizzle-orm"
import { ArrowRightIcon, BriefcaseIcon, CalendarDaysIcon, ExternalLinkIcon, FrameIcon, HandshakeIcon, ImagesIcon, MenuIcon } from "lucide-react"
import Link from "next/link"
import pillarsFallback from "@/content/pillars.json"
import { CreatePageDialog } from "@/components/admin/builder/create-page-dialog"
import { DashboardOverview, DashboardTask } from "@/components/admin/dashboard/dashboard-overview"
import { PageDirectory, type DirectoryEntry } from "@/components/admin/dashboard/page-directory"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFeatureOverview } from "@/lib/admin/overview"
import { listBuilderPages } from "@/lib/builder/pages"
import { requirePermission } from "@/lib/cms/auth-helpers"
import { listPageRows } from "@/lib/cms/pages"
import { getPartnerSection, partnerSectionsEqual } from "@/lib/cms/partners"
import { cmsRegistry } from "@/lib/cms/registry"
import { hasPermission } from "@/lib/cms/roles"
import { db } from "@/lib/db"
import { contactMessages, pageRevisions } from "@/lib/db/schema"

export const metadata: Metadata = { title: "Dashboard | SSC Content Manager", description: "Manage SSC website content, monitor SEO content health, and review pending work.", robots: { index: false, follow: false } }

export default async function AdminPagesDashboard() {
  const user = await requirePermission("view_content")
  const [rows, builderPages, recent, overview, messages] = await Promise.all([
    listPageRows(),
    listBuilderPages(),
    db.select({ id: pageRevisions.id, pageSlug: pageRevisions.pageSlug, title: pageRevisions.title, note: pageRevisions.note, createdAt: pageRevisions.createdAt }).from(pageRevisions).orderBy(desc(pageRevisions.createdAt)).limit(5),
    getFeatureOverview(),
    db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, "new")),
  ])
  const canEdit = hasPermission(user.role, "edit_content")
  const firstName = user.name.trim().split(/\s+/)[0]
  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  const pillarRow = bySlug.get("pillars")
  const partnerLive = getPartnerSection(pillarRow?.content ?? pillarsFallback)
  const partnerDraft = getPartnerSection(pillarRow?.draftContent ?? pillarRow?.content ?? pillarsFallback)
  const hasPartnerDraft = !partnerSectionsEqual(partnerDraft, partnerLive)
  const drafts = rows.filter((row) => row.draftContent || row.status === "draft")
  const pageCount = cmsRegistry.filter((doc) => doc.group === "page").length + builderPages.length
  const newMessages = Number(messages[0]?.value ?? 0)
  const reviewCount = newMessages + overview.jobs.newApplications + overview.exhibitions.newSubmissions
  const entries: DirectoryEntry[] = [
    ...builderPages.map((page) => ({
      key: `builder-${page.slug}`, slug: page.slug, title: page.title,
      description: `${page.sectionCount} visual builder section${page.sectionCount === 1 ? "" : "s"} · /${page.slug}`,
      href: `/admin/builder/${page.slug}`, routes: [`/${page.slug}`], kind: "builder" as const,
      hasDraft: page.hasDraft || page.status !== "published", live: page.status === "published", updatedAt: page.updatedAt,
    })),
    ...cmsRegistry.map((doc) => {
      const row = bySlug.get(doc.slug)
      return { key: `cms-${doc.slug}`, slug: doc.slug, title: doc.label, description: doc.description, href: `/admin/pages/${doc.slug}`, routes: doc.routes, kind: doc.group, hasDraft: Boolean(row?.draftContent) || row?.status === "draft", live: true, updatedAt: row?.updatedAt.toISOString() ?? null }
    }),
  ]
  const shortcuts = [
    { label: "Manage partners", href: "/admin/partners", icon: HandshakeIcon },
    { label: "Events", href: "/admin/events", icon: CalendarDaysIcon },
    { label: "Calendar builder", href: "/admin/calendars", icon: CalendarDaysIcon },
    ...(canEdit ? [{ label: "Media library", href: "/admin/media", icon: ImagesIcon }, { label: "Navigation", href: "/admin/navigation", icon: MenuIcon }] : []),
  ]
  const activityHref = (slug: string, note: string | null) => note?.toLowerCase().includes("partner") ? "/admin/partners" : builderPages.some((p) => p.slug === slug) ? `/admin/builder/${slug}` : slug === "theme" ? "/admin/design" : `/admin/pages/${slug}`

  return <div className="flex flex-col gap-6 sm:gap-8">
    <header className="flex flex-col gap-5 border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">SSC content workspace</p>
        <Link href="/" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLinkIcon data-icon="inline-start" />View website</Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight">{firstName ? `Welcome back, ${firstName}.` : "Your content dashboard"}</h1>
          <p className="max-w-xl text-pretty text-sm leading-6 text-muted-foreground">A clear view of your website and the work ahead. Keep your community informed, connected, and up to date.</p>
        </div>
        {canEdit && <CreatePageDialog />}
      </div>
      <nav aria-label="Quick actions" className="flex flex-wrap items-center gap-2">
        {shortcuts.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={buttonVariants({ variant: "outline", className: "min-h-11 gap-2" })}>
            <Icon data-icon="inline-start" />
            {label}
          </Link>
        ))}
      </nav>
    </header>

    <DashboardOverview overview={overview} partnerCount={partnerLive.enabled ? partnerLive.partners.filter((p) => p.visible).length : 0} pageCount={pageCount} drafts={drafts.length} />

    <section aria-label="Priority work" className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Needs your attention</CardTitle><CardDescription>{reviewCount ? `${reviewCount} new item${reviewCount === 1 ? "" : "s"} to review.` : "No new messages, applications, or artwork submissions."}</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-1">
          <DashboardTask href="/admin/messages" title="Messages" description="New inquiries from your community" count={newMessages} />
          <DashboardTask href="/admin/applications" title="Applications" description="Candidates awaiting a first review" count={overview.jobs.newApplications} />
          <DashboardTask href="/admin/exhibitions" title="Artwork submissions" description="New work submitted by local artists" count={overview.exhibitions.newSubmissions} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Continue your work</CardTitle><CardDescription>{drafts.length ? `${drafts.length} content document${drafts.length === 1 ? " has" : "s have"} unpublished changes.` : "Your content drafts are all caught up."}</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/admin/partners" className="rounded-lg border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-semibold"><HandshakeIcon className="size-5 text-primary" />Community partners</span><ArrowRightIcon className="size-4" /></div>
              <p className="text-sm leading-6 text-muted-foreground">Keep partner logos, links, and visibility up to date.</p>
              <Badge variant={hasPartnerDraft ? "secondary" : "outline"} className="w-fit">{hasPartnerDraft ? "Partner draft ready for review" : `${partnerDraft.partners.length} organizations in your directory`}</Badge>
            </div>
          </Link>
          <div className="flex flex-col gap-1">{drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 3).map((row) => <Link key={row.slug} href={activityHref(row.slug, null)} className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-muted"><span className="truncate">{row.title}</span><span className="flex shrink-0 items-center gap-2 text-muted-foreground">Continue draft<ArrowRightIcon className="size-4" /></span></Link>)}</div>
        </CardContent>
      </Card>
    </section>

    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/admin/jobs" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors hover:border-primary/50"><BriefcaseIcon className="size-5 text-primary" /><div className="flex flex-1 flex-col gap-1"><h2 className="text-sm font-semibold">Employment</h2><p className="text-sm text-muted-foreground">{overview.jobs.open} open positions · {overview.jobs.drafts} drafts</p></div><ArrowRightIcon className="size-4 text-muted-foreground" /></Link>
      <Link href="/admin/exhibitions" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors hover:border-primary/50"><FrameIcon className="size-5 text-primary" /><div className="flex flex-1 flex-col gap-1"><h2 className="text-sm font-semibold">Exhibitions</h2><p className="text-sm text-muted-foreground">{overview.exhibitions.live} live exhibitions · {overview.exhibitions.drafts} drafts</p></div><ArrowRightIcon className="size-4 text-muted-foreground" /></Link>
    </div>

    <PageDirectory entries={entries} canEdit={canEdit} />

    <Card>
      <CardHeader><CardTitle>Recent content activity</CardTitle><CardDescription>Latest saved revisions across your pages and site settings.</CardDescription></CardHeader>
      <CardContent>
        {recent.length ? <ul className="divide-y divide-border">{recent.map((revision) => <li key={revision.id} className="py-3 first:pt-0 last:pb-0"><Link href={activityHref(revision.pageSlug, revision.note)} className="flex flex-wrap items-center justify-between gap-2 text-sm underline-offset-4 hover:underline"><span><span className="font-medium">{revision.title || revision.pageSlug}</span><span className="text-muted-foreground"> · {revision.note || "Edited"}</span></span><time dateTime={revision.createdAt.toISOString()} className="text-muted-foreground">{revision.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })} CT</time></Link></li>)}</ul> : <p className="text-sm text-muted-foreground">Activity will appear here when your team saves content.</p>}
      </CardContent>
    </Card>
  </div>
}
