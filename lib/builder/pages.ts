import { sanitizeDoc } from "@/lib/builder/registry"
import { isBuilderDoc, type BuilderDoc } from "@/lib/builder/schema"
import { getPageRow, listPageRows, type PageRow } from "@/lib/cms/pages"

export type BuilderPageSummary = {
  slug: string
  title: string
  status: string
  hasDraft: boolean
  updatedAt: string
  sectionCount: number
}

export function isBuilderRow(row: PageRow) {
  return isBuilderDoc(row.content) || isBuilderDoc(row.draftContent)
}

export async function listBuilderPages(): Promise<BuilderPageSummary[]> {
  const rows = await listPageRows()
  return rows
    .filter(isBuilderRow)
    .map((row) => {
      const doc = sanitizeDoc(row.draftContent ?? row.content)
      return {
        slug: row.slug,
        title: row.title,
        status: row.status,
        hasDraft: Boolean(row.draftContent),
        updatedAt: row.updatedAt.toISOString(),
        sectionCount: doc.sections.length,
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Public lookup: published content, or the draft while in draft mode. */
export async function getBuilderPage(slug: string, { draft = false } = {}): Promise<BuilderDoc | null> {
  const row = await getPageRow(slug)
  if (!row || !isBuilderRow(row)) return null
  if (draft) return sanitizeDoc(row.draftContent ?? row.content)
  if (row.status !== "published" || !isBuilderDoc(row.content)) return null
  return sanitizeDoc(row.content)
}
