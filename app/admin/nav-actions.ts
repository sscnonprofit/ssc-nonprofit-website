"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { getPageRow } from "@/lib/cms/pages"
import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"

export type NavChild = { label: string; href: string; external?: boolean; children?: NavChild[] }
export type NavItem = { label: string; href?: string; children?: NavChild[] }
export type FooterGroup = { heading: string; links: NavChild[] }

const RESERVED = new Set(["", "admin", "api"])

function safeHref(value: unknown) {
  if (typeof value !== "string" || value.length > 500) throw new Error("Links must be valid text.")
  const href = value.trim()
  if (!href || RESERVED.has(href.replace(/^\//, "").split("/")[0])) throw new Error("That link is reserved.")
  if (!(href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://") || href.startsWith("#"))) {
    throw new Error("Links must be internal, external, or an anchor.")
  }
  return href
}

function safeLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > 80) throw new Error("Labels are required and must be short.")
  return value.trim()
}

function validateChild(input: unknown, nested = true): NavChild {
  const child = input as Partial<NavChild>
  // Keep one level of nested links (e.g. Short-Term Rehab → Accepted Insurance) so saving doesn't drop them.
  const children = nested && Array.isArray(child.children) ? child.children.slice(0, 20).map((c) => validateChild(c, false)) : []
  return {
    label: safeLabel(child.label),
    href: safeHref(child.href),
    ...(child.external ? { external: true } : {}),
    ...(children.length ? { children } : {}),
  }
}

function validateNav(input: unknown): NavItem[] {
  if (!Array.isArray(input) || input.length > 30) throw new Error("Navigation must be a list.")
  return input.map((raw) => {
    const item = raw as Partial<NavItem>
    const label = safeLabel(item.label)
    const children = Array.isArray(item.children) ? item.children.slice(0, 20).map((child) => validateChild(child)) : undefined
    if (children?.length) return { label, children }
    return { label, href: safeHref(item.href) }
  })
}

function validateFooter(input: unknown): FooterGroup[] {
  if (!Array.isArray(input) || input.length > 12) throw new Error("Footer navigation must be a list.")
  return input.map((raw) => {
    const group = raw as Partial<FooterGroup>
    if (!Array.isArray(group.links)) throw new Error("Footer groups need links.")
    return { heading: safeLabel(group.heading), links: group.links.slice(0, 20).map((link) => validateChild(link, false)) }
  })
}

async function saveDraft(content: { nav: NavItem[]; footer: FooterGroup[] }, userId: string) {
  const row = await getPageRow("site")
  if (!row) throw new Error("Site content is not initialized.")
  await db.update(pages).set({ draftContent: { ...(row.draftContent as object ?? row.content as object), ...content }, updatedBy: userId, updatedAt: new Date() }).where(eq(pages.slug, "site"))
}

export async function saveNavigationDraftAction(input: { nav: unknown; footer: unknown }) {
  try {
    const user = await requireEditor()
    const nav = validateNav(input.nav)
    const footer = validateFooter(input.footer)
    await saveDraft({ nav, footer }, user.id)
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not save navigation" }
  }
}

export async function publishNavigationAction() {
  try {
    const user = await requireAdmin()
    const row = await getPageRow("site")
    if (!row?.draftContent) return { ok: false as const, error: "There is no navigation draft to publish." }
    await db.update(pages).set({ content: row.draftContent, draftContent: null, status: "published", updatedBy: user.id, updatedAt: new Date() }).where(eq(pages.slug, "site"))
    await db.insert(pageRevisions).values({ pageSlug: "site", title: "Navigation", content: row.draftContent, editedBy: user.name, note: "Published navigation" })
    revalidatePath("/", "layout")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not publish navigation" }
  }
}

export async function discardNavigationDraftAction() {
  try {
    await requireEditor()
    await db.update(pages).set({ draftContent: null, updatedAt: new Date() }).where(eq(pages.slug, "site"))
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not discard navigation" }
  }
}

export async function getNavigationDraftAction() {
  try {
    await requireEditor()
    const row = await getPageRow("site")
    const content = (row?.draftContent ?? row?.content) as { nav?: NavItem[]; footer?: FooterGroup[] } | undefined
    return { ok: true as const, data: { nav: content?.nav ?? [], footer: content?.footer ?? [] } }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not load navigation" }
  }
}
