import { desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"

export type PageRow = typeof pages.$inferSelect
export type PageRevisionRow = typeof pageRevisions.$inferSelect

/**
 * Reads the published content for a route. Used by public-facing pages.
 * Returns `null` if the slug has never been seeded — callers should treat
 * that as "content unavailable" rather than crash the page.
 */
export async function getPublishedContent<T = unknown>(slug: string): Promise<T | null> {
  const [row] = await db.select({ content: pages.content }).from(pages).where(eq(pages.slug, slug)).limit(1)
  return (row?.content as T | undefined) ?? null
}

/** Full row (published + draft) for the admin editor. */
export async function getPageRow(slug: string): Promise<PageRow | null> {
  const [row] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
  return row ?? null
}

/** All page rows, for the admin dashboard list. */
export async function listPageRows(): Promise<PageRow[]> {
  return db.select().from(pages)
}

/** Revision history for one page, newest first. */
export async function listRevisions(slug: string, limit = 25): Promise<PageRevisionRow[]> {
  return db
    .select()
    .from(pageRevisions)
    .where(eq(pageRevisions.pageSlug, slug))
    .orderBy(desc(pageRevisions.createdAt))
    .limit(limit)
}
