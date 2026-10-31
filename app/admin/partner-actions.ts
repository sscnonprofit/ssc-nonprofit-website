"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import fallback from "@/content/pillars.json"
import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { getPartnerSection, remainingPartnerDraft, replacePartnerSection, validatePartnerSection } from "@/lib/cms/partners"
import { db } from "@/lib/db"
import { pages, pageRevisions } from "@/lib/db/schema"

export async function updatePartnersAction(input: unknown, mode: "draft" | "publish" | "discard", expectedVersion: string | null) {
  try {
    if (!["draft", "publish", "discard"].includes(mode)) return { ok: false as const, error: "Unknown partner action." }
    const user = mode === "publish" ? await requireAdmin() : await requireEditor()
    const section = mode === "discard" ? null : validatePartnerSection(input)
    const result = await db.transaction(async (tx) => {
      // Partners belong to the shared site, not a user's private workspace. Access is role-gated above.
      let [row] = await tx.select().from(pages).where(eq(pages.slug, "pillars")).for("update")
      if ((row?.updatedAt.toISOString() ?? null) !== expectedVersion) {
        return { ok: false as const, error: "Pillars content changed in another session. Reload this page before saving to avoid overwriting newer work." }
      }
      if (!row) {
        const [created] = await tx.insert(pages).values({ slug: "pillars", title: "Pillars", content: fallback, status: "published", updatedBy: user.id }).onConflictDoNothing().returning()
        if (!created) return { ok: false as const, error: "Another editor initialized this content. Reload the page and try again." }
        row = created
      }
      const live = row.content
      const nextSection = section ?? getPartnerSection(live)
      const content = mode === "publish" ? replacePartnerSection(live, nextSection) : live
      const draftContent = mode === "draft"
        ? replacePartnerSection(row.draftContent ?? live, nextSection)
        : remainingPartnerDraft(content, row.draftContent, nextSection)
      const updatedAt = new Date()
      await tx.update(pages).set({ content, draftContent, updatedAt, updatedBy: user.id }).where(eq(pages.id, row.id))
      await tx.insert(pageRevisions).values({
        pageSlug: "pillars", title: row.title, content: mode === "publish" ? content : draftContent ?? content, editedBy: user.id,
        note: mode === "publish" ? "Published partners" : mode === "discard" ? "Discarded partner draft" : "Partner draft saved",
      })
      return { ok: true as const, version: updatedAt.toISOString(), section: nextSection, liveSection: getPartnerSection(content) }
    })
    if (result.ok) {
      revalidatePath("/admin")
      revalidatePath("/admin/partners")
      revalidatePath("/admin/pages/pillars")
      if (mode === "publish") revalidatePath("/community-outreach")
    }
    return result
  } catch (error) {
    if (error instanceof Error && !("code" in error) && !("query" in error)) {
      return { ok: false as const, error: error.message }
    }
    return { ok: false as const, error: "Could not save partners. Please try again." }
  }
}
