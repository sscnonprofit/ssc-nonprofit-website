"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"
import { getSessionUser, requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { getCmsDoc } from "@/lib/cms/registry"
import { validateLeadershipContent } from "@/lib/cms/leadership"
import { getLeadershipDefaults } from "@/lib/cms/leadership-content"

/**
 * Server Actions have their thrown error messages redacted in production
 * builds (they surface to the client as an opaque "Server Components
 * render" error). These actions throw intentional, safe, user-facing
 * messages for expected failures (validation, not found, permissions), so
 * each action catches its own errors and returns them as data instead of
 * letting them escape as a thrown exception.
 */
export type ActionResult = { success: true } | { success: false; error: string }

function toActionResult(err: unknown, fallback: string): ActionResult {
  return { success: false, error: err instanceof Error ? err.message : fallback }
}

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
export async function saveDraftAction(
  slug: string,
  title: string,
  rawContent: string,
  note?: string,
): Promise<ActionResult> {
  try {
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
    return { success: true }
  } catch (err) {
    return toActionResult(err, "Failed to save draft.")
  }
}

/** Copies the draft into the live/published column. Admin-only. */
export async function publishPageAction(slug: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const [row] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)

    if (!row) {
      // The editor can show a page's default content (e.g. leadership, seeded
      // from company.json) before anyone has ever saved a draft, so there is
      // no row yet. Publishing in that state should publish those defaults
      // as the live version rather than failing with "not found" for a page
      // the admin can plainly see and is trying to publish.
      if (slug !== "leadership") throw new Error("Page not found. Save a draft first, then publish.")

      const doc = getCmsDoc(slug)
      const defaults = await getLeadershipDefaults()
      validateLeadershipContent(defaults)
      await db.insert(pages).values({
        slug,
        title: doc?.label ?? "Leadership",
        content: defaults,
        draftContent: null,
        status: "published",
        updatedBy: user.id,
      })
      revalidateDoc(slug)
      return { success: true }
    }

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
    return { success: true }
  } catch (err) {
    return toActionResult(err, "Failed to publish.")
  }
}

/** Discards the in-progress draft, reverting to the last published version. */
export async function discardDraftAction(slug: string): Promise<ActionResult> {
  try {
    await requireEditor()
    await db.update(pages).set({ draftContent: null }).where(eq(pages.slug, slug))
    revalidateDoc(slug)
    return { success: true }
  } catch (err) {
    return toActionResult(err, "Failed to discard draft.")
  }
}

/** Loads an older revision back into the draft slot (does not auto-publish). */
export async function restoreRevisionAction(slug: string, revisionId: number): Promise<ActionResult> {
  try {
    const user = await requireEditor()
    const [revision] = await db.select().from(pageRevisions).where(eq(pageRevisions.id, revisionId)).limit(1)
    if (!revision || revision.pageSlug !== slug) throw new Error("Revision not found.")

    await db
      .update(pages)
      .set({ title: revision.title, draftContent: revision.content, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(pages.slug, slug))

    revalidateDoc(slug)
    return { success: true }
  } catch (err) {
    return toActionResult(err, "Failed to restore revision.")
  }
}

export async function getCurrentUserAction() {
  return getSessionUser()
}
