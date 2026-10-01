import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { BuilderEditor } from "@/components/admin/builder/builder-editor"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { getPageRow, listRevisions } from "@/lib/cms/pages"
import { getTheme } from "@/lib/cms/theme-store"
import { themeToVars } from "@/lib/cms/theme"
import { isBuilderRow } from "@/lib/builder/pages"
import { sanitizeDoc } from "@/lib/builder/registry"

export const metadata: Metadata = { title: "Page builder", robots: { index: false, follow: false } }

export default async function BuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) redirect("/admin/sign-in")
  const { slug } = await params
  const row = await getPageRow(slug)
  if (!row || !isBuilderRow(row)) notFound()

  const [theme, revisions] = await Promise.all([getTheme({ draft: true }), listRevisions(slug, 30)])

  return (
    <BuilderEditor
      key={slug}
      slug={slug}
      initialDoc={sanitizeDoc(row.draftContent ?? row.content)}
      status={row.status}
      hasDraft={Boolean(row.draftContent)}
      isAdmin={user.role === "admin"}
      themeVars={themeToVars(theme, { allColors: true })}
      revisions={revisions.map((r) => ({ id: r.id, note: r.note, createdAt: r.createdAt.toISOString(), content: r.content }))}
    />
  )
}
