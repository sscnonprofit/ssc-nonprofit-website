"use client"

import { useId, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRightIcon, CheckCircle2Icon, RefreshCwIcon, SearchIcon } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { SeoAudit } from "@/lib/admin/seo"

const checks = [
  { key: "title", label: "Page titles" },
  { key: "description", label: "Descriptions" },
  { key: "unique", label: "Unique titles" },
  { key: "visibility", label: "Visibility" },
] as const

const axisLabels: Record<string, string> = { "Page titles": "Titles", Descriptions: "Summaries", "Unique titles": "Unique", Visibility: "Visibility" }

const chartConfig = {
  passing: { label: "Passing", color: "var(--chart-1)" },
  review: { label: "Needs review", color: "var(--chart-2)" },
} satisfies ChartConfig

export function SeoOverview({ audit }: { audit: SeoAudit }) {
  const id = useId()
  const router = useRouter()
  const [scope, setScope] = useState("all")
  const [refreshing, startRefresh] = useTransition()
  const pages = audit.pages.filter((page) => scope === "all" || page.group === scope)
  const data = checks.map(({ key, label }) => {
    const passing = pages.filter((page) => page.checks[key]).length
    return { check: label, passing, review: pages.length - passing }
  })
  const passing = data.reduce((total, item) => total + item.passing, 0)
  const total = pages.length * checks.length
  const review = total - passing
  const attention = pages.filter((page) => page.issues.length).sort((a, b) => b.issues.length - a.issues.length || a.path.localeCompare(b.path))

  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <SearchIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle><h2 id={`${id}-title`}>SEO content health</h2></CardTitle>
                <Badge variant="outline">Published content</Badge>
              </div>
              <CardDescription>Live metadata coverage across your SEO-managed pages.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`${id}-scope`} className="sr-only">Filter SEO audit pages</label>
              <select id={`${id}-scope`} value={scope} onChange={(event) => setScope(event.target.value)} className="h-10 min-w-40 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                <option value="all">All managed pages</option>
                <option value="cms">CMS pages</option>
                <option value="builder">Builder pages</option>
              </select>
              <Button variant="outline" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
                <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
                {refreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-6">
          <dl className="grid grid-cols-2 gap-4 border-y border-border py-5 sm:grid-cols-4">
            <div className="flex flex-col gap-1"><dt className="text-sm text-muted-foreground">Pages audited</dt><dd className="text-3xl font-semibold tabular-nums tracking-tight">{pages.length}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-sm text-muted-foreground">Checks passing</dt><dd className="text-3xl font-semibold tabular-nums tracking-tight text-chart-1">{passing}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-sm text-muted-foreground">Checks to review</dt><dd className="text-3xl font-semibold tabular-nums tracking-tight text-chart-2">{review}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-sm text-muted-foreground">Content check coverage</dt><dd className="text-3xl font-semibold tabular-nums tracking-tight">{total ? `${Math.round(passing / total * 100)}%` : "—"}</dd></div>
          </dl>
          {pages.length ? (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <figure className="flex min-w-0 flex-col gap-4">
                <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Pages passing each content check</span>
                  <span className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-chart-1" aria-hidden="true" />Passing</span>
                    <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-chart-2" aria-hidden="true" />Needs review</span>
                  </span>
                </figcaption>
                <ChartContainer config={chartConfig} className="h-64 w-full min-w-0 aspect-auto" aria-label="SEO content checks: passing pages in green and pages needing review in red" aria-describedby={`${id}-method`}>
                  <LineChart accessibilityLayer data={data} margin={{ top: 12, right: 20, bottom: 8, left: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 5" />
                    <XAxis dataKey="check" tickLine={false} axisLine={false} tickMargin={12} tick={{ fontSize: 14 }} interval={0} padding={{ left: 24, right: 24 }} tickFormatter={(value: string) => axisLabels[value] ?? value} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} domain={[0, Math.max(pages.length, 1)]} width={30} tick={{ fontSize: 14 }} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Line type="linear" dataKey="passing" stroke="var(--color-passing)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-passing)", strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    <Line type="linear" dataKey="review" stroke="var(--color-review)" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: "var(--color-review)", strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                  </LineChart>
                </ChartContainer>
                <table className="sr-only">
                  <caption>Current SEO content checks, measured in pages</caption>
                  <thead><tr><th scope="col">Check</th><th scope="col">Passing</th><th scope="col">Needs review</th></tr></thead>
                  <tbody>{data.map((item) => <tr key={item.check}><th scope="row">{item.check}</th><td>{item.passing}</td><td>{item.review}</td></tr>)}</tbody>
                </table>
              </figure>
              <aside className="flex min-w-0 flex-col gap-4 border-t border-border pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6" aria-label="SEO pages to review">
                <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium">Next improvements</h3><Badge variant="secondary">{attention.length} {attention.length === 1 ? "page" : "pages"}</Badge></div>
                {attention.length ? (
                  <ul className="flex flex-col gap-1">
                    {attention.slice(0, 3).map((page) => (
                      <li key={page.path}>
                        <Link href={page.href} className="flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                          <span className="flex min-w-0 flex-col gap-1"><span className="truncate text-sm font-medium">{page.path}</span><span className="text-sm leading-6 text-muted-foreground">{page.issues[0]}{page.issues.length > 1 ? ` · +${page.issues.length - 1} more` : ""}</span></span>
                          <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-border p-4"><CheckCircle2Icon className="size-5 shrink-0 text-chart-1" aria-hidden="true" /><p className="text-sm leading-6 text-muted-foreground">All audited content checks pass. Keep reviewing metadata as you publish new pages.</p></div>
                )}
                <p className="text-sm leading-6 text-muted-foreground">Changes appear here after publishing. Unpublished drafts are not included.</p>
              </aside>
            </div>
          ) : <p className="py-8 text-center text-sm leading-6 text-muted-foreground">No published pages in this group yet. Publish a builder page to include it in the audit.</p>}
          {attention.length > 0 && (
            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">Review {attention.length} flagged {attention.length === 1 ? "page" : "pages"}</summary>
              <ul className="flex flex-col gap-3 border-t border-border p-4">{attention.map((page) => <li key={page.path} className="flex flex-col gap-1"><Link href={page.href} className="w-fit text-sm font-medium underline underline-offset-4">{page.path}</Link><p className="text-sm leading-6 text-muted-foreground">{page.issues.join(" · ")}</p></li>)}</ul>
            </details>
          )}
        </CardContent>
        <CardFooter>
          <div id={`${id}-method`} className="flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
            <p>Content audit, not search traffic or a Google SEO score. Checks cover title length (1–70 characters, before the site name), description length (1–170), unique titles, and noindex. Noindex may be intentional; passing does not confirm indexing.</p>
            <p>Scope: homepage, services, pillars, leadership, and published builder pages. Other static pages, event details, and job listings are outside this audit.{audit.excludedDrafts > 0 ? ` ${audit.excludedDrafts} unpublished builder page${audit.excludedDrafts === 1 ? " is" : "s are"} excluded.` : ""}</p>
          </div>
        </CardFooter>
      </Card>
    </section>
  )
}
