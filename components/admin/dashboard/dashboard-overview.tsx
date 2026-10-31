import Link from "next/link"
import { ArrowUpRightIcon, CalendarDaysIcon, GalleryHorizontalIcon, HandshakeIcon, LayersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { FeatureOverview } from "@/lib/admin/overview"

export function DashboardOverview({ overview, partnerCount, pageCount, drafts }: {
  overview: FeatureOverview; partnerCount: number; pageCount: number; drafts: number
}) {
  const cards = [
    { title: "Site pages", value: pageCount, detail: `${drafts} content drafts`, href: "#page-directory", icon: LayersIcon },
    { title: "Upcoming events", value: overview.events.upcoming, detail: `${overview.events.drafts} drafts · ${overview.events.waitlisted} waitlisted`, href: "/admin/events", icon: CalendarDaysIcon },
    { title: "Gallery albums", value: overview.gallery.published, detail: `${overview.gallery.drafts} drafts`, href: "/admin/gallery", icon: GalleryHorizontalIcon },
    { title: "Community partners", value: partnerCount, detail: "Visible on Community Outreach", href: "/admin/partners", icon: HandshakeIcon },
  ]
  return <section aria-label="Website overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map(({ title, value, detail, href, icon: Icon }) => <Link key={title} href={href} className="group rounded-xl border border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2"><Icon className="size-5 text-primary" /><ArrowUpRightIcon className="size-4 text-muted-foreground" /></div>
        <div className="flex flex-col gap-1"><p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p><h2 className="text-sm font-medium">{title}</h2><p className="text-sm leading-6 text-muted-foreground">{detail}</p></div>
      </div>
    </Link>)}
  </section>
}

export function DashboardTask({ href, title, description, count }: { href: string; title: string; description: string; count: number }) {
  return <Link href={href} className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
    <div className="flex flex-col gap-1"><span className="text-sm font-medium">{title}</span><span className="text-sm text-muted-foreground">{description}</span></div>
    <Badge variant={count ? "secondary" : "outline"}>{count}</Badge>
  </Link>
}
