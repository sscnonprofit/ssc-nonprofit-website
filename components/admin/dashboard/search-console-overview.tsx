"use client"

import { useState } from "react"
import { BarChart3Icon, ExternalLinkIcon, RefreshCwIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Data = { siteUrl: string; startDate: string; endDate: string; clicks: number; impressions: number; ctr: number; position: number; rows: Array<{ date: string; clicks: number; impressions: number }> }

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export function SearchConsoleOverview() {
  const [data, setData] = useState<Data | null>(null)
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const response = await fetch("/api/admin/search-console", { cache: "no-store" })
      const result = await response.json()
      if (result.needsAuthorization) setAuthorizationUrl(result.authorizationUrl)
      else if (!response.ok) throw new Error(result.error ?? "Unable to load Google data")
      else setData(result)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load Google data") } finally { setLoading(false) }
  }

  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><BarChart3Icon className="size-5 text-primary" aria-hidden="true" />Google Search Console</CardTitle><CardDescription>Live organic search performance for the last 28 complete days.</CardDescription></div><Button variant="outline" onClick={load} disabled={loading}>{loading ? "Loading…" : <><RefreshCwIcon data-icon="inline-start" />Refresh data</>}</Button></div>
    </CardHeader>
    <CardContent>
      {authorizationUrl ? <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4"><p className="text-sm leading-6 text-muted-foreground">Connect Google Search Console to view live clicks, impressions, CTR, and average position for the SSC property.</p><a className={buttonVariants()} href={authorizationUrl} target="_blank" rel="noreferrer">Connect Google <ExternalLinkIcon data-icon="inline-end" /></a></div> : data ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><div><p className="text-sm text-muted-foreground">Clicks</p><p className="text-2xl font-semibold tabular-nums">{number.format(data.clicks)}</p></div><div><p className="text-sm text-muted-foreground">Impressions</p><p className="text-2xl font-semibold tabular-nums">{number.format(data.impressions)}</p></div><div><p className="text-sm text-muted-foreground">CTR</p><p className="text-2xl font-semibold tabular-nums">{(data.ctr * 100).toFixed(1)}%</p></div><div><p className="text-sm text-muted-foreground">Avg. position</p><p className="text-2xl font-semibold tabular-nums">{data.position.toFixed(1)}</p></div></div> : <div className="flex flex-col gap-2"><p className="text-sm text-muted-foreground">Connect Google to load live search performance data.</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button variant="secondary" onClick={load} disabled={loading}>Load live data</Button></div>}
    </CardContent>
  </Card>
}
