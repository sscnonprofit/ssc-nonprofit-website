"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { getPageRow, listRevisions } from "@/lib/cms/pages"
import { DEFAULT_THEME, sanitizeTheme, validateCustomCss, type ThemeSettings } from "@/lib/cms/theme"
import { THEME_SLUG } from "@/lib/cms/theme-store"
import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateSite() {
  revalidatePath("/", "layout")
}

async function upsertDraft(theme: ThemeSettings, userId: string) {
  const existing = await getPageRow(THEME_SLUG)
  if (existing) {
    await db
      .update(pages)
      .set({ draftContent: theme, updatedBy: userId, updatedAt: new Date() })
      .where(eq(pages.slug, THEME_SLUG))
  } else {
    await db.insert(pages).values({
      slug: THEME_SLUG,
      title: "Theme",
      content: DEFAULT_THEME,
      draftContent: theme,
      status: "published",
      updatedBy: userId,
    })
  }
}

export async function saveThemeDraftAction(input: unknown): Promise<Result> {
  try {
    const user = await requireEditor()
    const theme = sanitizeTheme(input)
    const raw = (input ?? {}) as { customCss?: unknown }

    if (typeof raw.customCss === "string") {
      const cssError = validateCustomCss(raw.customCss)
      if (cssError) return { ok: false, error: cssError }
    }

    // Custom CSS is admin-only: editors keep whatever is already stored.
    if (user.role !== "admin") {
      const row = await getPageRow(THEME_SLUG)
      const stored = row ? sanitizeTheme(row.draftContent ?? row.content) : DEFAULT_THEME
      theme.customCss = stored.customCss
    }

    await upsertDraft(theme, user.id)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save theme" }
  }
}

export async function publishThemeAction(): Promise<Result> {
  try {
    const user = await requireAdmin()
    const row = await getPageRow(THEME_SLUG)
    if (!row?.draftContent) return { ok: false, error: "There are no theme changes to publish." }
    const theme = sanitizeTheme(row.draftContent)

    await db
      .update(pages)
      .set({ content: theme, draftContent: null, status: "published", updatedBy: user.id, updatedAt: new Date() })
      .where(eq(pages.slug, THEME_SLUG))
    await db.insert(pageRevisions).values({
      pageSlug: THEME_SLUG,
      title: "Theme",
      content: theme,
      editedBy: user.name,
      note: "Published theme",
    })
    revalidateSite()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not publish theme" }
  }
}

export async function discardThemeDraftAction(): Promise<Result> {
  try {
    await requireEditor()
    await db.update(pages).set({ draftContent: null, updatedAt: new Date() }).where(eq(pages.slug, THEME_SLUG))
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not discard draft" }
  }
}

export async function resetThemeAction(): Promise<Result> {
  try {
    const user = await requireAdmin()
    await upsertDraft(DEFAULT_THEME, user.id)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reset theme" }
  }
}

export async function listThemeRevisionsAction(): Promise<
  Result<{ id: number; editedBy: string | null; note: string | null; createdAt: string }[]>
> {
  try {
    await requireEditor()
    const revisions = await listRevisions(THEME_SLUG, 30)
    return {
      ok: true,
      data: revisions.map((r) => ({
        id: r.id,
        editedBy: r.editedBy,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not load history" }
  }
}

/** Loads a past published theme into the draft so it can be reviewed before publishing. */
export async function restoreThemeRevisionAction(revisionId: number): Promise<Result<ThemeSettings>> {
  try {
    const user = await requireEditor()
    const [revision] = await db.select().from(pageRevisions).where(eq(pageRevisions.id, revisionId)).limit(1)
    if (!revision || revision.pageSlug !== THEME_SLUG) return { ok: false, error: "Revision not found" }
    const theme = sanitizeTheme(revision.content)
    if (user.role !== "admin") {
      const row = await getPageRow(THEME_SLUG)
      theme.customCss = row ? sanitizeTheme(row.draftContent ?? row.content).customCss : ""
    }
    await upsertDraft(theme, user.id)
    return { ok: true, data: theme }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not restore revision" }
  }
}
