"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { CAFE_MENU_PATH, CAFE_MENU_SLUG, DEFAULT_CAFE_MENU, getCafeMenu, menusEqual, validateCafeMenu } from "@/lib/cafe/menu"
import { db } from "@/lib/db"
import { pageRevisions, pages } from "@/lib/db/schema"

type Mode = "draft" | "publish" | "discard"

/**
 * Saves the café menu. Editors save drafts; only admins publish. `expectedVersion`
 * is the row's updatedAt the editor loaded, so two people can't overwrite each other.
 */
export async function updateCafeMenuAction(input: unknown, mode: Mode, expectedVersion: string | null) {
  try {
    if (!["draft", "publish", "discard"].includes(mode)) return { ok: false as const, error: "Unknown menu action." }
    const user = mode === "publish" ? await requireAdmin() : await requireEditor()
    const menu = mode === "discard" ? null : validateCafeMenu(input)
    const result = await db.transaction(async (tx) => {
      let [row] = await tx.select().from(pages).where(eq(pages.slug, CAFE_MENU_SLUG)).for("update")
      if ((row?.updatedAt.toISOString() ?? null) !== expectedVersion) {
        return { ok: false as const, error: "The café menu was changed in another session. Reload this page before saving so newer work isn't overwritten." }
      }
      if (!row) {
        // First save: the live menu starts as the empty default until someone publishes.
        const [created] = await tx.insert(pages)
          .values({ slug: CAFE_MENU_SLUG, title: "Café Menu", content: DEFAULT_CAFE_MENU, status: "published", updatedBy: user.id })
          .onConflictDoNothing().returning()
        if (!created) return { ok: false as const, error: "Another editor just created the menu. Reload the page and try again." }
        row = created
      }
      const live = getCafeMenu(row.content)
      const content = mode === "publish" ? menu! : live
      const draft = mode === "draft" && !menusEqual(menu!, live) ? menu! : null
      const updatedAt = new Date()
      await tx.update(pages).set({ content, draftContent: draft, updatedAt, updatedBy: user.id }).where(eq(pages.id, row.id))
      if (mode !== "discard")
        await tx.insert(pageRevisions).values({
          pageSlug: CAFE_MENU_SLUG, title: "Café Menu", content: menu!, editedBy: user.id,
          note: mode === "publish" ? "Published café menu" : "Café menu draft saved",
        })
      return { ok: true as const, version: updatedAt.toISOString(), menu: draft ?? content, live: content }
    })
    if (result.ok) {
      revalidatePath("/admin")
      revalidatePath("/admin/cafe-menu")
      if (mode === "publish") revalidatePath(CAFE_MENU_PATH)
    }
    return result
  } catch (error) {
    if (error instanceof Error && !("code" in error) && !("query" in error)) return { ok: false as const, error: error.message }
    return { ok: false as const, error: "Could not save the café menu. Please try again." }
  }
}
