import "server-only"

import { getToken, startAuthorization, UserAuthorizationRequiredError } from "@vercel/connect"
import { headers } from "next/headers"

import { requirePermission } from "@/lib/cms/auth-helpers"

const CONNECTOR_UID = "scl_zFiu88hb6suESUwkBzOQTw"
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ?? "https://sscnonprofit.org/"

type SearchAnalyticsRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }

export type SearchConsoleOverview = {
  siteUrl: string
  startDate: string
  endDate: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  rows: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>
}

async function getOrigin() {
  if (process.env.NODE_ENV !== "production" && process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const requestHeaders = await headers()
  return `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")}`
}

async function getGoogleToken(userId: string) {
  return getToken(CONNECTOR_UID, { subject: { type: "user", id: userId }, scopes: [SEARCH_CONSOLE_SCOPE] })
}

export async function startSearchConsoleAuthorization(userId: string) {
  await requirePermission("view_content")
  const response = await startAuthorization(
    CONNECTOR_UID,
    { subject: { type: "user", id: userId }, scopes: [SEARCH_CONSOLE_SCOPE] },
    { callbackUrl: `${await getOrigin()}/admin/seo` },
  )
  return { url: response.url }
}

export async function getSearchConsoleOverview(): Promise<SearchConsoleOverview | { needsAuthorization: true; authorizationUrl: string }> {
  const user = await requirePermission("view_content")
  let token: string
  try {
    token = await getGoogleToken(user.id)
  } catch (error) {
    if (!(error instanceof UserAuthorizationRequiredError)) throw error
    const authorization = await startSearchConsoleAuthorization(user.id)
    return { needsAuthorization: true, authorizationUrl: authorization.url }
  }

  const end = new Date()
  end.setDate(end.getDate() - 2)
  const start = new Date(end)
  start.setDate(start.getDate() - 27)
  const formatDate = (date: Date) => date.toISOString().slice(0, 10)
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions: ["date"], rowLimit: 1000 }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Google Search Console returned ${response.status}`)
  const payload = await response.json() as { rows?: SearchAnalyticsRow[] }
  const rows = (payload.rows ?? []).map((row) => ({ date: row.keys?.[0] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 }))
  const totals = rows.reduce((result, row) => ({ clicks: result.clicks + row.clicks, impressions: result.impressions + row.impressions }), { clicks: 0, impressions: 0 })
  return { siteUrl: SITE_URL, startDate, endDate, ...totals, ctr: totals.impressions ? totals.clicks / totals.impressions : 0, position: rows.length ? rows.reduce((sum, row) => sum + row.position, 0) / rows.length : 0, rows }
}
