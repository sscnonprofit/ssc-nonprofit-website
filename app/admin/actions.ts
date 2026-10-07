"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"
import { getSessionUser, requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { getCmsDoc } from "@/lib/cms/registry"
import { validateLeadershipContent } from "@/lib/cms/leadership"

function parseContent(raw: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Content must be valid JSON. Check for a missing comma or bracket.")
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Content must be a JSON object, e.g. { \"title\": \"...\" }.")
  }
  return parsed as Record<string, unknown>
}

function revalidateDoc(slug: string) {
  const doc = getCmsDoc(slug)
  doc?.routes.forEach((route) => revalidatePath(route))
  revalidatePath("/admin")
  revalidatePath("/admin/pages")
  revalidatePath(`/admin/pages/${slug}`)
}

/** Saves a draft and snapshots it as a new revision. Any signed-in editor can do this. */
export async function saveDraftAction(slug: string, title: string, rawContent: string, note?: string) {
  const user = await requireEditor()
  if (!title.trim()) throw new Error("Title is required.")
  const content = parseContent(rawContent)
  if (slug === "leadership") validateLeadershipContent(content)

  await db
    .insert(pages)
    .values({ slug, title, content, draftContent: content, status: "draft", updatedBy: user.id })
    .onConflictDoUpdate({
      target: pages.slug,
      set: { title, draftContent: content, updatedBy: user.id, updatedAt: new Date() },
    })

  await db.insert(pageRevisions).values({
    pageSlug: slug,
    title,
    content,
    editedBy: user.id,
    note: note?.trim() || "Draft saved",
  })

  revalidateDoc(slug)
}

/** Copies the draft into the live/published column. Admin-only. */
export async function publishPageAction(slug: string) {
  const user = await requireAdmin()
  const [row] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
  if (!row) throw new Error("Page not found.")

  const contentToPublish = row.draftContent ?? row.content
  if (slug === "leadership") validateLeadershipContent(contentToPublish)
  await db
    .update(pages)
    .set({
      content: contentToPublish,
      draftContent: null,
      status: "published",
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(pages.slug, slug))

  revalidateDoc(slug)
}

/** Discards the in-progress draft, reverting to the last published version. */
export async function discardDraftAction(slug: string) {
  await requireEditor()
  await db.update(pages).set({ draftContent: null }).where(eq(pages.slug, slug))
  revalidateDoc(slug)
}

/** Loads an older revision back into the draft slot (does not auto-publish). */
export async function restoreRevisionAction(slug: string, revisionId: number) {
  const user = await requireEditor()
  const [revision] = await db.select().from(pageRevisions).where(eq(pageRevisions.id, revisionId)).limit(1)
  if (!revision || revision.pageSlug !== slug) throw new Error("Revision not found.")

  await db
    .update(pages)
    .set({ title: revision.title, draftContent: revision.content, updatedBy: user.id, updatedAt: new Date() })
    .where(eq(pages.slug, slug))

  revalidateDoc(slug)
}

export async function getCurrentUserAction() {
  return getSessionUser()
}
