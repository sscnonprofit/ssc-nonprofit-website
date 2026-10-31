"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLinkIcon, FileTextIcon, LayoutTemplateIcon, SearchIcon, SettingsIcon } from "lucide-react"
import { RebuildButton } from "@/components/admin/builder/rebuild-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export type DirectoryEntry = {
  key: string; slug: string; title: string; description: string; href: string; routes: string[]
  kind: "page" | "settings" | "builder"; hasDraft: boolean; live: boolean; updatedAt: string | null
}

export function PageDirectory({ entries, canEdit }: { entries: DirectoryEntry[]; canEdit: boolean }) {
  const [query, setQuery] = useState("")
  const [draftsOnly, setDraftsOnly] = useState(false)
  const filtered = entries.filter((entry) => (!draftsOnly || entry.hasDraft) && `${entry.title} ${entry.description} ${entry.routes.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
  return <Card id="page-directory">
    <CardHeader><CardTitle>Pages & site content</CardTitle><CardDescription>Find a page, continue a draft, or open the visual builder.</CardDescription></CardHeader>
    <CardContent className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="search" aria-label="Search pages and site content" placeholder="Search pages and settings…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button variant="outline" aria-pressed={draftsOnly} onClick={() => setDraftsOnly(!draftsOnly)}>{draftsOnly ? "Show all content" : "Unpublished only"}</Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">{filtered.length} of {entries.length} documents</p>
      {!filtered.length && <Alert><SearchIcon /><AlertTitle>No matching content</AlertTitle><AlertDescription>Try another search or turn off the unpublished filter.</AlertDescription></Alert>}
      <ul className="flex flex-col divide-y divide-border">
        {filtered.map((entry) => {
          const Icon = entry.kind === "builder" ? LayoutTemplateIcon : entry.kind === "settings" ? SettingsIcon : FileTextIcon
          return <li key={entry.key} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-5" /></span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2"><Link href={entry.href} className="text-sm font-semibold underline-offset-4 hover:underline">{entry.title}</Link><Badge variant={entry.hasDraft ? "secondary" : "outline"}>{entry.hasDraft ? entry.live ? "Unpublished changes" : "Draft" : "Live"}</Badge>{entry.kind === "builder" && <Badge variant="outline">Builder</Badge>}</div>
                <p className="text-pretty text-sm leading-6 text-muted-foreground">{entry.description}</p>
                {entry.updatedAt && <p className="text-sm text-muted-foreground">Updated {new Date(entry.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}</p>}
              </div>
              <Link href={entry.href} className={buttonVariants({ variant: "outline", size: "sm" })}>{canEdit ? entry.kind === "builder" ? "Open builder" : "Edit content" : "View content"}</Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:ml-13">
              {entry.live && entry.routes.map((route) => <Link key={route} href={route} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}><ExternalLinkIcon data-icon="inline-start" />{entry.routes.length > 1 ? route : "View live"}</Link>)}
              {canEdit && entry.kind === "page" && <RebuildButton slug={entry.slug} label={entry.title} />}
            </div>
          </li>
        })}
      </ul>
    </CardContent>
  </Card>
}
