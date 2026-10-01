"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"
import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { getPageRow } from "@/lib/cms/pages"
import { isBuilderRow } from "@/lib/builder/pages"
import { newBuilderDoc, sanitizeDoc } from "@/lib/builder/registry"
import { slugify, validateSlug } from "@/lib/builder/schema"

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateBuilder(slug: string) {
  revalidatePath(`/${slug}`)
  revalidatePath("/admin")
  revalidatePath(`/admin/builder/${slug}`)
}

async function loadBuilderRow(slug: string) {
  const row = await getPageRow(slug)
  if (!row || !isBuilderRow(row)) throw new Error("Page not found.")
  return row
}

export async function createBuilderPageAction(input: { title: string; slug: string; template: string }): Promise<Result<{ slug: string }>> {
  const user = await requireEditor()
  const title = input.title.trim().slice(0, 120)
  const slug = slugify(input.slug || input.title)
  if (!title) return { ok: false, error: "Enter a page title." }
  const slugError = validateSlug(slug)
  if (slugError) return { ok: false, error: slugError }
  if (await getPageRow(slug)) return { ok: false, error: "A page with that URL already exists." }

  const doc = newBuilderDoc(title, input.template)
  await db.insert(pages).values({ slug, title, content: doc, draftContent: doc, status: "draft", updatedBy: user.id })
  await db.insert(pageRevisions).values({ pageSlug: slug, title, content: doc, editedBy: user.id, note: "Page created" })
  revalidateBuilder(slug)
  return { ok: true, data: { slug } }
}

/** Autosaves skip the revision log; manual saves record a restorable snapshot. */
export async function saveBuilderDraftAction(slug: string, input: unknown, options: { snapshot?: boolean; note?: string } = {}): Promise<Result> {
  const user = await requireEditor()
  await loadBuilderRow(slug)
  const doc = sanitizeDoc(input)
  await db.update(pages).set({ title: doc.title, draftContent: doc, updatedBy: user.id, updatedAt: new Date() }).where(eq(pages.slug, slug))
  if (options.snapshot) {
    await db.insert(pageRevisions).values({
      pageSlug: slug,
      title: doc.title,
      content: doc,
      editedBy: user.id,
      note: options.note?.trim().slice(0, 140) || "Draft saved",
    })
  }
  revalidatePath(`/${slug}`)
  return { ok: true }
}

export async function publishBuilderPageAction(slug: string, input?: unknown): Promise<Result> {
  const user = await requireAdmin()
  const row = await loadBuilderRow(slug)
  const doc = sanitizeDoc(input ?? row.draftContent ?? row.content)
  await db
    .update(pages)
    .set({ title: doc.title, content: doc, draftContent: null, status: "published", updatedBy: user.id, updatedAt: new Date() })
    .where(eq(pages.slug, slug))
  await db.insert(pageRevisions).values({ pageSlug: slug, title: doc.title, content: doc, editedBy: user.id, note: "Published" })
  revalidateBuilder(slug)
  return { ok: true }
}

export async function unpublishBuilderPageAction(slug: string): Promise<Result> {
  const user = await requireAdmin()
  const row = await loadBuilderRow(slug)
  await db
    .update(pages)
    .set({ status: "draft", draftContent: row.draftContent ?? row.content, updatedBy: user.id, updatedAt: new Date() })
    .where(eq(pages.slug, slug))
  revalidateBuilder(slug)
  return { ok: true }
}

export async function duplicateBuilderPageAction(slug: string): Promise<Result<{ slug: string }>> {
  const user = await requireEditor()
  const row = await loadBuilderRow(slug)
  const doc = sanitizeDoc(row.draftContent ?? row.content)
  let next = `${slug}-copy`.slice(0, 60)
  for (let n = 2; await getPageRow(next); n++) next = `${slug}-copy-${n}`.slice(0, 60)
  const copy = { ...doc, title: `${doc.title} (copy)` }
  await db.insert(pages).values({ slug: next, title: copy.title, content: copy, draftContent: copy, status: "draft", updatedBy: user.id })
  revalidateBuilder(next)
  return { ok: true, data: { slug: next } }
}

export async function deleteBuilderPageAction(slug: string): Promise<Result> {
  await requireAdmin()
  await loadBuilderRow(slug)
  await db.delete(pageRevisions).where(eq(pageRevisions.pageSlug, slug))
  await db.delete(pages).where(eq(pages.slug, slug))
  revalidateBuilder(slug)
  return { ok: true }
}

export async function checkSlugAction(slug: string): Promise<Result> {
  await requireEditor()
  const error = validateSlug(slug)
  if (error) return { ok: false, error }
  if (await getPageRow(slug)) return { ok: false, error: "A page with that URL already exists." }
  return { ok: true }
}
